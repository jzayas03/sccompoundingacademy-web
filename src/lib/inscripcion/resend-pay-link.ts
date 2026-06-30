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
