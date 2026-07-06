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

import type { ModuleQuizId } from "@/lib/quizzes/types";
import { isCeEligible } from "@/lib/professions";

/** Mirror of `users.tier` (Drizzle `tierEnum` + nullable). */
export type UserTier = "pharmacist" | "profesional" | "student" | null;

export type CurriculumModule = {
  /** Route param + quiz-bank key, e.g. "modulo-1" | "usp-795". */
  id: ModuleQuizId;
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

/** ACPE Standard 3 disclosure applies only to CE-bearing enrollees: legacy
 *  `tier === "pharmacist"` rows and professional-tier pharmacists/techs.
 *  Students and non-pharmacy professionals (no CE) omit the block.
 *  Delegates to the leaf predicate in `@/lib/professions`. */
export function showAcpeDisclosure(
  tier: UserTier,
  professionalType: string | null,
): boolean {
  return isCeEligible(tier, professionalType);
}

/** i18n message key holding the student module catalogue (title/day/
 *  summary). Professional modules live at cursosGrid.items[0].modules. */
export const STUDENT_MODULES_I18N_KEY = "studentCurriculum" as const;

/** One module's display copy from i18n (cursosGrid / studentCurriculum). */
export type ModuleI18nEntry = {
  id: string;
  day: string;
  title: string;
  summary: string;
};

/**
 * Select the i18n module catalogue for a tier. Students read the
 * `studentCurriculum.modules` block; everyone else reads the professional
 * `cursosGrid.items[0].modules`. `messages` is the next-intl messages
 * object (pass `useMessages()`).
 */
export function getModuleCatalogue(
  messages: unknown,
  tier: UserTier,
): ModuleI18nEntry[] {
  const m = messages as {
    cursosGrid?: { items?: Array<{ modules?: ModuleI18nEntry[] }> };
    studentCurriculum?: { modules?: ModuleI18nEntry[] };
  };
  return tier === "student"
    ? (m.studentCurriculum?.modules ?? [])
    : (m.cursosGrid?.items?.[0]?.modules ?? []);
}

/**
 * Owner-only effective-tier override for previewing both portals.
 * Owners (ADMIN_EMAILS) may force the student or professional portal via
 * a `?preview=` query param; everyone else always gets their real tier
 * (a real student must never be able to spoof into another portal).
 */
export function resolveEffectiveTier(params: {
  isOwner: boolean;
  userTier: UserTier;
  preview?: string | null;
}): UserTier {
  if (
    params.isOwner &&
    (params.preview === "student" || params.preview === "profesional")
  ) {
    return params.preview;
  }
  return params.userTier;
}

/**
 * Cross-tier module lookup by id. Module ids are globally unique across
 * tiers, so this resolves a module regardless of tier and reports which
 * tier owns it (used for the owning-tier i18n catalogue). Owners use this
 * to open any module; normal users stay tier-scoped via `resolveModule`.
 */
export function findModule(
  id: string,
): { module: CurriculumModule; tier: "profesional" | "student" } | null {
  for (const tier of ["profesional", "student"] as const) {
    const found = getCurriculum(tier).find((m) => m.id === id);
    if (found) return { module: found, tier };
  }
  return null;
}

/**
 * Resolve a module for a viewer. Owners (ADMIN_EMAILS) may open ANY
 * module regardless of tier (cross-tier preview); normal users are
 * restricted to their own tier's curriculum. Returns the module plus its
 * owning tier (used to pick the i18n catalogue), or null (→ 404).
 */
export function resolveViewableModule(params: {
  isOwner: boolean;
  userTier: UserTier;
  id: string;
}): { module: CurriculumModule; tier: "profesional" | "student" } | null {
  if (params.isOwner) return findModule(params.id);
  const found = resolveModule(params.userTier, params.id);
  if (!found) return null;
  return { module: found, tier: params.userTier === "student" ? "student" : "profesional" };
}
