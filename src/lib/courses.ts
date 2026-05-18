/**
 * SCCA course catalogue — single source of truth for course + cohort data.
 *
 * Why TS constants (vs i18n): pricing, dates, Stripe Price IDs, and seat
 * caps are operational data, not translatable copy. They must stay
 * identical across locales and must be referenceable from server code
 * (API route, webhook handler) where i18n is not in scope.
 *
 * i18n still owns the *display strings* — course titles, level labels,
 * descriptions — keyed by the course `id` (see `messages/*.json →
 * cursosGrid.items[]`). This file owns the *facts*.
 *
 * Stripe Price IDs live in env vars (one per course) so we never commit
 * them to git. The webhook handler uses `course_id` from session metadata
 * to look up the corresponding course here.
 */

export type CourseId = "usp-795" | "usp-800" | "combinado";

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
  level: "fundamentos" | "intermedio" | "avanzado";
  /** Total instruction hours, for the card footer and confirmation email. */
  hours: number;
  /** USP chapter alignment label, surfaced as scannable metadata in cards
   * (next to the level eyebrow) instead of being buried inside the title. */
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
 * Catalogue. Edit prices here once the owner confirms final pricing;
 * edit cohort dates when new cohorts open. Add new courses by appending
 * entries — every other consumer (form, API, email) picks them up.
 */
export const COURSES: readonly Course[] = [
  {
    id: "usp-795",
    slug: "usp-795",
    stripePriceEnvKey: "STRIPE_PRICE_USP_795",
    priceUsdCents: 100_000, // placeholder $1,000 — owner to confirm
    level: "fundamentos",
    hours: 40,
    uspLabel: "USP 〈795〉",
  },
  {
    id: "usp-800",
    slug: "usp-800",
    stripePriceEnvKey: "STRIPE_PRICE_USP_800",
    priceUsdCents: 80_000, // placeholder $800
    level: "intermedio",
    hours: 32,
    uspLabel: "USP 〈800〉",
  },
  {
    id: "combinado",
    slug: "combinado",
    stripePriceEnvKey: "STRIPE_PRICE_COMBINADO",
    priceUsdCents: 150_000, // placeholder $1,500
    level: "avanzado",
    hours: 60,
    uspLabel: "USP 〈795〉 + 〈800〉",
  },
] as const;

export const COHORTS: readonly Cohort[] = [
  {
    id: "2026-q1-usp-795",
    courseId: "usp-795",
    i18nKey: "2026-q1-usp-795",
    startDate: "2026-01-12",
    endDate: "2026-02-20",
    capacity: 12,
    openForEnrollment: true,
  },
  {
    id: "2026-q1-usp-800",
    courseId: "usp-800",
    i18nKey: "2026-q1-usp-800",
    startDate: "2026-02-23",
    endDate: "2026-03-27",
    capacity: 12,
    openForEnrollment: true,
  },
  {
    id: "2026-q1-combinado",
    courseId: "combinado",
    i18nKey: "2026-q1-combinado",
    startDate: "2026-01-12",
    endDate: "2026-03-27",
    capacity: 8,
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
