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
import { getQuiz, sanitizeQuiz, type ModuleQuizId } from "@/lib/quizzes";
import { resolveModule } from "@/lib/curriculum";
import { isAdminEmail } from "@/lib/admin";
import { QuizForm } from "@/components/portal/QuizForm";
import { submitPreTestAction } from "./actions";

export const metadata: Metadata = {
  title: "Pre-test · SCCA Portal",
  robots: { index: false, follow: false },
};

type ModuleI18n = { id: string; day: string; title: string; summary: string };
type CursosGridMessages = {
  cursosGrid: { items: Array<{ modules: ModuleI18n[] }> };
  studentCurriculum?: { modules: ModuleI18n[] };
};

/**
 * `/[locale]/portal/modulos/[id]/pre-test` — diagnostic pre-test taken
 * before the module content unlocks.
 *
 * The pre-test is one-shot: if the student already has a `phase: "pre"`
 * attempt for this module, we bounce straight to the module page so
 * they cannot retake it (and so the module-page gate, which checks the
 * same condition, does not ping-pong them back here).
 */
export default async function PreTestPage({
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

  // Owner emails bypass payment + the one-shot gate so the academy can
  // re-preview the pre-test layout as many times as needed.
  const isOwner = isAdminEmail(session.user.email);
  if (!user.paidAt && !isOwner) redirect(`/${locale}/portal`);

  const mod = resolveModule(user.tier, id);
  if (!mod) notFound();
  const moduleId = id as ModuleQuizId;

  // One-shot: already completed → straight to the module content.
  // Owners can re-render this page even after a previous submission.
  if (!isOwner) {
    const [existing] = await db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, user.id),
          eq(quizAttempts.moduleId, mod.ordinal),
          eq(quizAttempts.phase, "pre"),
        ),
      )
      .limit(1);
    if (existing) redirect(`/${locale}/portal/modulos/${moduleId}`);
  }

  const questions = getQuiz(moduleId);

  return (
    <PreTestPanel
      locale={locale as "es" | "en"}
      moduleId={moduleId}
      tier={user.tier}
      questions={questions}
    />
  );
}

function PreTestPanel({
  locale,
  moduleId,
  tier,
  questions,
}: {
  locale: "es" | "en";
  moduleId: ModuleQuizId;
  tier: import("@/lib/curriculum").UserTier;
  questions: ReturnType<typeof getQuiz>;
}) {
  const t = useTranslations("portal.preTest");
  const messages = useMessages() as unknown as CursosGridMessages;
  const moduleList =
    tier === "student"
      ? (messages.studentCurriculum?.modules ?? [])
      : (messages.cursosGrid.items[0]?.modules ?? []);
  const moduleData = moduleList.find((m) => m.id === moduleId);

  const isEmpty = questions.length === 0;
  const sanitized = sanitizeQuiz(questions);

  return (
    <Container className="max-w-3xl py-12 sm:py-16 lg:py-20">
      <p className="text-sm">
        <Link
          href="/portal"
          className="text-teal-deep hover:text-teal underline underline-offset-2"
        >
          ← {t("backToDashboard")}
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
              {t("introBody", { total: questions.length })}
            </p>
          </GlassCard>

          <GlassCard className="mt-6 p-6 sm:p-8">
            <QuizForm
              locale={locale}
              moduleId={moduleId}
              questions={sanitized}
              submitAction={submitPreTestAction}
            />
          </GlassCard>
        </>
      )}
    </Container>
  );
}
