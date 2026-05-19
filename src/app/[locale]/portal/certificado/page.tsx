import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { useTranslations, useMessages } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/glass/GlassCard";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { findCertificateByUser, isEligibleForCertificate } from "@/lib/certificates";

export const metadata: Metadata = {
  title: "Certificado · SCCA Portal",
  robots: { index: false, follow: false },
};

const MODULE_IDS = ["modulo-1", "modulo-2", "modulo-3"] as const;

type ModuleI18n = {
  id: string;
  day: string;
  title: string;
  summary: string;
};
type CursosGridMessages = {
  cursosGrid: { items: Array<{ modules: ModuleI18n[] }> };
};

export default async function CertificadoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

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
  if (!user.paidAt) redirect(`/${locale}/portal`);

  const eligibility = await isEligibleForCertificate(user.id);
  const cert = eligibility.eligible
    ? await findCertificateByUser(user.id)
    : null;

  return (
    <CertPanel
      passedModules={eligibility.passedModules}
      eligible={eligibility.eligible}
      certNo={cert?.certNo ?? null}
      certIssuedAt={cert?.issuedAt ?? null}
    />
  );
}

function CertPanel({
  passedModules,
  eligible,
  certNo,
  certIssuedAt,
}: {
  passedModules: { 1: boolean; 2: boolean; 3: boolean };
  eligible: boolean;
  certNo: string | null;
  certIssuedAt: Date | null;
}) {
  const t = useTranslations("portal.cert");
  const messages = useMessages() as unknown as CursosGridMessages;
  const modules = messages.cursosGrid.items[0]?.modules ?? [];

  void certNo;
  void certIssuedAt;

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
          {t("eyebrow")}
        </p>
        <h1 className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl">
          {t("title")}
        </h1>
      </div>

      {eligible ? (
        <GlassCard className="mt-10 p-8 sm:p-10">
          <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
            {t("readyTitle")}
          </p>
          <p className="text-gray-900 mt-3 text-base leading-relaxed sm:text-lg">
            {t("readyBody")}
          </p>
          <a
            href="/api/certificate"
            download
            className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift focus-visible:ring-chartreuse font-heading mt-6 inline-flex h-12 items-center rounded-md px-6 text-sm font-semibold ring-1 transition-[color,background-color,box-shadow,transform] duration-200 sm:text-base motion-safe:hover:-translate-y-px"
          >
            {t("downloadCta")} ↓
          </a>
        </GlassCard>
      ) : (
        <GlassCard className="mt-10 p-8 sm:p-10">
          <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
            {t("lockedTitle")}
          </p>
          <p className="text-gray-900 mt-3 text-base leading-relaxed">
            {t("lockedBody")}
          </p>
        </GlassCard>
      )}

      <section aria-labelledby="cert-checklist" className="mt-10">
        <h2
          id="cert-checklist"
          className="font-heading text-teal-deep text-xl font-semibold sm:text-2xl"
        >
          {t("checklistTitle")}
        </h2>
        <ul className="mt-6 space-y-3">
          {MODULE_IDS.map((moduleId, idx) => {
            const moduleNum = (idx + 1) as 1 | 2 | 3;
            const moduleData = modules.find((m) => m.id === moduleId);
            const passed = passedModules[moduleNum];
            return (
              <li
                key={moduleId}
                className={`border-gray-300 flex flex-col gap-3 rounded-md border bg-white p-4 sm:flex-row sm:items-center sm:justify-between ${
                  passed ? "" : "opacity-90"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      passed ? "bg-chartreuse text-teal-deep" : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {passed ? (
                      <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                        <path
                          d="M4 10.5l3.5 3.5L16 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <span className="text-xs font-semibold">{moduleNum}</span>
                    )}
                  </span>
                  <div>
                    <p className="font-heading text-gray-900 text-base font-semibold leading-snug">
                      {moduleData?.title ?? `Módulo ${moduleNum}`}
                    </p>
                    <p className="text-gray-700 text-xs font-medium tracking-wide uppercase">
                      {passed ? t("checklistPassed") : t("checklistPending")} · {moduleData?.day ?? ""}
                    </p>
                  </div>
                </div>
                <Link
                  href={
                    passed
                      ? {
                          pathname:
                            "/portal/modulos/[id]/post-test/resultados",
                          params: { id: moduleId },
                        }
                      : {
                          pathname: "/portal/modulos/[id]/post-test",
                          params: { id: moduleId },
                        }
                  }
                  className="text-teal-deep hover:text-teal text-sm font-semibold underline underline-offset-2"
                >
                  {passed ? t("checklistCtaResults") : t("checklistCtaTake")} →
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <GlassCard className="mt-10 p-6 sm:p-8">
        <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
          {t("verificationHintTitle")}
        </p>
        <p className="text-gray-900 mt-3 text-sm leading-relaxed">
          {t("verificationHintBody")}
        </p>
      </GlassCard>
    </Container>
  );
}
