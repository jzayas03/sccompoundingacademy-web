import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { Resend } from "resend";
import { stripe } from "@/lib/stripe";
import { recordInscripcion, type InscripcionRecord } from "@/lib/airtable";
import { buildConfirmationEmail } from "@/lib/emails/inscripcion-confirmacion";
import { buildInternalEmail } from "@/lib/emails/inscripcion-interna";
import { getCourseById, getCohortById, formatPrice } from "@/lib/courses";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/stripe — Stripe-signed event receiver.
 *
 * Handles `checkout.session.completed` events: builds the canonical
 * InscripcionRecord from session metadata + payment data, fans out to
 *
 *   1. Resend → student confirmation email (HTML + plain text)
 *   2. Resend → internal notification email to info@sccompoundingacademy.com
 *   3. Airtable → row in `Inscripciones` table
 *
 * Any single sub-step failing is logged but does NOT cause the webhook
 * to return non-200; Stripe retries indefinitely on non-2xx, which
 * would re-send emails and create duplicate Airtable rows. The webhook
 * is idempotent by design — Stripe's at-least-once delivery is the
 * source of truth, and our consumers tolerate replays.
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

  const session = event.data.object as Stripe.Checkout.Session;
  const md = (session.metadata ?? {}) as Record<string, string>;

  const course = getCourseById(md.curso_id ?? "");
  const cohort = getCohortById(md.cohorte_id ?? "");
  if (!course || !cohort) {
    console.error(
      "[stripe-webhook] session metadata missing/invalid course or cohort",
      { md, session_id: session.id },
    );
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
  const cohorteEtiqueta = cohort.id;
  const cohorteFechaInicio = cohort.startDate;
  const cohorteFechaFin = cohort.endDate;
  const montoFormatted = formatPrice(amountPaid);

  const record: InscripcionRecord = {
    nombre: md.nombre ?? "",
    email: session.customer_email ?? "",
    telefono: md.telefono ?? "",
    licencia: md.licencia || undefined,
    curso_id: course.id,
    cohorte_id: cohort.id,
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

  // Persist to Airtable (graceful: returns null if not configured).
  await recordInscripcion(record);

  const resend = getResend();
  if (resend && session.customer_email) {
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
        to: session.customer_email,
        replyTo: REPLY_TO,
        subject: conf.subject,
        html: conf.html,
        text: conf.text,
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
