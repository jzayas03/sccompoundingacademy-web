import "server-only";

import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verificationDecisionPatch } from "./verification-decision";
import {
  buildVerificationApprovedEmail,
  buildVerificationRejectedEmail,
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
 */
export async function applyVerificationDecision(
  userId: string,
  decision: "approved" | "rejected",
): Promise<DecisionResult> {
  const [row] = await db
    .select({
      email: users.email,
      doc: users.verificationDocUrl,
      current: users.studentVerification,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return { status: "not-found" };
  if (row.current !== "pending") {
    return { status: "already-decided", email: row.email };
  }

  await db
    .update(users)
    .set(verificationDecisionPatch(decision, new Date()))
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
    const mail =
      decision === "approved"
        ? buildVerificationApprovedEmail("es")
        : buildVerificationRejectedEmail("es");
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
