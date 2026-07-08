import type { CohortAudience } from "@/lib/cohorts/audience";

/**
 * Ordered per-audience blocks for the landing "#cohort" band: the earliest OPEN
 * cohort of each audience, featured audience first, then by start date.
 * `openCohorts` is already ordered earliest-first (listOpenCohorts orders by
 * startDate). Pure + DB-free.
 */
export function cohortBlocks<
  T extends { id: string; audience: CohortAudience; startDate: Date; endDate: Date; capacity: number },
>(
  openCohorts: readonly T[],
  counts: Map<string, number>,
  featuredAudience: CohortAudience | null,
): Array<T & { remaining: number; featured: boolean }> {
  const seen = new Set<CohortAudience>();
  const earliestPerAudience: T[] = [];
  for (const cohort of openCohorts) {
    if (!seen.has(cohort.audience)) {
      seen.add(cohort.audience);
      earliestPerAudience.push(cohort);
    }
  }
  return earliestPerAudience
    .map((cohort) => ({
      ...cohort,
      remaining: Math.max(0, cohort.capacity - (counts.get(cohort.id) ?? 0)),
      featured: cohort.audience === featuredAudience,
    }))
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.startDate.getTime() - b.startDate.getTime();
    });
}
