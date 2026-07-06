import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { getCourseById, getPricingByTier } from "@/lib/courses";
import { getCohort, enrollmentCountByCohort } from "@/lib/cohorts";
import { getSiteUrl } from "@/lib/siteUrl";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { notifyMatriculaReview } from "@/lib/portal/notify-matricula-review";
import { buildPendingStudentValues } from "@/lib/inscripcion/pending-enrollment";
import { inscripcionSchema } from "@/lib/inscripcion/schema";

export const runtime = "nodejs";

/**
 * POST /api/inscripcion — enrollment form submission (two distinct paths).
 *
 * **Student tier** (`tier === "student"`):
 *   Persists a pending DB row (paidAt stays null) carrying every datum the
 *   post-approval checkout + webhook will need, then emails the admin to
 *   review the uploaded matrícula photo. No Stripe session is created here.
 *   The student receives a pay link only after the owner approves via
 *   `applyVerificationDecision` → POST /api/inscripcion/pagar.
 *
 * **Profesional tier** (`tier === "profesional"`):
 *   No DB write before payment. Creates a Stripe Checkout Session that
 *   carries every datum needed by the webhook (legal-acceptance audit trail
 *   included) in session metadata, and returns the hosted-checkout URL for
 *   the client to redirect to. The webhook (POST /api/webhooks/stripe)
 *   persists the row only after `checkout.session.completed` fires, so DB
 *   rows correspond 1:1 to paid enrollments.
 */

export type InscripcionPayload = z.infer<typeof inscripcionSchema>;

/**
 * Stripe idempotency key for a checkout submission.
 *
 * Stripe REJECTS a reused key whose request parameters differ from the
 * first use: "Keys for idempotent requests can only be used with the same
 * parameters they were first used with." The audit metadata we attach to
 * the Checkout Session — `acepto_timestamp` (always `new Date()`),
 * `acepto_ip`, `acepto_user_agent` — varies on every POST. So the key MUST
 * incorporate that volatile data: otherwise a second enrollment attempt for
 * the same (email, course, cohort, tier, locale) within Stripe's 24h
 * idempotency window reuses the key with a fresh timestamp and Stripe
 * throws — surfacing to the student as "No se pudo iniciar el cobro".
 *
 * Including `acceptedAt` (millisecond-precise server time) makes every
 * distinct submission produce a distinct key, so the mismatch can't happen.
 * An exact network-level retry of the SAME request (same acceptedAt) still
 * shares the key and dedupes, which is the only thing an idempotency key
 * usefully buys us here. Double-click is already guarded client-side (the
 * submit button disables on first click), so we lose nothing.
 *
 * The previous implementation deliberately EXCLUDED acceptedAt to keep the
 * key "stable" — but the body it was used with was not stable, which is
 * exactly what Stripe forbids. That was the root cause of the intermittent
 * enrollment failures (first attempt per combo worked; every retry failed).
 */
export function checkoutIdempotencyKey(parts: {
  email: string;
  cursoId: string;
  cohorteId: string;
  tier: string;
  locale: string;
  acceptedAt: string;
}): string {
  return createHash("sha256")
    .update(
      [
        parts.email.trim().toLowerCase(),
        parts.cursoId,
        parts.cohorteId,
        parts.tier,
        parts.locale,
        parts.acceptedAt,
      ].join(":"),
    )
    .digest("hex");
}

export async function POST(req: Request) {
  // ── Abuse shield 1: per-IP rate limit ────────────────────────────────
  // Cheapest check first, before parsing or any Stripe call. Caps how fast
  // a single source can spin up Checkout Sessions (bot spam, card-testing
  // probes). 8 attempts/minute is generous for a human filling a form,
  // hostile to a script. No-op when Upstash isn't configured.
  const ip = clientIp(req);
  const rl = await rateLimit("inscripcion", ip, 8, 60);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento e inténtalo de nuevo." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = inscripcionSchema.safeParse(body);
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

  // ── Abuse shield 2: Cloudflare Turnstile (CAPTCHA) ───────────────────
  // Proves a human (well, a browser that solved the challenge) is behind
  // this submission. No-op when TURNSTILE_SECRET_KEY isn't configured.
  const turnstile = await verifyTurnstile(data.turnstile_token, ip);
  if (!turnstile.success) {
    console.warn("[inscripcion] Turnstile rejected", {
      ip,
      errorCodes: turnstile.errorCodes,
    });
    return NextResponse.json(
      {
        error:
          "No pudimos verificar que eres una persona. Recarga la página e inténtalo de nuevo.",
      },
      { status: 403 },
    );
  }

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

  // Student tier requires the matrícula photo uploaded before checkout, and
  // it must be one of our own Blob URLs (the upload route only mints those).
  // This gates the discounted student price on a document the owner reviews
  // (then approves via the emailed link), rather than being self-selectable.
  // Accept both public and private Blob hosts. The matrícula store is private
  // (identity document), so fresh uploads land on `…private.blob…`; `public`
  // stays accepted for backward compatibility.
  const BLOB_URL_RE =
    /^https:\/\/[a-z0-9]+\.(?:public|private)\.blob\.vercel-storage\.com\//;
  const matriculaDocUrl =
    data.tier === "student" ? (data.matricula_doc_url ?? "").trim() : "";
  if (data.tier === "student" && !BLOB_URL_RE.test(matriculaDocUrl)) {
    return NextResponse.json(
      { error: "Sube una foto de tu matrícula activa para inscribirte como estudiante." },
      { status: 400 },
    );
  }

  // Capture audit-trail facts from the request (server-side, can't be
  // spoofed by the client). The browser-supplied legal-acceptance flag
  // gets timestamped/IP-stamped here. `ip` is the same client IP resolved
  // at the top of the handler for rate limiting.
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  const acceptedAt = new Date().toISOString();

  // ── Student tier: review BEFORE payment ──────────────────────────────
  // Persist a pending row (paidAt stays null) carrying every datum the
  // post-approval checkout + webhook need, then email the admin to review.
  // No Stripe session is created here; the student receives a pay link only
  // after the owner approves (see applyVerificationDecision + /api/inscripcion/pagar).
  if (data.tier === "student") {
    const submittedAt = new Date();
    const lowercasedEmail = data.email.trim().toLowerCase();
    const { insertValues, conflictSet } = buildPendingStudentValues({
      email: data.email,
      name: data.nombre,
      telefono: data.telefono,
      cohortId: cohort.id,
      matriculaDocUrl,
      submittedAt,
      acceptedAt,
      ip,
      userAgent,
      aceptoVersionDocs: data.acepto_version_docs,
    });
    try {
      // Pre-check: if a paid row exists, return 409 BEFORE running the upsert.
      // The onConflictDoUpdate would overwrite verifiedAt / rejectedAt / audit
      // columns even for a paid+approved enrollment — corrupting the record.
      // paidAt is only ever set by the Stripe webhook and is never unset, so
      // a non-null value means the student has already completed checkout.
      const existingRows = await db
        .select({ id: users.id, paidAt: users.paidAt })
        .from(users)
        .where(eq(users.email, lowercasedEmail))
        .limit(1);
      const [existingRow] = existingRows;
      if (existingRow?.paidAt) {
        return NextResponse.json(
          { error: "Ya tienes una inscripción registrada con este correo. Escríbenos si necesitas ayuda." },
          { status: 409 },
        );
      }

      const [row] = await db
        .insert(users)
        .values(insertValues)
        .onConflictDoUpdate({
          target: users.email,
          set: conflictSet,
        })
        .returning({ id: users.id, studentVerification: users.studentVerification });

      if (!row) {
        // Defensive: onConflictDoUpdate should always return a row.
        return NextResponse.json(
          { error: "No pudimos registrar tu matrícula. Intenta nuevamente o escríbenos." },
          { status: 500 },
        );
      }

      await notifyMatriculaReview({
        userId: row.id,
        name: data.nombre || null,
        email: lowercasedEmail,
        docUrl: matriculaDocUrl,
        submittedAt,
      });
    } catch (err) {
      console.error("[inscripcion] student pending upsert failed", err);
      return NextResponse.json(
        { error: "No pudimos registrar tu matrícula. Intenta nuevamente o escríbenos." },
        { status: 500 },
      );
    }
    return NextResponse.json({ pending: true });
  }

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
  //
  // Path segments are locale-specific (per `src/i18n/routing.ts`
  // pathnames map): `/inscripcion/...` for ES, `/enroll/...` for EN.
  // Using the matching segment avoids the next-intl middleware rewrite
  // that an EN user would otherwise see post-checkout.
  // Capacity guard — the profesional tier pays immediately with no human
  // approval gate, so this is the only thing between a full cohort and an
  // oversell. Seats taken = PAID enrollees (same count the public seat meter
  // shows, so the two never disagree). If the cohort is already at capacity,
  // refuse before opening a Stripe session. There is still a tiny
  // time-of-check/pay race (two simultaneous payments) — acceptable at this
  // scale — but this closes the ordinary case. Best-effort: a count-query
  // failure falls through to Stripe rather than hard-blocking a legitimate
  // enrollment.
  try {
    const paid = (await enrollmentCountByCohort()).get(cohort.id) ?? 0;
    if (paid >= cohort.capacity) {
      return NextResponse.json(
        {
          error:
            "Este cohorte ya está lleno. Escríbenos y te avisamos del próximo cupo disponible.",
        },
        { status: 409 },
      );
    }
  } catch (err) {
    console.error("[inscripcion] capacity check failed, allowing", err);
  }

  const origin = getSiteUrl();
  const isEn = data.locale === "en";
  const successPath = isEn ? "enroll/success" : "inscripcion/exito";
  const cancelPath = isEn ? "enroll/cancelled" : "inscripcion/cancelada";
  const successUrl = `${origin}/${data.locale}/${successPath}?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/${data.locale}/${cancelPath}`;

  // Stripe idempotency key — see `checkoutIdempotencyKey` for the full
  // rationale. It MUST include `acceptedAt` because the request body
  // carries that (and ip / user-agent) as audit metadata; a key reused
  // with a different body is rejected by Stripe, which was the root cause
  // of intermittent enrollment failures on retries.
  const idempotencyKey = checkoutIdempotencyKey({
    email: data.email,
    cursoId: data.curso_id,
    cohorteId: data.cohorte_id,
    tier: data.tier,
    locale: data.locale,
    acceptedAt,
  });

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
        // Empty for profesional; the webhook stores it on the student's row.
        matricula_doc_url: matriculaDocUrl,
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
    // Surface Stripe's own type/code/message explicitly — the bare object
    // was opaque in Vercel's log table and made this bug hard to diagnose.
    const e = err as { type?: string; code?: string; message?: string };
    console.error("[inscripcion] Stripe error", {
      type: e?.type,
      code: e?.code,
      message: e?.message,
    });
    return NextResponse.json(
      { error: "No se pudo iniciar el cobro. Intenta nuevamente o escríbenos." },
      { status: 500 },
    );
  }
}
