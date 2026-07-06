import { isCeEligible as isCeEligibleCore } from "@/lib/professions";
import type { UserTier } from "@/lib/curriculum";

/**
 * Pure certificate-program helpers — the single source of truth for
 * CE-award logic. No DB dependency: this leaf only imports the
 * profession predicate and a type-only reference to `UserTier`, so it
 * can be imported from DB-free contexts (e.g. the email templates and
 * their unit tests) without dragging in drizzle/`@/lib/db`.
 */

export type CertProgram = "profesional" | "profesional-completion" | "student";

/** Legacy tier-only mapping (student vs professional). Kept for callers that
 *  have no professional_type; NEVER returns the completion program. Prefer
 *  `programFor` at any site that can read professional_type. */
export function programForTier(tier: UserTier): "profesional" | "student" {
  return tier === "student" ? "student" : "profesional";
}

/** CE-eligible enrollees earn ACPE CE: legacy `tier === "pharmacist"` rows
 *  (pre-2026-05-19 licensed pharmacists) unconditionally, plus professional-
 *  tier pharmacists/techs. Delegates to the leaf predicate in
 *  `@/lib/professions` — the single source of truth. Fail-safe:
 *  null/unknown/free-text profession → false. */
export function isCeEligible(
  tier: UserTier,
  professionalType: string | null,
): boolean {
  return isCeEligibleCore(tier, professionalType);
}

/** Full program resolution. Professional-tier pharmacists/techs earn the CE
 *  program; every other professional gets the no-CE completion program. */
export function programFor(tier: UserTier, professionalType: string | null): CertProgram {
  if (tier === "student") return "student";
  return isCeEligible(tier, professionalType) ? "profesional" : "profesional-completion";
}

/** Only the CE professional program prints CEUs + the ACPE provider line. */
export function certAwardsCeus(program: CertProgram): boolean {
  return program === "profesional";
}

/** Human-friendly cert-number prefix per program. The three prefixes are
 *  deliberately disjoint so each `LIKE ${prefix}%` numbering query stays in
 *  its own sequence: SCCA- (CE), SCCA-EST- (student), SCCA-COMP- (completion). */
export function certPrefix(program: CertProgram, year: number): string {
  if (program === "student") return `SCCA-EST-${year}-`;
  if (program === "profesional-completion") return `SCCA-COMP-${year}-`;
  return `SCCA-${year}-`;
}
