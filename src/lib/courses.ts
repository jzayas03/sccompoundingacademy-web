/**
 * SCCA course catalogue — single source of truth for course + cohort data.
 *
 * Why TS constants (vs i18n): pricing, dates, Stripe Price IDs, and seat
 * caps are operational data, not translatable copy. They must stay
 * identical across locales and must be referenceable from server code
 * (API route, webhook handler) where i18n is not in scope.
 *
 * i18n owns the *display strings* — course title, module titles,
 * descriptions, tier labels — keyed by ids. This file owns the *facts*.
 *
 * SCCA offers a single integrated course — "Basic Compounding No Estéril"
 * — split into three on-site modules (one per day). Two pricing tiers
 * share the same Stripe Product:
 *   - pharmacist: $2,350 (default)
 *   - student:    $495 (gated via institutional email allowlist or
 *                 Stripe coupon issued manually after Student-ID review)
 *
 * Stripe Price IDs live in env vars so we never commit them. The
 * webhook handler uses `course_id` + the resolved tier (looked up from
 * the Price ID that fired) to mark `users.tier` in the DB.
 *
 * ACPE accreditation: the cohort runs under the Colegio de Farmacéuticos
 * de Puerto Rico's ACPE Provider 0151 sponsorship. Each cohort is
 * registered with the Colegio individually; the metadata below is used
 * to surface CE credit info on the landing page and certificate.
 */

export type CourseId = "basic-compounding";

export type Tier = "pharmacist" | "student";

export type Pricing = {
  tier: Tier;
  /** Stripe Price ID, read from env at request time. */
  stripePriceEnvKey: string;
  /** Display amount in USD cents — what we show users. Stripe is source
   * of truth at checkout; this is for the UI label only. */
  priceUsdCents: number;
};

export type AcpeAccreditation = {
  /** Sponsoring ACPE-accredited provider organization. */
  provider: string;
  /** ACPE Provider number (e.g. "0151"). */
  providerNumber: string;
  /** Contact hours of instruction. */
  contactHours: number;
  /** Continuing Education Units (1 CEU = 10 contact hours). */
  ceus: number;
};

export type Course = {
  id: CourseId;
  /** URL slug — used in /cursos/[slug] and ?course=slug query params. */
  slug: string;
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
  /** Pricing tiers — same Stripe Product, multiple Stripe Prices. */
  pricing: readonly Pricing[];
  /** CE accreditation metadata, when the cohort is sponsored. */
  acpe?: AcpeAccreditation;
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
 * Catalogue. Prices below are the owner-confirmed values (2026-05-19);
 * Stripe is still the source of truth at checkout.
 */
export const COURSES: readonly Course[] = [
  {
    id: "basic-compounding",
    slug: "basic-compounding",
    level: "fundamentos",
    hours: 18,
    days: 3,
    hoursPerDay: 6,
    uspLabel: "USP 〈795〉 + 〈800〉",
    pricing: [
      {
        tier: "pharmacist",
        stripePriceEnvKey: "STRIPE_PRICE_ID_PHARMACIST",
        priceUsdCents: 235_000,
      },
      {
        tier: "student",
        stripePriceEnvKey: "STRIPE_PRICE_ID_STUDENT",
        priceUsdCents: 49_500,
      },
    ],
    acpe: {
      provider: "Colegio de Farmacéuticos de Puerto Rico",
      providerNumber: "0151",
      contactHours: 18,
      ceus: 1.8,
    },
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

export function getPricingByTier(course: Course, tier: Tier): Pricing | undefined {
  return course.pricing.find((p) => p.tier === tier);
}

/** Default tier shown selected in the inscription form. */
export const DEFAULT_TIER: Tier = "pharmacist";

/** Format USD cents as a display string (e.g. 100000 → "$1,000"). */
export function formatPrice(usdCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usdCents / 100);
}
