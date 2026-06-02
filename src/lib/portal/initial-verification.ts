/**
 * The verification status a newly-paid enrollee starts with. Student-tier
 * enrollees must verify their matrícula before accessing content; everyone
 * else has no verification requirement (null).
 */
export function initialVerificationFor(
  tier: "profesional" | "student",
): "pending" | null {
  return tier === "student" ? "pending" : null;
}
