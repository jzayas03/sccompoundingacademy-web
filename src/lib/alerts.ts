import { Resend } from "resend";

/**
 * Operational failure alerts.
 *
 * The Stripe webhook is deliberately resilient: if the DB upsert, Airtable
 * write, or an email send fails, it logs and still returns 200 so Stripe
 * doesn't retry forever (which would duplicate emails). The downside of
 * that design is SILENCE — a failure leaves no trace the owner would
 * notice. This sends a short alert email to the internal inbox the instant
 * a critical sub-step fails, so a degraded enrollment (paid in Stripe but
 * not recorded in the portal DB) gets human attention in minutes, not when
 * the student eventually complains.
 *
 * GRACEFUL: no-op when RESEND_API_KEY is missing. Never throws — an alert
 * failing must not cascade into the webhook handler.
 */

const FROM_ADDRESS =
  process.env.EMAIL_FROM ??
  process.env.RESEND_FROM ??
  "Santa Cruz Compounding Academy <noreply@sccompoundingacademy.com>";
const ALERT_RECIPIENT =
  process.env.ALERT_EMAIL ??
  process.env.EMAIL_REPLY_TO ??
  "info@sccompoundingacademy.com";

export async function sendOpsAlert(
  subject: string,
  details: Record<string, unknown>,
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[alert] RESEND_API_KEY missing — alert not sent:", subject);
    return;
  }
  try {
    const lines = Object.entries(details)
      .map(([k, v]) => `<p><strong>${escapeHtml(k)}:</strong> ${escapeHtml(stringify(v))}</p>`)
      .join("");
    await new Resend(key).emails.send({
      from: FROM_ADDRESS,
      to: ALERT_RECIPIENT,
      subject: `⚠️ [SCCA] ${subject}`,
      html: `<h2>Alerta operacional</h2><p>${escapeHtml(subject)}</p><hr/>${lines}`,
      text: `[SCCA ALERT] ${subject}\n\n${Object.entries(details)
        .map(([k, v]) => `${k}: ${stringify(v)}`)
        .join("\n")}`,
    });
  } catch (err) {
    // Last line of defence — alerting must never break the caller.
    console.error("[alert] failed to send ops alert", err);
  }
}

function stringify(v: unknown): string {
  if (typeof v === "string") return v;
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
