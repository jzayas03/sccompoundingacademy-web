import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { Resend } from "resend";
import { stripe } from "@/lib/stripe";
import { recordInscripcion, type InscripcionRecord } from "@/lib/airtable";
import { buildConfirmationEmail } from "@/lib/emails/inscripcion-confirmacion";
import { buildInternalEmail } from "@/lib/emails/inscripcion-interna";
import { getCourseById, formatPrice } from "@/lib/courses";
import { getCohort, formatCohortLabel, formatCohortDate } from "@/lib/cohorts";
import { sql, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, processedStripeEvents } from "@/lib/db/schema";
import { initialVerificationFor } from "@/lib/portal/initial-verification";
import { notifyMatriculaReview } from "@/lib/portal/notify-matricula-review";
import { sendOpsAlert } from "@/lib/alerts";
import { webhookUserStrategy, studentPaidUpdate } from "@/lib/inscripcion/webhook-user";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/stripe — Stripe-signed event receiver.
 *
 * Handles `checkout.session.completed` events: builds the canonical
 * InscripcionRecord from session metadata + payment data, fans out to
 *
 *   1. Postgres `users` upsert  → sets paidAt / tier / stripeCustomerId
 *                                  so the portal dashboard unlocks
 *   2. Airtable                  → row in `Inscripciones` (operational
 *                                  triage view for the owner)
 *   3. Resend → student confirmation email (HTML + plain text)
 *   4. Resend → internal notification email to info@sccompoundingacademy.com
 *
 * Any single sub-step failing is logged but does NOT cause the webhook
 * to return non-200; Stripe retries indefinitely on non-2xx, which
 * would re-send emails and create duplicate rows. The webhook is
 * idempotent by design — Stripe's at-least-once delivery is the
 * source of truth, and our consumers tolerate replays:
 *   - Drizzle `onConflictDoUpdate` makes the user upsert replay-safe
 *   - Airtable inserts can dedupe by `stripe_session_id` in the base
 *   - Email sends would dupe on replay; that is the acceptable cost
 *
 * Signature verification with STRIPE_WEBHOOK_SECRET is mandatory —
 * without it, anyone with the public URL can forge a 'paid' event.
 *
 * Sender/reply addresses are env-driven so production can rotate them
 * without code changes:
 *   - EMAIL_FROM      e.g. "Santa Cruz Compounding Academy <noreply@sccompoundingacademy.com>"
 *   - EMAIL_REPLY_TO  e.g. "info@sccompoundingacademy.com"
 * Both default to the branded production values; the prior RESEND_FROM
 * env var is honoured as a fallback during the transition.
 */

const INTERNAL_RECIPIENT =
  process.env.EMAIL_REPLY_TO ?? "info@sccompoundingacademy.com";
const FROM_ADDRESS =
  process.env.EMAIL_FROM ??
  process.env.RESEND_FROM ??
  "Santa Cruz Compounding Academy <noreply@sccompoundingacademy.com>";
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? "info@sccompoundingacademy.com";

// "Información Importante" welcome packet (parking, schedule, dress code,
// course-material instructions) attached to every confirmation email.
// Resend downloads it from this hosted URL at send time, so the asset
// lives in `public/docs/`. We use the APEX domain on purpose — www
// redirects to the apex, and Resend does not follow redirects when
// fetching an attachment `path` (the same reason the Stripe webhook URL
// must be the apex). The recipient sees the accented display name.
const WELCOME_PACKET_URL =
  "https://sccompoundingacademy.com/docs/informacion-importante.pdf";
const WELCOME_PACKET_FILENAME = "Información Importante - SCCA.pdf";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[stripe-webhook] RESEND_API_KEY missing — emails skipped.");
    return null;
  }
  return new Resend(key);
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    console.error("[stripe-webhook] missing signature or STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Misconfigured webhook." }, { status: 500 });
  }

  // Stripe signature verification requires the raw request body byte-for-byte.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // We only care about the post-payment event for v1. New event types
  // can be added as new `case` blocks without restructuring.
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  // ── Idempotency claim ────────────────────────────────────────────────
  // Stripe delivers AT-LEAST-once: this exact event may have been handled
  // already (a prior delivery, or a manual "resend" from the dashboard).
  // Atomically claim it by inserting its id; if the row already exists the
  // insert no-ops and we short-circuit, so the confirmation + internal
  // emails are sent exactly once. Wrapped in try/catch: if the dedup table
  // is unreachable we fall through and process anyway — the user upsert is
  // already replay-safe (onConflictDoUpdate) and a duplicate email is a far
  // better failure than dropping a real enrollment.
  try {
    const claim = await db
      .insert(processedStripeEvents)
      .values({ eventId: event.id, eventType: event.type })
      .onConflictDoNothing({ target: processedStripeEvents.eventId })
      .returning({ eventId: processedStripeEvents.eventId });
    if (claim.length === 0) {
      // Already processed — acknowledge without re-running side effects.
      return NextResponse.json({ received: true, duplicate: event.id });
    }
  } catch (err) {
    console.error("[stripe-webhook] dedup claim failed — processing anyway", err);
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const md = (session.metadata ?? {}) as Record<string, string>;

  const course = getCourseById(md.curso_id ?? "");
  const cohort = await getCohort(md.cohorte_id ?? "");
  if (!course || !cohort) {
    console.error(
      "[stripe-webhook] session metadata missing/invalid course or cohort",
      { md, session_id: session.id },
    );
    // A real payment we can't attribute to a course/cohort — needs a human.
    await sendOpsAlert("Pago recibido con metadata inválida", {
      stripe_session_id: session.id,
      customer_email: session.customer_email ?? "",
      curso_id: md.curso_id ?? "(vacío)",
      cohorte_id: md.cohorte_id ?? "(vacío)",
      accion: "Reconciliar manualmente en el panel de Stripe.",
    });
    // Still return 200 so Stripe doesn't retry — this is unrecoverable
    // without operator intervention; the session lives in Stripe's
    // dashboard for manual reconciliation.
    return NextResponse.json({ received: true, error: "bad metadata" });
  }

  const locale = (md.locale === "en" ? "en" : "es") as "es" | "en";
  const amountPaid = session.amount_total ?? 0;
  const receiptUrl =
    // Stripe sometimes returns the receipt under different paths depending
    // on whether the PI was expanded; try both.
    (session as Stripe.Checkout.Session & { receipt_url?: string }).receipt_url ??
    undefined;

  // Derive the human-facing strings the email uses.
  const cursoTitulo = course.id; // i18n display happens in form/email at lookup time
  const cohorteEtiqueta = formatCohortLabel(cohort, locale);
  const cohorteFechaInicio = formatCohortDate(cohort.startDate, locale);
  const cohorteFechaFin = formatCohortDate(cohort.endDate, locale);
  const montoFormatted = formatPrice(amountPaid);

  // Derive tier from metadata, with a Stripe-coupon-based fallback for the
  // manual student-discount workflow: when the owner issues a Coupon code
  // worth ~$1,855 to a verified student, the Checkout amount drops to ~$495
  // even though the Price ID is the professional one. We treat that as a
  // student tier so downstream (Airtable, future portal DB) sees the truth.
  const metadataTier =
    md.tier === "student"
      ? "student"
      : md.tier === "profesional"
        ? "profesional"
        : null;
  const hasDiscount = (session.total_details?.amount_discount ?? 0) > 0;
  const tier: "profesional" | "student" =
    metadataTier ?? (hasDiscount ? "student" : "profesional");

  // Auth.js normalises emails to lowercase before inserting users on
  // sign-in (via Email provider's `normalizeIdentifier`). We must match
  // that here so the upsert hits the right row regardless of how the
  // student typed their email into the Stripe checkout form.
  const email = (session.customer_email ?? "").trim().toLowerCase();
  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  const record: InscripcionRecord = {
    nombre: md.nombre ?? "",
    email,
    telefono: md.telefono ?? "",
    licencia: md.licencia || undefined,
    curso_id: course.id,
    cohorte_id: cohort.id,
    tier,
    stripe_session_id: session.id,
    stripe_payment_intent: String(session.payment_intent ?? ""),
    monto_pagado_usd_cents: amountPaid,
    estado: "pagado",
    acepto_terminos: md.acepto_terminos === "true",
    acepto_timestamp: md.acepto_timestamp ?? "",
    acepto_ip: md.acepto_ip ?? "",
    acepto_user_agent: md.acepto_user_agent ?? "",
    acepto_version_docs: md.acepto_version_docs ?? "",
    notas: md.notas || undefined,
    locale,
  };

  // 1) Portal DB — persist payment so the portal dashboard unlocks.
  //
  //    Two paths depending on tier + session metadata:
  //
  //    A) Student tier with user_id  ("stamp-by-id" — new pre-payment flow):
  //       The row was created at enrollment and approved by the admin before
  //       the student paid. Only stamp paidAt/stripeCustomerId/cohortId.
  //       NEVER touch verification fields — the decision was already made.
  //       NEVER call notifyMatriculaReview — that email went out at review time.
  //
  //    B) Profesional tier, or legacy student without user_id ("upsert-by-email"):
  //       The original upsert-by-email path, unchanged, including the
  //       notifyMatriculaReview call for legacy students who arrive here pending.
  //
  //    In both cases Airtable + confirmation/internal emails below still run
  //    (they key off `email`, still set from session.customer_email).
  //
  //    Wrapped in try/catch so a DB outage does not block Airtable + emails —
  //    Stripe is the source of truth; a manual resend heals the DB.

  const userIdFromSession = md.user_id?.trim() || null;
  const dbStrategy = webhookUserStrategy(tier, userIdFromSession);

  if (dbStrategy === "stamp-by-id") {
    // ── Path A: Pre-payment review — student row already exists and is
    // approved. Stamp only payment fields; leave verification untouched.
    try {
      const [row] = await db
        .update(users)
        .set(studentPaidUpdate({ stripeCustomerId, cohortId: cohort.id }))
        .where(eq(users.id, userIdFromSession!))
        .returning({ id: users.id });
      if (!row) {
        // The approved row was expected to exist — alert the operator for
        // manual reconciliation. We still return 200 so Stripe doesn't retry
        // (the retried event would hit the same missing row).
        await sendOpsAlert("Pago estudiante sin fila correspondiente", {
          user_id: userIdFromSession,
          stripe_session_id: session.id,
          accion:
            "Reconciliar manualmente; la fila pendiente no fue hallada en la DB.",
        });
      }
    } catch (err) {
      console.error("[stripe-webhook] student paidAt update failed", err);
      // Release the idempotency claim so the operator can resend the event
      // from the Stripe dashboard to heal the DB.
      try {
        await db
          .delete(processedStripeEvents)
          .where(eq(processedStripeEvents.eventId, event.id));
      } catch (releaseErr) {
        console.error("[stripe-webhook] failed to release dedup claim", releaseErr);
      }
      await sendOpsAlert(
        "Pago estudiante OK pero falló el sello de pago en DB",
        {
          user_id: userIdFromSession,
          stripe_session_id: session.id,
          error: err,
          accion:
            "Reenviar el evento desde Stripe sana la DB.",
        },
      );
    }
    // notifyMatriculaReview is NOT called here — the review email already went
    // out when the admin approved the enrollment (before payment).
  } else if (email) {
    // ── Path B: Profesional tier, or legacy student without user_id.
    //    Upsert by email — original behaviour, unchanged.

    // ACPE-registry fields. `professionalType` holds the enrollee's
    // profession (farmaceutico / tecnico / a code / free text) for the
    // profesional tier; the student tier leaves it null.
    const phone = record.telefono || null;
    const license = record.licencia || null;
    const professionalType = md.tipo_profesional?.trim() || null;
    const studentVerification = initialVerificationFor(tier);
    // Matrícula photo uploaded on the enrollment form (student tier only).
    // Persisted on the row so the owner can review + approve via the emailed
    // link below. `matriculaSubmittedAt` doubles as the token's submission
    // stamp, so it must match the row's `verificationSubmittedAt`.
    const matriculaDocUrl =
      tier === "student" ? md.matricula_doc_url?.trim() || null : null;
    const matriculaSubmittedAt = tier === "student" ? new Date() : null;
    let upserted: { id: string; verification: string | null } | undefined;
    try {
      const [row] = await db
        .insert(users)
        .values({
          email,
          name: record.nombre || null,
          tier,
          studentVerification,
          verificationDocUrl: matriculaDocUrl,
          verificationSubmittedAt: matriculaSubmittedAt,
          paidAt: new Date(),
          stripeCustomerId,
          cohortId: cohort.id,
          phone,
          license,
          professionalType,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            name: record.nombre || undefined,
            tier,
            // Preserve an existing approval across webhook replays / duplicate
            // events; only (re)set to pending when not already approved.
            ...(tier === "student"
              ? {
                  studentVerification: sql`case when ${users.studentVerification} = 'approved' then ${users.studentVerification} else 'pending'::"public"."student_verification_status" end`,
                  verificationDocUrl: matriculaDocUrl,
                  verificationSubmittedAt: matriculaSubmittedAt,
                }
              : {}),
            paidAt: new Date(),
            stripeCustomerId,
            cohortId: cohort.id,
            phone,
            license,
            professionalType,
          },
        })
        .returning({ id: users.id, verification: users.studentVerification });
      upserted = row;
    } catch (err) {
      console.error("[stripe-webhook] users upsert failed", err);
      // The student paid but the portal DB didn't record it — their
      // dashboard won't unlock. RELEASE the idempotency claim so a manual
      // "resend" from the Stripe dashboard reprocesses this event and heals
      // the DB (the upsert is itself replay-safe). The only cost is that a
      // resend will re-send the confirmation email — an acceptable, operator-
      // initiated trade-off. Best-effort: if the release itself fails, the
      // alert below still tells the owner to fix the DB directly.
      try {
        await db
          .delete(processedStripeEvents)
          .where(eq(processedStripeEvents.eventId, event.id));
      } catch (releaseErr) {
        console.error("[stripe-webhook] failed to release dedup claim", releaseErr);
      }
      // Alert so the owner can act before the student is locked out.
      // (Airtable + emails below still run.)
      await sendOpsAlert("Pago OK pero falló el upsert en la base del portal", {
        email,
        stripe_session_id: session.id,
        tier,
        cohorte_id: cohort.id,
        error: err,
        accion:
          "Verificar la DB (Neon). El registro está en Stripe/Airtable; reenviar el evento desde el panel de Stripe sana la DB.",
      });
    }

    // Email the admin to review the freshly-uploaded matrícula (only when it
    // landed as pending — never re-pings an already-approved re-enrollment).
    // The event-level dedup at the top of the handler keeps this to one
    // email per enrollment.
    if (
      upserted &&
      tier === "student" &&
      upserted.verification === "pending" &&
      matriculaSubmittedAt
    ) {
      await notifyMatriculaReview({
        userId: upserted.id,
        name: record.nombre || null,
        email,
        docUrl: matriculaDocUrl,
        submittedAt: matriculaSubmittedAt,
      });
    }
  }

  // A paid enrollment just consumed a seat in this cohort. Purge the
  // statically-rendered marketing tree so the landing + /cursos "cupos
  // disponibles" reflect it on the very next visit (the admin cohort
  // actions already do the same on capacity/open-state changes). Best-
  // effort: a cache-revalidation hiccup must never fail the webhook — the
  // payment is already recorded and the ISR `revalidate` window is the
  // backstop.
  try {
    revalidatePath("/", "layout");
  } catch (err) {
    console.error("[stripe-webhook] revalidatePath failed", err);
  }

  // 2) Airtable (graceful: returns null if not configured).
  await recordInscripcion(record);

  const resend = getResend();
  if (resend && email) {
    const conf = buildConfirmationEmail({
      nombre: record.nombre,
      cursoTitulo,
      cohorteEtiqueta,
      cohorteFechaInicio,
      cohorteFechaFin,
      montoFormatted,
      receiptUrl,
      locale,
    });
    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: email,
        replyTo: REPLY_TO,
        subject: conf.subject,
        html: conf.html,
        text: conf.text,
        attachments: [
          {
            filename: WELCOME_PACKET_FILENAME,
            path: WELCOME_PACKET_URL,
          },
        ],
      });
    } catch (err) {
      console.error("[stripe-webhook] confirmation email failed", err);
    }

    const internal = buildInternalEmail({
      nombre: record.nombre,
      email: record.email,
      telefono: record.telefono,
      licencia: record.licencia,
      cursoTitulo,
      cohorteEtiqueta,
      montoFormatted,
      stripeSessionId: session.id,
      notas: record.notas,
      acepto_timestamp: record.acepto_timestamp,
      acepto_ip: record.acepto_ip,
      locale,
    });
    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: INTERNAL_RECIPIENT,
        replyTo: record.email || REPLY_TO,
        subject: internal.subject,
        html: internal.html,
        text: internal.text,
      });
    } catch (err) {
      console.error("[stripe-webhook] internal email failed", err);
    }
  }

  return NextResponse.json({ received: true });
}
