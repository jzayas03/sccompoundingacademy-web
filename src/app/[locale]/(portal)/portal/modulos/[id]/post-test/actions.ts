"use server";

import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, quizAttempts } from "@/lib/db/schema";
import {
  getQuiz,
  getPassingThreshold,
  scoreQuiz,
  type ModuleQuizId,
} from "@/lib/quizzes";
import { resolveViewableModule } from "@/lib/curriculum";
import { isAdminEmail } from "@/lib/admin";
import { notifyCertificateReadyIfEligible } from "@/lib/portal/notify-certificate-ready";

/**
 * Submit a post-test attempt.
 *
 * Server-side flow:
 *   1. Auth + paidAt gates (defense in depth — middleware blocks
 *      anonymous, the module page blocks unpaid, this re-checks both).
 *   2. Score the answers against the authoritative quiz data on the
 *      server. Client never sees the correct answers before submission.
 *   3. Insert a `quiz_attempts` row with start/submit timestamps, the
 *      answer map, score, percentage, and pass/fail.
 *   4. Redirect to `/resultados` where the results page reads the most
 *      recent attempt for this user/module from the DB.
 *
 * `startedAt` defaults to `now()` in the schema; we pass the explicit
 * value Inferred client-side `startedAt` is not currently surfaced —
 * we accept the row's default so the time corresponds to submit-receipt
 * rather than form-render. PR 5 keeps it that way; a future PR can
 * capture form-open time if we want stricter attempt analytics.
 */
export async function submitQuizAction(args: {
  locale: string;
  moduleId: ModuleQuizId;
  answers: Record<string, string>;
}): Promise<void> {
  const { locale, moduleId, answers } = args;

  const session = await auth();
  if (!session?.user?.email) {
    redirect(`/${locale}/portal/login`);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
  if (!user) redirect(`/${locale}/portal/login`);
  if (!user.paidAt && !isAdminEmail(session.user.email)) {
    redirect(`/${locale}/portal`);
  }

  const viewable = resolveViewableModule({
    isOwner: isAdminEmail(session.user.email),
    userTier: user.tier,
    id: moduleId,
  });
  if (!viewable) notFound();

  const questions = getQuiz(moduleId);
  if (questions.length === 0) {
    // Module has no questions yet — abort silently and bounce back.
    redirect(`/${locale}/portal/modulos/${moduleId}`);
  }

  const threshold = getPassingThreshold();
  const { score, total, percentage, passed } = scoreQuiz(questions, answers, threshold);

  // Persist the attempt. We always insert a fresh row so retries are
  // first-class — the results page reads the most recent row, but every
  // attempt stays in the table for future analytics.
  await db.insert(quizAttempts).values({
    userId: user.id,
    moduleId: viewable.module.ordinal,
    phase: "post",
    submittedAt: new Date(),
    answers,
    score,
    percentage: percentage.toFixed(2),
    passed,
  });

  void total;

  // If this pass completes the certificate, send the "certificate ready"
  // email once. Best-effort — the helper swallows every error, so it can
  // never block the results redirect. Only worth checking on a pass.
  if (passed) {
    await notifyCertificateReadyIfEligible({
      userId: user.id,
      name: user.name,
      email: user.email,
      tier: user.tier,
      professionalType: user.professionalType,
      locale: locale === "en" ? "en" : "es",
    });
  }

  redirect(`/${locale}/portal/modulos/${moduleId}/post-test/resultados`);
}
