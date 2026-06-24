"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyVerificationDecision } from "@/lib/portal/verification-token";
import { applyVerificationDecision } from "@/lib/portal/apply-verification-decision";

/**
 * Executes the matrícula decision carried by a signed token, authorized by
 * the token alone (no admin session — the click comes from the email).
 *
 * Runs only on the explicit POST from the confirmation page's button, so an
 * inbox link-prefetch (which only GETs the page) never applies a decision.
 * Re-validates the signature, that the row is still `pending`, and that the
 * submission timestamp still matches the token — then delegates to the
 * shared `applyVerificationDecision` (idempotent). Always redirects back to
 * the page, which renders the resulting state.
 */
export async function confirmVerificationDecision(
  formData: FormData,
): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const payload = verifyVerificationDecision(token);

  if (payload) {
    const [row] = await db
      .select({
        status: users.studentVerification,
        submittedAt: users.verificationSubmittedAt,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);
    if (
      row &&
      row.status === "pending" &&
      row.submittedAt &&
      row.submittedAt.getTime() === payload.submittedAt
    ) {
      await applyVerificationDecision(payload.userId, payload.decision);
    }
  }

  redirect(`/verificar-matricula/${encodeURIComponent(token)}`);
}
