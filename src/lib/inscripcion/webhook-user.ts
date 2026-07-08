/**
 * Pure helpers that encode the webhook user-persistence decision.
 *
 * Extracted from the route so the routing logic can be unit-tested without
 * spinning up the full Stripe-signed POST handler (Task 7, Task-4 precedent).
 *
 * Two exported symbols:
 *
 *   webhookUserStrategy — decides which DB path to take given tier + user_id.
 *   studentPaidUpdate   — returns the Drizzle `set` object for the student
 *                         payment stamp (paidAt / stripeCustomerId / cohortId
 *                         ONLY — never touches verification fields).
 */

export type WebhookUserStrategy = "stamp-by-id" | "upsert-by-email";

/**
 * Determine which DB persistence path the webhook should take.
 *
 * - "stamp-by-id"   → student tier AND a truthy user_id from session metadata.
 *                     The row already exists (approved pre-payment); only stamp
 *                     the payment fields, never reset verification.
 * - "upsert-by-email" → profesional tier, OR legacy student without user_id.
 *                        Falls through to the existing upsert-by-email block.
 *
 * @param tier       The enrollment tier derived from Stripe session metadata.
 * @param userId     The `user_id` from session metadata (may be absent/empty
 *                   for legacy flows).
 */
export function webhookUserStrategy(
  tier: string,
  userId: string | null | undefined,
): WebhookUserStrategy {
  if (tier === "student" && userId && userId.trim() !== "") {
    return "stamp-by-id";
  }
  return "upsert-by-email";
}

export interface StudentPaidUpdateInput {
  stripeCustomerId: string | null;
}

export interface StudentPaidUpdateSet {
  paidAt: Date;
  stripeCustomerId: string | null;
}

/**
 * Build the Drizzle `set` object for stamping payment on a pre-existing
 * student row.
 *
 * ONLY sets payment-related fields.  Verification fields (studentVerification,
 * verificationDocUrl, verificationSubmittedAt, verifiedAt, rejectedAt) are
 * intentionally absent — the admin approved the student BEFORE payment, so
 * those values must not be touched.
 *
 * `cohortId` is ALSO intentionally absent (C3): the pre-payment row already
 * carries the authoritative cohort — set at enrollment, or moved afterwards
 * by an admin via `changeCohort`. Re-stamping it here from the Checkout
 * Session metadata would silently undo an admin's cohort move if the
 * student's browser still held a pay link minted before the move.
 */
export function studentPaidUpdate(
  input: StudentPaidUpdateInput,
): StudentPaidUpdateSet {
  return {
    paidAt: new Date(),
    stripeCustomerId: input.stripeCustomerId,
  };
}
