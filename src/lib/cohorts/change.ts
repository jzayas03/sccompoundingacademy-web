import type { Cohort } from "@/lib/db/schema";
import { audienceMatches, type CohortAudience } from "@/lib/cohorts/audience";

/** Outcome of a proposed cohort change. */
export type ChangeCode = "same" | "audience-mismatch" | "full" | "ok";

/** A destination-cohort option for the roster dropdown: the cohort plus its
 *  current seat state. `full` means paid enrollees ≥ capacity. */
export type CohortOption = {
  cohort: Cohort;
  remaining: number;
  full: boolean;
};

/**
 * Cohorts the admin may move THIS student into: audience matches the student's
 * profile, excluding the student's current cohort. Full cohorts are INCLUDED
 * (flagged `full`) so the admin can still force a move into them. Pure + DB-free.
 * `counts` is the paid-enrollee map from `enrollmentCountByCohort()`.
 */
export function eligibleCohortsForChange(
  cohorts: readonly Cohort[],
  tier: string,
  professionalType: string | null | undefined,
  currentCohortId: string | null,
  counts: Map<string, number>,
): CohortOption[] {
  return cohorts
    .filter(
      (c) =>
        c.id !== currentCohortId &&
        audienceMatches(c.audience, tier, professionalType),
    )
    .map((c) => {
      const remaining = Math.max(0, c.capacity - (counts.get(c.id) ?? 0));
      return { cohort: c, remaining, full: remaining === 0 };
    });
}

/**
 * Decide whether a cohort change is allowed — the single source of truth for
 * the rules (the client dropdown filter is only UX). Audience mismatch is a
 * hard barrier that `force` never overrides; `force` bypasses capacity only.
 * `destPaidCount` is the destination cohort's current paid enrollees.
 */
export function validateCohortChange(args: {
  destAudience: CohortAudience;
  destCapacity: number;
  destPaidCount: number;
  tier: string;
  professionalType: string | null | undefined;
  currentCohortId: string | null;
  destCohortId: string;
  force: boolean;
}): ChangeCode {
  if (args.destCohortId === args.currentCohortId) return "same";
  if (!audienceMatches(args.destAudience, args.tier, args.professionalType))
    return "audience-mismatch";
  const full = args.destPaidCount >= args.destCapacity;
  if (full && !args.force) return "full";
  return "ok";
}
