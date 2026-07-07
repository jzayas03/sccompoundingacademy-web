import { isPharmacyRole } from "@/lib/professions";

/**
 * Cohort audience — who a cohort enrolls. Pure + DB-free (imports only the
 * professions leaf) so it is shared by the admin form, the server enrollment
 * gate, and the client cohort-dropdown filter, and unit-tested independently.
 */
export type CohortAudience =
  | "farmaceutico_tecnico"
  | "otros_profesionales"
  | "estudiante";

export const AUDIENCE_LABELS: Record<CohortAudience, { es: string; en: string }> = {
  farmaceutico_tecnico: { es: "Farmacéuticos y Técnicos", en: "Pharmacists & Technicians" },
  otros_profesionales: { es: "Otros Profesionales", en: "Other Professionals" },
  estudiante: { es: "Estudiantes", en: "Students" },
};

/** Definitive audience for an enrollee, or null when undetermined (a
 *  professional who has not chosen a profession yet). Uses the same
 *  isPharmacyRole predicate that drives CE eligibility. */
export function enrolleeAudience(
  tier: string,
  professionalType: string | null | undefined,
): CohortAudience | null {
  if (tier === "student") return "estudiante";
  if (tier === "profesional") {
    if (!professionalType?.trim()) return null;
    return isPharmacyRole(professionalType) ? "farmaceutico_tecnico" : "otros_profesionales";
  }
  return null;
}

/** Cohort audiences a (possibly incomplete) form selection may enroll into —
 *  used to filter the cohort dropdown. A professional who has not picked a
 *  profession sees both professional audiences until they narrow it. */
export function visibleAudiences(
  tier: string,
  professionalType: string | null | undefined,
): CohortAudience[] {
  const a = enrolleeAudience(tier, professionalType);
  if (a) return [a];
  if (tier === "profesional") return ["farmaceutico_tecnico", "otros_profesionales"];
  return [];
}

/** True when the enrollee's audience matches the cohort's. */
export function audienceMatches(
  cohortAudience: CohortAudience,
  tier: string,
  professionalType: string | null | undefined,
): boolean {
  return enrolleeAudience(tier, professionalType) === cohortAudience;
}

export function audienceMismatchMessage(
  cohortAudience: CohortAudience,
  locale: "es" | "en",
): string {
  const label = AUDIENCE_LABELS[cohortAudience][locale];
  return locale === "en"
    ? `This cohort is for ${label} only.`
    : `Esta cohorte es solo para ${label}.`;
}
