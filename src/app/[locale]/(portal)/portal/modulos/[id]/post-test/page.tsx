import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { useMessages, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/glass/GlassCard";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  getQuiz,
  getPassingThreshold,
  sanitizeQuiz,
  type ModuleQuizId,
} from "@/lib/quizzes";
import { resolveModule } from "@/lib/curriculum";
import { isAdminEmail } from "@/lib/admin";
import { QuizForm } from "@/components/portal/QuizForm";
import { submitQuizAction } from "./actions";

export const metadata: Metadata = {
  title: "Post-test · SCCA Portal",
  robots: { index: false, follow: false },
};

type ModuleI18n = {
  id: string;
  day: string;
  title: string;
  summary: string;
};
type CursosGridMessages = {
  cursosGrid: { items: Array<{ modules: ModuleI18n[] }> };
  studentCurriculum?: { modules: ModuleI18n[] };
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
  if (!user.paidAt && !isAdminEmail(session.user.email)) {
    redirect(`/${locale}/portal`);
  }

  const mod = resolveModule(user.tier, id);
  if (!mod) notFound();
  const moduleId = id as ModuleQuizId;

  const questions = getQuiz(moduleId);
  const threshold = getPassingThreshold();

  return (
    <PostTestPanel
      locale={locale as "es" | "en"}
      moduleId={moduleId}
      tier={user.tier}
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
  const messages = useMessages() as unknown as CursosGridMessages;
  const moduleList =
    tier === "student"
      ? (messages.studentCurriculum?.modules ?? [])
      : (messages.cursosGrid.items[0]?.modules ?? []);
  const moduleData = moduleList.find((m) => m.id === moduleId);

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
