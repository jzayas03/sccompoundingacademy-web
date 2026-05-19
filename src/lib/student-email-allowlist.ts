/**
 * Allowlist of Puerto Rico institutional email domains accepted for the
 * Student pricing tier ($495) without manual verification.
 *
 * Two-path eligibility for the Student tier (per the 2026-05-19 brochure
 * review):
 *
 *   - **Path A (automatic)** — `isInstitutionalEmail(email)` matches one
 *     of these domains. The `/portal/inscripcion` form lets the user
 *     proceed straight to Stripe Checkout with `STRIPE_PRICE_ID_STUDENT`.
 *
 *   - **Path B (manual)** — student writes to info@sccompoundingacademy.com
 *     with a photo/scan of their Student ID; owner issues a Stripe Coupon
 *     for the $1,855 difference, single-use, 30-day expiry. Webhook
 *     detects the coupon amount discount and marks `users.tier='student'`
 *     automatically.
 *
 * Match is **case-insensitive on the domain** and accepts subdomains so
 * `student.upr.edu` resolves to `upr.edu`.
 *
 * This module is wired into the inscription flow in a follow-up PR — for
 * now the function exists for tests and for the next round of payment
 * integration to call without further setup.
 */
export const PR_STUDENT_DOMAINS = [
  // UPR (Universidad de Puerto Rico) — public system
  "upr.edu", // Admin Central
  "uprrp.edu", // Río Piedras
  "uprm.edu", // Mayagüez
  "rcm.upr.edu", // Ciencias Médicas (escuela de farmacia)
  "uprb.edu", // Bayamón
  "upra.edu", // Arecibo
  "uprc.edu", // Carolina
  "cayey.upr.edu", // Cayey
  "uprh.edu", // Humacao
  "uprag.edu", // Aguadilla
  "uprp.edu", // Ponce
  "upro.edu", // Utuado
  // Private universities
  "uagm.edu", // Universidad Ana G. Méndez
  "inter.edu", // Universidad Interamericana
  "pucpr.edu", // Pontificia Univ. Católica
  "sagrado.edu", // Universidad del Sagrado Corazón
  "pupr.edu", // Universidad Politécnica
  "poncehealthsciences.edu", // Ponce Health Sciences (programa farmacia)
  "uccaribe.edu", // Universidad Central del Caribe (programa farmacia)
  "sanjuanbautista.edu", // San Juan Bautista School of Medicine
  "atlantic.edu", // Atlantic University College
  // Specialised public schools
  "cmpr.edu", // Conservatorio de Música
  "eap.edu", // Escuela de Artes Plásticas y Diseño
  // Pharmacy tech / PharmD specific
  "huertas.edu", // Huertas College — Tecnología Farmacéutica
  "nuc.edu", // National University College — pharmacy tech
  "nova.edu", // Nova Southeastern University (PR campus) — PharmD
  "caribbean.edu", // Caribbean University
  "atenascollege.edu", // Atenas College
] as const;

export function isInstitutionalEmail(email: string): boolean {
  const domain = email.toLowerCase().trim().split("@")[1];
  if (!domain) return false;
  // Exact match OR subdomain match (e.g. `student.upr.edu` → `upr.edu`).
  return PR_STUDENT_DOMAINS.some(
    (allowed) => domain === allowed || domain.endsWith("." + allowed),
  );
}
