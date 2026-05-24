/**
 * Display formatter for public review cards.
 *
 * Takes the student's full name as stored in `users.name` (Auth.js stores
 * whatever the magic-link sign-in flow captured) and returns the
 * privacy-respecting form used on the marketing landing:
 *
 *   "María del Carmen Rivera Santiago"  →  "María R."
 *   "Juan Pérez"                         →  "Juan P."
 *   "Juan"                               →  "Juan"
 *   null / empty / whitespace            →  "Estudiante"
 */
export function formatReviewerName(raw: string | null | undefined): string {
  if (!raw) return "Estudiante";
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Estudiante";
  // `noUncheckedIndexedAccess` is on, so the explicit guards above plus
  // non-null assertions here are the cleanest way to express "we have
  // already proven these indices are populated".
  const first = parts[0]!;
  if (parts.length === 1) return first;

  // For Hispanic compound names like "María del Carmen Rivera Santiago":
  //   parts = ["María", "del", "Carmen", "Rivera", "Santiago"]
  // The paternal apellido is the second-to-last word ("Rivera").
  // For simple two-word names like "Juan Pérez":
  //   parts = ["Juan", "Pérez"]  — use the last word.
  const apellidoToken =
    parts.length > 2 ? parts[parts.length - 2]! : parts[parts.length - 1]!;

  // `apellidoToken` was produced by .split + .filter(Boolean), so it is
  // non-empty by construction — index 0 is always present.
  const lastInitial = apellidoToken[0]!.toUpperCase();
  return `${first} ${lastInitial}.`;
}
