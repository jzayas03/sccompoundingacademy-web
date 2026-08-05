import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { useMessages, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/glass/GlassCard";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, quizAttempts } from "@/lib/db/schema";
import { resolveModuleAccess } from "@/lib/portal/module-access";
import { resolveVerificationGate } from "@/lib/portal/verification-gate";
import { getCohort } from "@/lib/cohorts";
import { isCourseAccessActive } from "@/lib/portal/course-access";
import {
  getQuiz,
  getPassingThreshold,
  sanitizeQuiz,
  type ModuleQuizId,
} from "@/lib/quizzes";
import { resolveViewableModule, getModuleCatalogue } from "@/lib/curriculum";
import { isAdminEmail } from "@/lib/admin";
import { QuizForm } from "@/components/portal/QuizForm";
import { ModuleStepper } from "@/components/portal/ModuleStepper";
import { submitQuizAction } from "./actions";

export const metadata: Metadata = {
  title: "Post-test · SCCA Portal",
  robots: { index: false, follow: false },
};

export default async function PostTestPage({
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
  const isOwner = isAdminEmail(session.user.email);

  const viewable = resolveViewableModule({ isOwner, userTier: user.tier, id });
  if (!viewable) notFound();
  const moduleId = id as ModuleQuizId;

  // Student matrícula gate — same defense-in-depth as the module page.
  if (
    resolveVerificationGate({
      isOwner,
      tier: user.tier,
      studentVerification: user.studentVerification,
    }) === "redirect-verificacion"
  ) {
    redirect(`/${locale}/portal/verificacion`);
  }

  const questions = getQuiz(moduleId);

  // Payment + pre-test gate. The post-test is the graded attempt that
  // earns the certificate, so it must sit BEHIND the same policy that
  // guards the module content — otherwise a paid student can reach the
  // credit-bearing test by URL without the diagnostic pre-test or the
  // presentation, which makes the pre/post pair meaningless.
  let hasPreAttempt = false;
  if (!isOwner && user.paidAt && questions.length > 0) {
    const [preDone] = await db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, user.id),
          eq(quizAttempts.moduleId, viewable.module.ordinal),
          eq(quizAttempts.phase, "pre"),
        ),
      )
      .limit(1);
    hasPreAttempt = Boolean(preDone);
  }

  const access = resolveModuleAccess({
    isOwner,
    hasPaid: Boolean(user.paidAt) || isOwner,
    hasQuiz: questions.length > 0,
    hasPreAttempt,
  });
  if (access.kind === "redirect") {
    redirect(
      access.to === "pre-test"
        ? `/${locale}/portal/modulos/${moduleId}/pre-test`
        : `/${locale}/portal`,
    );
  }

  // Access window — a graduate past the 30-day window keeps the
  // certificate but cannot sit the test again.
  const cohort = user.cohortId ? await getCohort(user.cohortId) : null;
  if (
    !isCourseAccessActive({
      isOwner,
      cohortEndDate: cohort?.endDate ?? null,
      accessExtendedUntil: user.accessExtendedUntil,
      now: new Date(),
    })
  ) {
    redirect(`/${locale}/portal`);
  }
  const threshold = getPassingThreshold();

  return (
    <PostTestPanel
      locale={locale as "es" | "en"}
      moduleId={moduleId}
      tier={viewable.tier}
      questions={questions}
      threshold={threshold}
    />
  );
}

function PostTestPanel({
  locale,
  moduleId,
  tier,
  questions,
  threshold,
}: {
  locale: "es" | "en";
  moduleId: ModuleQuizId;
  tier: import("@/lib/curriculum").UserTier;
  questions: ReturnType<typeof getQuiz>;
  threshold: number;
}) {
  const t = useTranslations("portal.postTest");
  // Pull the module display name from the same catalogue the landing
  // and portal dashboard render — keeps copy in sync without a separate
  // portal-side i18n branch for module titles.
  const moduleData = getModuleCatalogue(useMessages(), tier).find(
    (m) => m.id === moduleId,
  );

  const isEmpty = questions.length === 0;
  const sanitized = sanitizeQuiz(questions);
  const thresholdLabel = `${Math.round(threshold * 100)}%`;

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
          {t("eyebrow")} · {moduleData?.day ?? ""}
        </p>
        <h1 className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl">
          {t("title")}
        </h1>
        {moduleData?.title && (
          <p className="font-heading text-teal-deep/80 mt-2 text-sm font-semibold tracking-wide uppercase">
            {moduleData.title}
          </p>
        )}
        {/* Step 3 of 3 — the graded attempt that closes the module. */}
        <ModuleStepper step="post-test" />
      </div>

      {isEmpty ? (
        <GlassCard className="mt-10 p-8 sm:p-10">
          <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
            {t("pendingTitle")}
          </p>
          <p className="text-gray-900 mt-3 text-base leading-relaxed">
            {t("pendingBody")}
          </p>
        </GlassCard>
      ) : (
        <>
          <GlassCard className="mt-10 p-6 sm:p-8">
            <p className="text-gray-900 text-sm leading-relaxed sm:text-base">
              {t("introBody", { total: questions.length, threshold: thresholdLabel })}
            </p>
          </GlassCard>

          <GlassCard className="mt-6 p-6 sm:p-8">
            <QuizForm
              locale={locale}
              moduleId={moduleId}
              questions={sanitized}
              submitAction={submitQuizAction}
            />
          </GlassCard>
        </>
      )}
    </Container>
  );
}
