/**
 * SCCA course catalogue — single source of truth for course + cohort data.
 *
 * Why TS constants (vs i18n): pricing, dates, Stripe Price IDs, and seat
 * caps are operational data, not translatable copy. They must stay
 * identical across locales and must be referenceable from server code
 * (API route, webhook handler) where i18n is not in scope.
 *
 * i18n still owns the *display strings* — course title, module titles,
 * descriptions — keyed by the course `id` (see `messages/*.json →
 * cursosGrid.items[]`). This file owns the *facts*.
 *
 * SCCA currently offers a single integrated course — "Basic Compounding
 * No Estéril" — split into three on-site modules (one per day). The
 * earlier 3-course catalogue (USP 795 / 800 / Combinado) was retired
 * when the owner confirmed a unified 18-hour curriculum.
 *
 * Stripe Price ID lives in env var so we never commit it. The webhook
 * handler uses `course_id` from session metadata to look up the
 * corresponding course here.
 */

export type CourseId = "basic-compounding";

export type Course = {
  id: CourseId;
  /** URL slug — used in /cursos/[slug] and ?course=slug query params. */
  slug: string;
  /** Stripe Price ID, read from env at request time. */
  stripePriceEnvKey: string;
  /** Display amount in USD cents — what we show users. Stripe is source
   * of truth at checkout; this is for the UI label only. */
  priceUsdCents: number;
  /** Programme depth marker — also displayed as the card eyebrow. */
  level: "fundamentos";
  /** Total instruction hours, for the card footer and confirmation email. */
  hours: number;
  /** Number of presential days (one module per day). */
  days: number;
  /** Hours per day — `hours === days * hoursPerDay`. */
  hoursPerDay: number;
  /** USP chapter alignment label, surfaced as scannable metadata in the
   * card eyebrow. */
  uspLabel: string;
};

export type Cohort = {
  id: string;
  /** Course this cohort runs. */
  courseId: CourseId;
  /** Display label rendered in the form select (in the user's locale via
   * i18n lookup `cohortes.{id}.label`). */
  i18nKey: string;
  /** ISO date of first session (used in confirmation email + Airtable). */
  startDate: string;
  /** ISO date of last session. */
  endDate: string;
  /** Maximum participants — when reached, the cohort closes for new sales. */
  capacity: number;
  /** Toggle to hide cohorts that filled or were cancelled without
   * deleting their record (so completed-cohort references survive). */
  openForEnrollment: boolean;
};

/**
 * Catalogue. Edit price here once the owner confirms final pricing; edit
 * cohort dates when new cohorts open. The price below is a placeholder —
 * Stripe is the source of truth at checkout.
 */
export const COURSES: readonly Course[] = [
  {
    id: "basic-compounding",
    slug: "basic-compounding",
    stripePriceEnvKey: "STRIPE_PRICE_BASIC_COMPOUNDING",
    priceUsdCents: 100_000, // placeholder $1,000 — owner to confirm
    level: "fundamentos",
    hours: 18,
    days: 3,
    hoursPerDay: 6,
    uspLabel: "USP 〈795〉 + 〈800〉",
  },
] as const;

export const COHORTS: readonly Cohort[] = [
  {
    id: "2026-q1-basic",
    courseId: "basic-compounding",
    i18nKey: "2026-q1-basic",
    startDate: "2026-01-15",
    endDate: "2026-01-17",
    capacity: 12,
    openForEnrollment: true,
  },
] as const;

export function getCourseBySlug(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

export function getCourseById(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function getCohortById(id: string): Cohort | undefined {
  return COHORTS.find((c) => c.id === id);
}

export function getCohortsForCourse(courseId: CourseId): readonly Cohort[] {
  return COHORTS.filter((c) => c.courseId === courseId && c.openForEnrollment);
}

/** Format USD cents as a display string (e.g. 100000 → "$1,000"). */
export function formatPrice(usdCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usdCents / 100);
}
