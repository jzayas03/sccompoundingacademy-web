/**
 * The column patch applied to a `user` row when the owner approves or
 * rejects a matrícula. In both cases the document URL is cleared — we keep
 * only the outcome and a timestamp, never the document itself.
 */
export function verificationDecisionPatch(
  decision: "approved" | "rejected",
  now: Date,
) {
  return {
    studentVerification: decision,
    verifiedAt: decision === "approved" ? now : null,
    rejectedAt: decision === "rejected" ? now : null,
    verificationDocUrl: null,
  };
}
