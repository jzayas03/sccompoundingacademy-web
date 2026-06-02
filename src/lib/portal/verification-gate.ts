/**
 * Pure access-policy for the student-tier matrícula verification gate.
 *
 * The contract:
 *   1. Owners (ADMIN_EMAILS) bypass — same rule as every other portal gate.
 *   2. Only the "student" tier is gated; "profesional"/"pharmacist"/null
 *      tiers are never asked to verify.
 *   3. A student-tier user may see portal content ONLY when their
 *      verification is "approved". Any other state (pending / rejected /
 *      null) routes them to /portal/verificacion to upload (or re-upload).
 *
 * The page component owns the I/O (auth, the users row); this just decides.
 */
export type VerificationGateInput = {
  /** Email is on the ADMIN_EMAILS allowlist. */
  isOwner: boolean;
  /** `users.tier`. */
  tier: "pharmacist" | "profesional" | "student" | null;
  /** `users.studentVerification`. */
  studentVerification: "pending" | "approved" | "rejected" | null;
};

export type VerificationGateDecision = "allow" | "redirect-verificacion";

export function resolveVerificationGate(
  input: VerificationGateInput,
): VerificationGateDecision {
  // (1) Owner bypass.
  if (input.isOwner) return "allow";

  // (2) Only the student tier is gated.
  if (input.tier !== "student") return "allow";

  // (3) Student must be approved to proceed.
  return input.studentVerification === "approved"
    ? "allow"
    : "redirect-verificacion";
}
