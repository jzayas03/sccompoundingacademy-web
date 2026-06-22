import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/glass/GlassCard";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quizAttempts, users } from "@/lib/db/schema";
import { getQuiz, getPassingThreshold, type ModuleQuizId } from "@/lib/quizzes";
import { resolveModule } from "@/lib/curriculum";
import { isAdminEmail } from "@/lib/admin";
import { ResultsList } from "./results-list";

export const metadata: Metadata = {
  title: "Resultados · SCCA Portal",
  robots: { index: false, follow: false },
};

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

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

  const mod = resolveModule(user.tier, id);
  if (!mod) notFound();
  const moduleId = id as ModuleQuizId;

  // Most recent attempt for this user+module. Older attempts stay in the
  // DB for future analytics; the results screen always reflects "latest".
  const [attempt] = await db
    .select()
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.userId, user.id),
        eq(quizAttempts.moduleId, mod.ordinal),
      ),
    )
    .orderBy(desc(quizAttempts.submittedAt))
    .limit(1);

  if (!attempt) {
    // User landed here without a submitted attempt — send them back
    // into the post-test (or to the locked dashboard state if the
    // module has no questions yet).
    redirect(`/${locale}/portal/modulos/${moduleId}/post-test`);
  }

  const questions = getQuiz(moduleId);
  const threshold = getPassingThreshold();

  return (
    <ResultsPanel
      locale={locale as "es" | "en"}
      moduleId={moduleId}
      questions={questions}
      attempt={{
        score: attempt.score ?? 0,
        percentage: Number(attempt.percentage ?? 0),
        passed: Boolean(attempt.passed),
        answers: (attempt.answers as Record<string, string> | null) ?? {},
      }}
      threshold={threshold}
    />
  );
}

function ResultsPanel({
  locale,
  moduleId,
  questions,
  attempt,
  threshold,
}: {
  locale: "es" | "en";
  moduleId: ModuleQuizId;
  questions: ReturnType<typeof getQuiz>;
  attempt: {
    score: number;
    percentage: number;
    passed: boolean;
    answers: Record<string, string>;
  };
  threshold: number;
}) {
  void locale;
  const t = useTranslations("portal.postTestResults");
  const thresholdLabel = `${Math.round(threshold * 100)}%`;
  const percentageLabel = `${Math.round(attempt.percentage * 100)}%`;
  const total = questions.length;

  return (
    <Container className="max-w-3xl py-12 sm:py-16 lg:py-20">
      <p className="text-sm">
        <Link
          href={{ pathname: "/portal/modulos/[id]", params: { id: moduleId } }}
          className="text-teal-deep hover:text-teal underline underline-offset-2"
        >
          ← {t("backToModule")}
        </Link>
      </p>

      <div className="mt-6">
        <p className="font-heading text-teal-deep/80 flex items-center text-xs font-semibold tracking-[0.18em] uppercase">
          <span aria-hidden className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm" />
          {t("eyebrow")}
        </p>
        <h1 className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl">
          {t("title")}
        </h1>
      </div>

      <GlassCard className="mt-8 p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="font-heading text-teal-deep/80 text-xs font-semibold tracking-wide uppercase">
              {t("scoreLabel")}
            </p>
            <p className="font-heading text-teal-deep mt-2 text-4xl font-bold">
              {attempt.score}
              <span className="text-teal-deep/60 text-xl"> / {total}</span>
            </p>
          </div>
          <div>
            <p className="font-heading text-teal-deep/80 text-xs font-semibold tracking-wide uppercase">
              {t("percentageLabel")}
            </p>
            <p
              className={`font-heading mt-2 text-4xl font-bold ${
                attempt.passed ? "text-teal-deep" : "text-gray-700"
              }`}
            >
              {percentageLabel}
            </p>
          </div>
        </div>

        <div className="border-gray-300 mt-6 border-t pt-6">
          <p className="font-heading text-teal-deep text-base font-semibold sm:text-lg">
            {attempt.passed ? t("passedTitle") : t("notPassedTitle")}
          </p>
          <p className="text-gray-900 mt-2 text-sm leading-relaxed sm:text-base">
            {attempt.passed
              ? t("passedBody", { threshold: thresholdLabel })
              : t("notPassedBody", { threshold: thresholdLabel })}
          </p>
        </div>
      </GlassCard>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href={{ pathname: "/portal/modulos/[id]/post-test", params: { id: moduleId } }}
          className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift font-heading inline-flex h-12 items-center justify-center rounded-md px-6 text-sm font-semibold ring-1 transition-[color,background-color,box-shadow,transform] duration-200 motion-safe:hover:-translate-y-px sm:text-base"
        >
          {t("retryButton")}
        </Link>
        <Link
          href={{ pathname: "/portal/modulos/[id]", params: { id: moduleId } }}
          className="border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-off-white font-heading inline-flex h-12 items-center justify-center rounded-md border px-6 text-sm font-semibold transition-colors"
        >
          {t("backToModule")}
        </Link>
      </div>

      <ResultsList questions={questions} answers={attempt.answers} />
    </Container>
  );
}
