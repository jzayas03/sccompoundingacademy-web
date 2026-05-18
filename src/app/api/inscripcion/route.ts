import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { getCourseById, getCohortById } from "@/lib/courses";

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
 */

const InscripcionSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  telefono: z.string().trim().min(7).max(40),
  licencia: z.string().trim().max(60).optional().or(z.literal("")),
  curso_id: z.string().trim().min(1),
  cohorte_id: z.string().trim().min(1),
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
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Resolve catalogue references — fail fast if course/cohort don't exist
  // or if the cohort doesn't belong to the course (rejects URL tampering).
  const course = getCourseById(data.curso_id);
  const cohort = getCohortById(data.cohorte_id);
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

  const stripePriceId = process.env[course.stripePriceEnvKey];
  if (!stripePriceId) {
    console.error(
      `[inscripcion] Missing env var ${course.stripePriceEnvKey} — Stripe Price ID not configured for ${course.id}`,
    );
    return NextResponse.json(
      { error: "Servicio de cobro no configurado. Por favor escríbenos." },
      { status: 503 },
    );
  }

  // Build the URLs Stripe redirects to after the user completes/cancels
  // checkout. Use request origin so dev / preview / prod all work without
  // env-var coupling.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    req.headers.get("origin") ??
    `https://${req.headers.get("host") ?? "localhost:3000"}`;
  const successUrl = `${origin}/${data.locale}/inscripcion/exito?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/${data.locale}/inscripcion/cancelada`;

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
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
    });

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
