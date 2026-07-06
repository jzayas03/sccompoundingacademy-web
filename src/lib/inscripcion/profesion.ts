/**
 * Resolve the profession value the enrollment form sends as `tipo_profesional`.
 *
 * Pure + framework-free so the branching (which is easy to get subtly wrong)
 * is unit-tested independently of the React form.
 *
 * Only the profesional tier captures a profession. The user first makes a
 * top-level choice — farmacéutico / técnico / otro:
 *   - farmacéutico / técnico  → sent verbatim (these drive ACPE CE eligibility).
 *   - otro                    → the specific sub-profession (medico/…) or the
 *                               free text typed under "Otro". If none is given,
 *                               it falls back to the generic "otro" so the
 *                               "Otros Profesionales" track never forces a
 *                               second, redundant choice (they are non-CE
 *                               regardless of the specific profession).
 *
 * Returns "" only when no top-level profession is chosen yet (the form's
 * client guard turns that into "select your profession") or for the student
 * tier (profession not asked).
 */
export function resolveProfesion(
  tier: string,
  tipoProfesional: string,
  otraProfesion: string,
  otraProfesionTexto: string,
): string {
  if (tier !== "profesional") return "";
  if (tipoProfesional === "farmaceutico" || tipoProfesional === "tecnico") {
    return tipoProfesional;
  }
  if (tipoProfesional === "otro") {
    const specific =
      otraProfesion === "otro" ? otraProfesionTexto.trim() : otraProfesion;
    return specific || "otro";
  }
  return "";
}
