import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizAttempts } from "@/lib/db/schema";
import { getQuiz, type ModuleQuizId } from "@/lib/quizzes";
import type { CurriculumModule } from "@/lib/curriculum";
import { resolveModuleStep, type ModuleStep } from "@/lib/portal/module-step";

/**
 * One round-trip that resolves the current step for every module in a
 * tier's curriculum — what the dashboard needs to label each card and
 * link it to the right page.
 *
 * The dashboard previously only knew "passed / not passed" (it read
 * `isEligibleForCertificate`, which filters to passing post-tests), so a
 * student mid-journey and a student who had not started rendered
 * identically. This reads every attempt for the user's modules once and
 * derives the four states in memory rather than issuing a query per
 * module.
 */
export async function getModuleSteps(
  userId: string,
  modules: readonly CurriculumModule[],
): Promise<Record<string, ModuleStep>> {
  if (modules.length === 0) return {};

  const rows = await db
    .select({
      moduleId: quizAttempts.moduleId,
      phase: quizAttempts.phase,
      passed: quizAttempts.passed,
    })
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.userId, userId),
        inArray(
          quizAttempts.moduleId,
          modules.map((m) => m.ordinal),
        ),
      ),
    );

  const steps: Record<string, ModuleStep> = {};
  for (const mod of modules) {
    const mine = rows.filter((r) => r.moduleId === mod.ordinal);
    steps[mod.id] = resolveModuleStep({
      hasQuiz: getQuiz(mod.id as ModuleQuizId).length > 0,
      hasPreAttempt: mine.some((r) => r.phase === "pre"),
      hasPostAttempt: mine.some((r) => r.phase === "post"),
      hasPassedPost: mine.some((r) => r.phase === "post" && r.passed === true),
    });
  }
  return steps;
}
