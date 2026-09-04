/**
 * SCCA course catalogue — single source of truth for course data.
 *
 * Cohort scheduling is NOT here: cohorts live in the database (`cohorts`
 * table) so the owner can add and edit them from the admin panel without
 * a code change. See `lib/cohorts.ts`.
 *
 * Why TS constants (vs i18n): pricing, Stripe Price IDs, and seat caps
 * are operational data, not translatable copy. They must stay identical
 * across locales and must be referenceable from server code (API route,
 * webhook handler) where i18n is not in scope.
 *
 * i18n owns the *display strings* — course title, module titles,
 * descriptions, tier labels — keyed by ids. This file owns the *facts*.
 *
 * SCCA offers a single integrated course — "Basic Compounding No Estéril"
 * — split into three on-site modules (one per day). Two pricing tiers
 * share the same Stripe Product:
 *   - profesional: $2,395 (default) — covers both RPh pharmacists and
 *                  licensed pharmacy technicians (per the brochure
 *                  audience, 2026-05-19; price updated 2026-07-02)
 *   - student:     $495 (gated via institutional email allowlist or
 *                  Stripe coupon issued manually after Student-ID review)
 *                  — only for non-licensed students (pre-PharmD / tech
 *                  program enrollees)
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

export type CourseId = "basic-compounding" | "parte-2";

export type Tier = "profesional" | "student" | "subgraduado";

export type Pricing = {
  tier: Tier;
  /** Stripe Price ID, read from env at request time. */
  stripePriceEnvKey: string;
  /** Display amount in USD cents — what we show users. Stripe is source
   * of truth at checkout; this is for the UI label only. */
  priceUsdCents: number;
  /**
   * Registro liviano (spec 2026-09-04): pagar → confirmación, SIN usuario
   * de portal. El webhook escribe en `course_registrations` en vez de
   * `users`; no hay material, pruebas, CE ni certificado. Cuando el env
   * del price no está definido, el formulario no ofrece esta opción (y el
   * API responde `price-missing` como defensa en profundidad).
   */
  registrationOnly?: true;
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
  /** ACPE activity classification — e.g. "Knowledge-based, Level 1". */
  classification: string;
};

export type Course = {
  id: CourseId;
  /** URL slug — used in /cursos/[slug] and ?course=slug query params. */
  slug: string;
  /** Programme depth marker — also displayed as the card eyebrow. */
  level: "fundamentos" | "avanzado";
  /**
   * Título display bilingüe para contextos server-side sin i18n (emails
   * del webhook). Las tarjetas públicas siguen viviendo en
   * `messages/{es,en}.json` (`cursosGrid.items`, lookup por id).
   */
  displayTitle: { es: string; en: string };
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

/**
 * Catalogue. Prices below are the owner-confirmed values (2026-05-19);
 * Stripe is still the source of truth at checkout.
 */
export const COURSES: readonly Course[] = [
  {
    id: "basic-compounding",
    slug: "basic-compounding",
    level: "fundamentos",
    displayTitle: {
      es: "Compounding No Estéril Básico",
      en: "Basic Non-Sterile Compounding",
    },
    hours: 18,
    days: 3,
    hoursPerDay: 6,
    uspLabel: "USP 〈795〉 + 〈800〉",
    pricing: [
      {
        tier: "profesional",
        stripePriceEnvKey: "STRIPE_PRICE_ID_PROFESIONAL",
        priceUsdCents: 239_500,
      },
      {
        tier: "student",
        stripePriceEnvKey: "STRIPE_PRICE_ID_STUDENT",
        priceUsdCents: 49_500,
      },
      // Estudiantes subgraduados (registro liviano): cohortes dedicadas con
      // audiencia "subgraduado". Precio de negocio aún por definir — mientras
      // STRIPE_PRICE_ID_BASICO_SUBGRADUADO no exista en el entorno, el
      // formulario no ofrece este tier. priceUsdCents 0 = "por anunciar".
      {
        tier: "subgraduado",
        stripePriceEnvKey: "STRIPE_PRICE_ID_BASICO_SUBGRADUADO",
        priceUsdCents: 0,
        registrationOnly: true,
      },
    ],
    acpe: {
      provider: "Colegio de Farmacéuticos de Puerto Rico",
      providerNumber: "0151",
      contactHours: 18,
      ceus: 1.8,
      classification: "Knowledge-based, Level 1",
    },
  },
  // Parte 2 — curso avanzado (registro liviano, spec 2026-09-04): 2 días
  // presenciales, sin CE (sin bloque `acpe`), sin material de portal ni
  // certificado. Pagar → confirmación; el webhook escribe en
  // `course_registrations`, nunca en `users`.
  {
    id: "parte-2",
    slug: "parte-2",
    level: "avanzado",
    displayTitle: {
      es: "Compounding No Estéril Avanzado — Parte 2",
      en: "Advanced Non-Sterile Compounding — Part 2",
    },
    hours: 12,
    days: 2,
    hoursPerDay: 6,
    uspLabel: "USP 〈795〉 + 〈800〉",
    pricing: [
      {
        tier: "profesional",
        stripePriceEnvKey: "STRIPE_PRICE_ID_PARTE2_PROFESIONAL",
        priceUsdCents: 174_500,
        registrationOnly: true,
      },
    ],
  },
] as const;

export function getCourseBySlug(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
}

export function getCourseById(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function getPricingByTier(course: Course, tier: Tier): Pricing | undefined {
  return course.pricing.find((p) => p.tier === tier);
}

/** Default tier shown selected in the inscription form. Covers RPh
 *  pharmacists and licensed pharmacy technicians. */
export const DEFAULT_TIER: Tier = "profesional";

/** Format USD cents as a display string (e.g. 100000 → "$1,000"). */
export function formatPrice(usdCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usdCents / 100);
}
