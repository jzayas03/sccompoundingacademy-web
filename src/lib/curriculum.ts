/**
 * Tier-keyed curriculum — the single source of truth for "which modules
 * each portal tier has." Every place that used to hard-wire the three
 * professional days (dashboard, module page, pre/post-test, results,
 * their actions, certificate eligibility) resolves its module list,
 * ordinal, and PDF asset from here.
 *
 * `ordinal` is what lands in `quizAttempts.moduleId` and maps to the
 * `certificates.scoreM{ordinal}` column. It is per-tier (professional
 * 1/2/3, student 1/2); there is no collision because every query filters
 * by `userId` and a user belongs to exactly one tier.
 *
 * NOTE: `certificates` only has `scoreM1/M2/M3` columns, so any future
 * curriculum with more than three modules needs a `scoreM4+` migration.
 */

/** Mirror of `users.tier` (Drizzle `tierEnum` + nullable). */
export type UserTier = "pharmacist" | "profesional" | "student" | null;

export type CurriculumModule = {
  /** Route param + quiz-bank key, e.g. "modulo-1" | "usp-795". */
  id: string;
  /** 1..N position; becomes quizAttempts.moduleId and scoreM{ordinal}. */
  ordinal: number;
  /** public/modulos/{pdfBasename}.pdf (and -en.pdf when present). */
  pdfBasename: string;
};

const PROFESIONAL: readonly CurriculumModule[] = [
  { id: "modulo-1", ordinal: 1, pdfBasename: "dia-1" },
  { id: "modulo-2", ordinal: 2, pdfBasename: "dia-2" },
  { id: "modulo-3", ordinal: 3, pdfBasename: "dia-3" },
];

const STUDENT: readonly CurriculumModule[] = [
  { id: "usp-795", ordinal: 1, pdfBasename: "est-795" },
  { id: "usp-800", ordinal: 2, pdfBasename: "est-800" },
];

/** Modules for a tier. Legacy ("pharmacist") and owner/null default to
 *  the professional curriculum — owners preview the professional path,
 *  which matches today's behavior. */
export function getCurriculum(tier: UserTier): readonly CurriculumModule[] {
  return tier === "student" ? STUDENT : PROFESIONAL;
}

/** Resolve a route id within a tier's curriculum, or null if it does not
 *  belong to that tier (callers turn null into a 404). */
export function resolveModule(
  tier: UserTier,
  id: string,
): CurriculumModule | null {
  return getCurriculum(tier).find((m) => m.id === id) ?? null;
}

/** Curriculum ordinals required for a completion certificate. */
export function requiredOrdinals(tier: UserTier): number[] {
  return getCurriculum(tier).map((m) => m.ordinal);
}

/** ACPE Standard 3 disclosure applies only to CE-bearing tiers. The
 *  student track earns no ACPE CE, so its dashboard omits the block. */
export function showAcpeDisclosure(tier: UserTier): boolean {
  return tier !== "student";
}

/** i18n message key holding the student module catalogue (title/day/
 *  summary). Professional modules live at cursosGrid.items[0].modules. */
export const STUDENT_MODULES_I18N_KEY = "studentCurriculum" as const;
