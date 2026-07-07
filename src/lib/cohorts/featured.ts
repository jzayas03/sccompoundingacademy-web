/**
 * Which cohort the public landing highlights: the earliest OPEN featured cohort,
 * else the earliest open one. `openCohorts` is already ordered earliest-first
 * (listOpenCohorts orders by startDate). Pure + DB-free so it is unit-testable.
 */
export function pickFeaturedCohort<T extends { featured: boolean }>(
  openCohorts: readonly T[],
): T | undefined {
  return openCohorts.find((cohort) => cohort.featured) ?? openCohorts[0];
}
