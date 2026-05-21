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
