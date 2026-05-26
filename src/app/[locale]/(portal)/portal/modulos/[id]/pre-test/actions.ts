"use server";

import { redirect } from "next/navigation";
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
import { isAdminEmail } from "@/lib/admin";

/**
 * Submit a module pre-test attempt.
 *
 * The pre-test is diagnostic: it uses the same question bank as the
 * post-test but there is no pass/fail gate. The answers are still
 * scored and stored (with `phase: "pre"`) so the owner can compare
 * pre vs post performance — the pre/post learning gain. The
 * `phase: "pre"` tag is what keeps `isEligibleForCertificate` from ever
 * counting a pre-test toward the certificate.
 *
 * On success the student is sent to the module content page — the
 * pre-test is the gate that unlocks it.
 */
export async function submitPreTestAction(args: {
  locale: string;
  moduleId: ModuleQuizId;
  answers: Record<string, string>;
}): Promise<void> {
  const { locale, moduleId, answers } = args;

  const session = await auth();
  if (!session?.user?.email) redirect(`/${locale}/portal/login`);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
  if (!user) redirect(`/${locale}/portal/login`);
  if (!user.paidAt && !isAdminEmail(session.user.email)) {
    redirect(`/${locale}/portal`);
  }

  const questions = getQuiz(moduleId);
  if (questions.length === 0) {
    redirect(`/${locale}/portal/modulos/${moduleId}`);
  }

  // Scored for the pre/post record only — `passed` is stored but never
  // gates anything for a pre-test.
  const { score, percentage, passed } = scoreQuiz(
    questions,
    answers,
    getPassingThreshold(),
  );

  await db.insert(quizAttempts).values({
    userId: user.id,
    moduleId: moduleQuizIdToInt(moduleId),
    phase: "pre",
    submittedAt: new Date(),
    answers,
    score,
    percentage: percentage.toFixed(2),
    passed,
  });

  redirect(`/${locale}/portal/modulos/${moduleId}`);
}

/** Translate the textual module id into the integer column the DB uses. */
function moduleQuizIdToInt(id: ModuleQuizId): number {
  if (id === "modulo-1") return 1;
  if (id === "modulo-2") return 2;
  return 3;
}
