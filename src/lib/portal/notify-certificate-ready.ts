import "server-only";

import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { certificateEmails } from "@/lib/db/schema";
import { isEligibleForCertificate, programForTier } from "@/lib/certificates";
import { buildCertificateReadyEmail } from "@/lib/emails/certificado";
import { getSiteUrl } from "@/lib/siteUrl";
import type { UserTier } from "@/lib/curriculum";

const FROM_ADDRESS =
  process.env.EMAIL_FROM ??
  process.env.RESEND_FROM ??
  "Santa Cruz Compounding Academy <noreply@sccompoundingacademy.com>";
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? "info@sccompoundingacademy.com";

/**
 * Fire-once "your certificate is ready" email.
 *
 * Called from the post-test submit action after a passing attempt is
 * recorded. Sends only when EVERY required module post-test is passed,
 * and only once per user — deduped by the `certificate_emails` ledger
 * (claim-before-send: we insert the row first, and only the caller that
 * actually inserts it proceeds to send; a transient send failure rolls
 * the claim back so a later pass can retry).
 *
 * Best-effort by contract: any failure (not eligible, already sent, DB
 * or Resend error, migration not yet applied) is swallowed and logged —
 * it must never break quiz submission. The certificate is downloadable
 * from the portal regardless of this email.
 */
export async function notifyCertificateReadyIfEligible(p: {
  userId: string;
  name: string | null;
  email: string | null;
  tier: UserTier;
  locale: "es" | "en";
}): Promise<void> {
  try {
    const key = process.env.RESEND_API_KEY;
    if (!key || !p.email) return;

    const report = await isEligibleForCertificate(p.userId, p.tier);
    if (!report.eligible) return;

    // Claim the send. If a row already exists, this inserts nothing and we
    // stop — never re-send on retakes.
    const claimed = await db
      .insert(certificateEmails)
      .values({ userId: p.userId })
      .onConflictDoNothing()
      .returning({ userId: certificateEmails.userId });
    if (claimed.length === 0) return;

    try {
      const certUrl = `${getSiteUrl()}/${p.locale}/portal/certificado`;
      const mail = buildCertificateReadyEmail({
        nombre: p.name ?? "",
        locale: p.locale,
        certUrl,
        program: programForTier(p.tier),
      });
      const resend = new Resend(key);
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: p.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        replyTo: REPLY_TO,
      });
    } catch (sendErr) {
      // Roll the claim back so a subsequent eligible submit can retry.
      await db.delete(certificateEmails).where(eq(certificateEmails.userId, p.userId));
      throw sendErr;
    }
  } catch (err) {
    console.warn(
      "[notifyCertificateReady] skipped:",
      err instanceof Error ? err.message : String(err),
    );
  }
}
