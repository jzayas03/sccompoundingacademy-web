import "server-only";

import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verificationDecisionPatch } from "./verification-decision";
import { signCheckoutToken } from "./verification-token";
import { getSiteUrl } from "@/lib/siteUrl";
import {
  buildVerificationApprovedEmail,
  buildVerificationRejectedEmail,
  buildCheckoutLinkEmail,
} from "@/lib/emails/verificacion";

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "SCCA <info@sccompoundingacademy.com>";

export type DecisionResult =
  | { status: "applied"; email: string | null }
  | { status: "already-decided"; email: string | null }
  | { status: "not-found" };

/**
 * Core matrícula approve/reject: flips the row, deletes the stored document
 * (best-effort — the outcome is the source of truth, the photo is not
 * retained), and emails the student. NO authorization here — the caller
 * authorizes (admin session in the portal, or a signed token from the
 * approve/reject email). Idempotent: only a still-`pending` row is acted
 * on, so a second click or a stale email link is a safe no-op.
 *
 * Email branching on approval (Task 5):
 *   - paidAt is null → pre-payment path: send a signed 48h "pay now" link.
 *   - paidAt is set  → in-portal path:   send the existing portal-access note.
 */
export async function applyVerificationDecision(
  userId: string,
  decision: "approved" | "rejected",
): Promise<DecisionResult> {
  // Also select paidAt so we can branch the approval email.
  const [row] = await db
    .select({
      email: users.email,
      doc: users.verificationDocUrl,
      current: users.studentVerification,
      paidAt: users.paidAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return { status: "not-found" };
  if (row.current !== "pending") {
    return { status: "already-decided", email: row.email };
  }

  // Capture the decision timestamp once so we can pass the SAME value to both
  // the DB patch (sets verifiedAt) and the checkout token (approvedAt). Task 6's
  // /pagar endpoint checks approvedAt === verifiedAt for freshness.
  const decidedAt = new Date();

  await db
    .update(users)
    .set(verificationDecisionPatch(decision, decidedAt))
    .where(eq(users.id, userId));

  // Best-effort blob cleanup — DB status is the source of truth.
  if (row.doc) {
    try {
      await del(row.doc);
    } catch (err) {
      console.error("[verificacion] blob delete failed", err);
    }
  }

  const key = process.env.RESEND_API_KEY;
  if (key && row.email) {
    let mail;
    if (decision === "rejected") {
      // Rejection path — unchanged.
      mail = buildVerificationRejectedEmail("es");
    } else if (row.paidAt) {
      // Already paid (in-portal verificacion path) — confirm portal access.
      mail = buildVerificationApprovedEmail("es");
    } else {
      // Pre-payment approval — send the signed 48h pay link.
      const token = signCheckoutToken({
        userId,
        approvedAt: decidedAt.getTime(),
      });
      const payUrl = `${getSiteUrl()}/api/inscripcion/pagar?token=${encodeURIComponent(token)}`;
      mail = buildCheckoutLinkEmail("es", payUrl);
    }
    try {
      await new Resend(key).emails.send({
        from: FROM_ADDRESS,
        to: row.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    } catch (err) {
      console.error("[verificacion] student email failed", err);
    }
  }

  return { status: "applied", email: row.email };
}
