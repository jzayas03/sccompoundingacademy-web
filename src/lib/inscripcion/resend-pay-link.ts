import { signCheckoutToken } from "@/lib/portal/verification-token";

/**
 * Pure eligibility check for re-sending a student's payment link.
 *
 * A link can be re-sent when ALL of the following are true:
 *  - the student's verification is "approved"
 *  - `verifiedAt` is set (the approval timestamp, used to sign the token)
 *  - `paidAt` is null (the student hasn't paid yet)
 *  - the target cohort is still open for enrollment
 *
 * Extracted as a pure function so it can be unit-tested without mocking
 * the database or the email sender.
 */
export function canResendPayLink({
  paidAt,
  studentVerification,
  verifiedAt,
  cohortOpen,
}: {
  paidAt: Date | null | undefined;
  studentVerification: string | null | undefined;
  verifiedAt: Date | null | undefined;
  cohortOpen: boolean;
}): boolean {
  return (
    studentVerification === "approved" &&
    !!verifiedAt &&
    !paidAt &&
    cohortOpen
  );
}

/**
 * Mint a fresh 48h checkout token for a student whose prior pay link expired.
 *
 * Extracted as a pure helper so we can verify (a) the token is signed with a
 * NOW-ish approvedAt (not the stale row.verifiedAt), and (b) the /pagar
 * endpoint's 48h freshness check won't immediately reject the resent link.
 *
 * The route owns the eligibility gate (canResendPayLink) before calling this.
 */
export function mintResendCheckoutToken(userId: string): string {
  // IMPORTANT: use Date.now(), NOT row.verifiedAt.getTime().
  // The resend form only appears when the original link is >48h old (reason=expirado).
  // Re-signing with verifiedAt produces a token /pagar immediately bounces as
  // expired again — an infinite loop. Date.now() opens a fresh 48h window.
  return signCheckoutToken({ userId, approvedAt: Date.now() });
}
