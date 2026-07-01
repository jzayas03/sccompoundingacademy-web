/**
 * Course-material access window.
 *
 * Paying for a cohort grants access to the module content + PDFs, but NOT
 * forever: access to the material expires `COURSE_ACCESS_GRACE_DAYS` after
 * the cohort's end date, so graduates don't keep unrestricted portal access
 * to the paid material indefinitely. The certificate (download + public
 * verification) is unaffected — a graduate keeps that for good.
 *
 * Owners (ADMIN_EMAILS) are never gated. A user with no cohort / no end date
 * can't be dated, so we fail OPEN (leave access on) rather than lock out
 * someone we can't classify — an explicit choice, not an oversight.
 *
 * Pure functions (no DB, no clock) so the policy is unit-testable; callers
 * pass `now = new Date()` and the cohort end date they already loaded.
 */
export const COURSE_ACCESS_GRACE_DAYS = 30;

/** The instant course-material access ends, or null when it never expires
 *  (no cohort end date on record). */
export function courseAccessExpiresAt(
  cohortEndDate: Date | null | undefined,
): Date | null {
  if (!cohortEndDate) return null;
  const expires = new Date(cohortEndDate);
  expires.setUTCDate(expires.getUTCDate() + COURSE_ACCESS_GRACE_DAYS);
  return expires;
}

/**
 * Effective access-end instant: the later of the default window
 * (cohort end + grace) and any admin override (`accessExtendedUntil`).
 * Null when neither dates the access (never expires). Used for the
 * dashboard's "access ended on {date}" copy.
 */
export function effectiveAccessExpiresAt(
  cohortEndDate: Date | null | undefined,
  accessExtendedUntil?: Date | null,
): Date | null {
  const windowEnd = courseAccessExpiresAt(cohortEndDate);
  if (
    accessExtendedUntil &&
    (!windowEnd || accessExtendedUntil.getTime() > windowEnd.getTime())
  ) {
    return accessExtendedUntil;
  }
  return windowEnd;
}

export function isCourseAccessActive(params: {
  isOwner: boolean;
  cohortEndDate: Date | null | undefined;
  /** Admin per-student override; keeps access open while in the future. */
  accessExtendedUntil?: Date | null;
  now: Date;
}): boolean {
  if (params.isOwner) return true;
  const nowT = params.now.getTime();
  // Admin override wins whenever it's still in the future.
  if (
    params.accessExtendedUntil &&
    nowT <= params.accessExtendedUntil.getTime()
  ) {
    return true;
  }
  const expires = courseAccessExpiresAt(params.cohortEndDate);
  if (!expires) return true; // undatable → don't lock out
  return nowT <= expires.getTime();
}
