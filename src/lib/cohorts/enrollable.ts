import type { Cohort } from "@/lib/db/schema";

/** Public enrollment closes this many days before the cohort starts —
 *  matches the published closesNote copy ("al comenzar el curso").
 *  0 = a cohort accepts enrollment until the day it begins; was 14
 *  ("dos semanas antes"), relaxed 2026-07 so late seats can still fill. */
export const ENROLLMENT_CUTOFF_DAYS = 0;

/** UTC instant at which public enrollment for this start date closes:
 *  00:00 UTC of (startDate − ENROLLMENT_CUTOFF_DAYS). `startDate` is a
 *  Drizzle date column in mode:"date" (UTC midnight), consistent with the
 *  repo-wide UTC pinning. */
export function enrollmentCutoff(startDate: Date): Date {
  const cutoff = new Date(startDate);
  cutoff.setUTCDate(cutoff.getUTCDate() - ENROLLMENT_CUTOFF_DAYS);
  return cutoff;
}

/** True when the cohort accepts NEW public enrollments right now: manual
 *  flag open AND the date cutoff not yet reached. The rule for every public
 *  surface and the enrollment POST gate. NOT used by payment paths (an
 *  approved student may pay inside the window) or the admin change-cohort
 *  control (admin may move late-joiners). */
export function isEnrollable(
  cohort: Pick<Cohort, "openForEnrollment" | "startDate">,
  now: Date,
): boolean {
  if (!cohort.openForEnrollment) return false;
  return now < enrollmentCutoff(cohort.startDate);
}
