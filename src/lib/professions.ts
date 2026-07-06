/**
 * Profession values stored in `users.professionalType`.
 *
 * Pharmacy roles ("farmaceutico" / "tecnico") feed the ACPE "Registro de
 * Educación Continua". Enrollees who pick "Otro" in the form store one of
 * the known codes below (medico, enfermero, …) or — when none fit — the
 * free text they typed. The column is plain text, so no enum migration is
 * needed; this module is just the shared display mapping.
 */
const PROFESSION_LABELS_ES: Record<string, string> = {
  farmaceutico: "Farmacéutico",
  tecnico: "Técnico de farmacia",
  medico: "Médico/a",
  enfermero: "Enfermero/a",
  dentista: "Dentista",
  // Generic "Otros Profesionales" enrollee who did not specify a sub-profession.
  otro: "Otro profesional",
};

/**
 * Spanish label for a stored profession value. Known codes map to their
 * label; any other value (free-text "Otro") is returned unchanged. An
 * empty/null value returns "" so callers can apply their own placeholder.
 */
export function professionLabel(value: string | null | undefined): string {
  if (!value) return "";
  return PROFESSION_LABELS_ES[value] ?? value;
}

/**
 * Pharmacy roles that earn ACPE CE. This is the ONLY positive CE test —
 * "otro" is never persisted (InscripcionForm discards it into the specific
 * profession or free text), so we detect CE-eligibility by pharmacy role,
 * not by the absence of "otro". Fail-safe: unknown/null → false.
 */
export function isPharmacyRole(professionalType: string | null | undefined): boolean {
  return professionalType === "farmaceutico" || professionalType === "tecnico";
}

/**
 * CE eligibility — the single source of truth for "does this enrollee earn
 * ACPE CE". Legacy `tier === "pharmacist"` rows (pre-2026-05-19 licensed
 * pharmacists) are CE-eligible by tier alone. New `profesional`-tier rows earn
 * CE only when their profession is a pharmacy role. Everyone else (students,
 * non-pharmacy professionals, unknown) earns no CE.
 */
export function isCeEligible(
  tier: string | null | undefined,
  professionalType: string | null | undefined,
): boolean {
  if (tier === "pharmacist") return true;
  return tier === "profesional" && isPharmacyRole(professionalType);
}
