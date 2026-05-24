import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { getCourseById, getPricingByTier } from "@/lib/courses";
import { getCohort } from "@/lib/cohorts";
import { getSiteUrl } from "@/lib/siteUrl";

export const runtime = "nodejs";

/**
 * POST /api/inscripcion — student-data form submission.
 *
 * Validates the form payload, creates a Stripe Checkout Session that
 * carries every datum needed by the webhook (legal acceptance audit
 * trail included) in session metadata, and returns the hosted-checkout
 * URL for the client to redirect to.
 *
 * No DB write happens here — the webhook (POST /api/webhooks/stripe)
 * persists to Airtable only after `checkout.session.completed` fires.
 * This guarantees Airtable rows correspond 1:1 to paid enrollments,
 * never to abandoned-checkout intents.
 *
 * Tier selection ("pharmacist" $2,350 vs "student" $495): the client
 * sends `tier`, this route resolves the corresponding Stripe Price ID
 * via the course catalogue. Tier-eligibility checks (institutional
 * email allowlist for the student tier) live in Phase A of the portal
 * PR; for landing-page MVP the form trusts the client choice and the
 * tier travels through to the webhook so it can be persisted on
 * `users.tier` once the portal DB exists.
 */

const InscripcionSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  telefono: z.string().trim().min(7).max(40),
  licencia: z.string().trim().max(60).optional().or(z.literal("")),
  curso_id: z.string().trim().min(1),
  cohorte_id: z.string().trim().min(1),
  tier: z.enum(["profesional", "student"]),
  // Profession captured for the profesional tier — "farmaceutico" /
  // "tecnico" (ACPE registry), a profession code (medico/…), or the free
  // text typed under "Otro". Free-form string; empty for the student tier.
  tipo_profesional: z.string().trim().max(80).optional().or(z.literal("")),
  notas: z.string().trim().max(1000).optional().or(z.literal("")),
  acepto_terminos: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar los Términos, Privacidad y Reembolsos." }),
  }),
  acepto_version_docs: z.string().trim().min(1),
  locale: z.enum(["es", "en"]),
});

export type InscripcionPayload = z.infer<typeof InscripcionSchema>;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = InscripcionSchema.safeParse(body);
  if (!parsed.success) {
    // User-facing sentence (consistent with every other error in this
    // route). `issues` keeps the flattened Zod detail for debugging —
    // the client ignores it. The raw "validation" code used to leak
    // straight to the form's error banner.
    return NextResponse.json(
      {
        error:
          "Revisa los datos del formulario — hay un campo incompleto o con formato inválido (por ejemplo el correo electrónico).",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Resolve catalogue references — fail fast if course/cohort don't exist
  // or if the cohort doesn't belong to the course (rejects URL tampering).
  const course = getCourseById(data.curso_id);
  const cohort = await getCohort(data.cohorte_id);
  if (!course || !cohort || cohort.courseId !== course.id) {
    return NextResponse.json({ error: "Curso o cohorte inválido." }, { status: 400 });
  }
  if (!cohort.openForEnrollment) {
    return NextResponse.json({ error: "Cohorte cerrada para inscripciones." }, { status: 400 });
  }

  // Capture audit-trail facts from the request (server-side, can't be
  // spoofed by the client). The browser-supplied legal-acceptance flag
  // gets timestamped/IP-stamped here.
  const ipHeader =
    req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const ip = ipHeader.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  const acceptedAt = new Date().toISOString();

  const pricing = getPricingByTier(course, data.tier);
  if (!pricing) {
    return NextResponse.json({ error: "Tier de precio inválido." }, { status: 400 });
  }
  const stripePriceId = process.env[pricing.stripePriceEnvKey];
  if (!stripePriceId) {
    console.error(
      `[inscripcion] Missing env var ${pricing.stripePriceEnvKey} — Stripe Price ID not configured for ${course.id}/${data.tier}`,
    );
    return NextResponse.json(
      { error: "Servicio de cobro no configurado. Por favor escríbenos." },
      { status: 503 },
    );
  }

  // Build the URLs Stripe redirects to after the user completes/cancels
  // checkout. `getSiteUrl()` rejects misconfigured `.vercel.app` env
  // values so users always land back on the canonical custom domain;
  // dev still gets localhost via `NODE_ENV`.
  const origin = getSiteUrl();
  const successUrl = `${origin}/${data.locale}/inscripcion/exito?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/${data.locale}/inscripcion/cancelada`;

  // Stripe idempotency key — deterministic over the *intent* of the
  // submission (same email + course + cohort + tier + locale → same
  // Checkout Session URL). A double-click or a network-retry within
  // Stripe's 24h idempotency window returns the existing session
  // instead of creating a duplicate. Excludes `acceptedAt` so the key
  // is actually stable across the two requests.
  const idempotencyKey = createHash("sha256")
    .update(
      [
        data.email.trim().toLowerCase(),
        data.curso_id,
        data.cohorte_id,
        data.tier,
        data.locale,
      ].join(":"),
    )
    .digest("hex");

  try {
    const session = await stripe().checkout.sessions.create(
      {
      mode: "payment",
      // Surfaces the optional "promotion code" field on Stripe Checkout.
      // Full-price enrollees are unaffected; it only does anything when a
      // valid code is entered. The webhook already reads
      // `total_details.amount_discount` for the manual student-discount
      // workflow, so this completes that feature end-to-end.
      allow_promotion_codes: true,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer_email: data.email,
      // EVERY datum the webhook needs travels here. Metadata is limited
      // to ~50 keys × 500 chars/value — well within our needs.
      metadata: {
        nombre: data.nombre,
        telefono: data.telefono,
        licencia: data.licencia ?? "",
        curso_id: data.curso_id,
        cohorte_id: data.cohorte_id,
        tier: data.tier,
        tipo_profesional: data.tipo_profesional ?? "",
        notas: (data.notas ?? "").slice(0, 480),
        acepto_terminos: "true",
        acepto_timestamp: acceptedAt,
        acepto_ip: ip,
        acepto_user_agent: userAgent.slice(0, 480),
        acepto_version_docs: data.acepto_version_docs,
        locale: data.locale,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Surface the receipt URL to the student on the success page.
      payment_intent_data: {
        receipt_email: data.email,
      },
      // PR isn't in Stripe Tax's auto-collection roster yet; collect IVU
      // manually once owner confirms with their accountant (set
      // `automatic_tax: { enabled: true }` later if/when SCCA registers).
      locale: data.locale === "es" ? "es" : "en",
      },
      { idempotencyKey },
    );

    if (!session.url) {
      return NextResponse.json({ error: "Stripe no devolvió URL de checkout." }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[inscripcion] Stripe error", err);
    return NextResponse.json(
      { error: "No se pudo iniciar el cobro. Intenta nuevamente o escríbenos." },
      { status: 500 },
    );
  }
}
