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
  | {
      status: "applied";
      email: string | null;
      /** Whether the student notification email was accepted by Resend. */
      emailSent: boolean;
      /** Resend's error message when the send was rejected, for surfacing. */
      emailError?: string;
    }
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
  let emailSent = false;
  let emailError: string | undefined;
  if (key && row.email) {
    let mail;
    // `kind` labels the branch in logs so we can tell, for a given approval,
    // which email was attempted (pay-link vs portal-access vs rejection).
    let kind: string;
    if (decision === "rejected") {
      // Rejection path — unchanged.
      mail = buildVerificationRejectedEmail("es");
      kind = "rejected";
    } else if (row.paidAt) {
      // Already paid (in-portal verificacion path) — confirm portal access.
      mail = buildVerificationApprovedEmail("es");
      kind = "approved-paid";
    } else {
      // Pre-payment approval — send the signed 48h pay link.
      const token = signCheckoutToken({
        userId,
        approvedAt: decidedAt.getTime(),
      });
      const payUrl = `${getSiteUrl()}/api/inscripcion/pagar?token=${encodeURIComponent(token)}`;
      mail = buildCheckoutLinkEmail("es", payUrl);
      kind = "pay-link";
    }
    try {
      // The Resend SDK does NOT throw on API errors — it resolves with
      // `{ data, error }`. The old code awaited the send but discarded the
      // result, so a rejected send (unverified sender, bad recipient, rate
      // limit) failed silently: no email, no log, approval reported success.
      // Capture the error, log it, and surface it via the return value.
      const { error } = await new Resend(key).emails.send({
        from: FROM_ADDRESS,
        to: row.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
      if (error) {
        emailError =
          typeof error === "string"
            ? error
            : (error.message ?? JSON.stringify(error));
        console.error("[verificacion] student email rejected by Resend", {
          kind,
          to: row.email,
          error,
        });
      } else {
        emailSent = true;
        console.log("[verificacion] student email sent", {
          kind,
          to: row.email,
        });
      }
    } catch (err) {
      emailError = (err as Error).message;
      console.error("[verificacion] student email threw", {
        kind,
        to: row.email,
        err,
      });
    }
  } else if (!key) {
    console.error(
      "[verificacion] RESEND_API_KEY missing — student email skipped",
    );
  }

  return { status: "applied", email: row.email, emailSent, emailError };
}
