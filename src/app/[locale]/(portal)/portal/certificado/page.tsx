import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { useTranslations, useMessages } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { GlassCard } from "@/components/glass/GlassCard";
import { SectionBanner } from "@/components/portal/SectionBanner";
import { CertShareRow } from "@/components/portal/CertShareRow";
import { CertPreview } from "@/components/portal/CertPreview";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { findCertificateByUser, isEligibleForCertificate } from "@/lib/certificates";
import {
  getCurriculum,
  requiredOrdinals,
  getModuleCatalogue,
  resolveEffectiveTier,
  type UserTier,
} from "@/lib/curriculum";
import { isAdminEmail } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Certificado · SCCA Portal",
  robots: { index: false, follow: false },
};

export default async function CertificadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { locale } = await params;
  const { preview } = await searchParams;
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

  // Owners (ADMIN_EMAILS) preview the cert page as if all prerequisites
  // are met — bypasses payment + post-test eligibility. The cert PDF
  // they download is a preview (no DB row, "SCCA-PREVIEW" number).
  const isOwner = isAdminEmail(session.user.email);
  if (!user.paidAt && !isOwner) redirect(`/${locale}/portal`);

  const effectiveTier = resolveEffectiveTier({
    isOwner,
    userTier: user.tier,
    preview,
  });
  // Only thread a preview through to navigation when an owner actually
  // supplied a valid one — keeps the previewed portal sticky across the
  // download link + checklist links without leaking the param to others.
  const effectivePreview =
    isOwner && (preview === "student" || preview === "profesional")
      ? preview
      : undefined;

  const eligibility = await isEligibleForCertificate(user.id, effectiveTier);
  const eligible = eligibility.eligible || isOwner;
  const passedModules = isOwner
    ? Object.fromEntries(requiredOrdinals(effectiveTier).map((o) => [o, true]))
    : eligibility.passedModules;
  const cert = eligibility.eligible
    ? await findCertificateByUser(user.id)
    : null;

  // Public verification URL the share buttons point at. A real cert row
  // deep-links to its own SCCA-{YYYY}-{NNN} page; owners previewing (no
  // row) fall back to the verification index.
  const shareUrl = cert?.certNo
    ? `https://sccompoundingacademy.com/verificar/${cert.certNo}`
    : "https://sccompoundingacademy.com/verificar";

  return (
    <CertPanel
      passedModules={passedModules}
      eligible={eligible}
      completedCount={
        requiredOrdinals(effectiveTier).filter((o) => passedModules[o]).length
      }
      shareUrl={shareUrl}
      modules={getCurriculum(effectiveTier)}
      tier={effectiveTier}
      preview={effectivePreview}
    />
  );
}

/** Tier-accurate preview of the real (English) certificate PDF — the
 *  same course + credit lines `certificates/render.ts` prints. Kept in
 *  English on purpose: it mirrors the actual credential, not the UI. */
const CERT_MOCK = {
  profesional: {
    title: "Basic Non-Sterile Compounding",
    sub: "for Pharmacists & Pharmacy Technicians",
    credit: "18 contact hours · 1.8 CEUs",
  },
  student: {
    title: "Nonsterile Compounding — Student Program",
    sub: "Student Track — Foundations of Nonsterile Compounding",
    credit: "Certificate of Completion · USP <795> & <800>",
  },
} as const;

function CertPanel({
  passedModules,
  eligible,
  completedCount,
  shareUrl,
  modules,
  tier,
  preview,
}: {
  passedModules: Record<number, boolean>;
  eligible: boolean;
  completedCount: number;
  shareUrl: string;
  modules: readonly { id: string; ordinal: number }[];
  tier: UserTier;
  preview?: "profesional" | "student";
}) {
  const t = useTranslations("portal.cert");
  const moduleList = getModuleCatalogue(useMessages(), tier);
  // Matches render.ts's student-vs-everything-else split (pharmacist +
  // profesional both print the CE-bearing "Basic Non-Sterile" credential).
  const mock = tier === "student" ? CERT_MOCK.student : CERT_MOCK.profesional;

  return (
    <>
      <SectionBanner
        photo="/photos/photo-mortar.jpg"
        eyebrow={t("eyebrow")}
        title={t("title")}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Once eligible, render the REAL certificate PDF (page 1) so the
            card is a live preview of the download; until then, a blurred
            tier-accurate mock behind a lock. */}
        <div className="shadow-lift bg-teal-deep relative aspect-[1.42/1] overflow-hidden rounded-[20px] border border-white/40">
          {eligible ? (
            <CertPreview
              pdfUrl={
                preview ? `/api/certificate?preview=${preview}` : "/api/certificate"
              }
            />
          ) : (
            <>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                style={{
                  background: "linear-gradient(160deg, var(--color-teal-deep), #123f48)",
                  filter: "blur(6px) grayscale(0.3)",
                  opacity: 0.55,
                }}
              >
                <p className="text-chartreuse text-[11px] font-bold tracking-[0.22em] uppercase">
                  Certificate of Completion
                </p>
                <h2 className="font-heading text-off-white mt-3.5 mb-1.5 text-[22px] font-extrabold">
                  {mock.title}
                </h2>
                <p className="text-[12.5px] text-[rgba(243,243,244,0.75)]">
                  Santa Cruz Compounding Academy · {mock.credit}
                </p>
                <div className="mt-5 h-px w-16 bg-[rgba(230,234,130,0.6)]" />
                <p className="mt-2.5 text-[12px] text-[rgba(243,243,244,0.6)]">
                  {mock.sub}
                </p>
                <p className="mt-1 text-[12px] text-[rgba(243,243,244,0.6)]">
                  Jorge L. Reyes Quiñones, RPh — Program Director
                </p>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[rgba(18,60,69,0.35)]">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-off-white h-7 w-7"
                >
                  <rect x="4.5" y="10.5" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M8 10.5V7.5a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                <p
                  className="text-off-white text-[13px] font-semibold"
                  style={{ textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}
                >
                  {t("mockLockOverlay", { count: modules.length })}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Status + download + share. */}
        <div
          className="glass-card rounded-[20px] border border-white/40 p-7"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <p className="text-gray-700 text-[13px] leading-[1.7]">
            {eligible
              ? t("readyBody")
              : t("progressBody", { done: completedCount, total: modules.length })}
          </p>

          <a
            href={
              eligible
                ? preview
                  ? `/api/certificate?preview=${preview}`
                  : "/api/certificate"
                : undefined
            }
            download={eligible ? true : undefined}
            aria-disabled={eligible ? undefined : true}
            className={
              eligible
                ? "bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift focus-visible:ring-chartreuse font-heading mt-5 inline-flex h-12 w-full items-center justify-center rounded-md px-6 text-sm font-semibold ring-1 transition-[color,background-color,box-shadow,transform] duration-200 motion-safe:hover:-translate-y-px"
                : "border-teal-deep/20 text-teal-deep/50 font-heading pointer-events-none mt-5 inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-md border px-6 text-sm font-semibold opacity-60"
            }
          >
            {t("downloadCta")} {eligible ? "↓" : ""}
          </a>

          <div className="mt-5">
            <p className="text-teal-deep mb-2.5 text-[12.5px] font-semibold">
              {t("shareTitle")}
            </p>
            <CertShareRow url={shareUrl} disabled={!eligible} />
          </div>
        </div>
      </div>

      <section aria-labelledby="cert-checklist" className="mt-10">
        <h2
          id="cert-checklist"
          className="font-heading text-teal-deep text-xl font-semibold sm:text-2xl"
        >
          {t("checklistTitle")}
        </h2>
        <ul className="mt-6 space-y-3">
          {modules.map((mod) => {
            const moduleId = mod.id;
            const moduleNum = mod.ordinal;
            const moduleData = moduleList.find((m) => m.id === moduleId);
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
                          ...(preview ? { query: { preview } } : {}),
                        }
                      : {
                          pathname: "/portal/modulos/[id]/post-test",
                          params: { id: moduleId },
                          ...(preview ? { query: { preview } } : {}),
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

      {/* Reviews entry — surfaces only after the student is eligible so
          they have something to review. Goes through /portal/reseñas
          which handles the already-submitted state on its own. */}
      {eligible && (
        <p className="mt-8 text-center text-sm">
          <Link
            href="/portal/resenas"
            className="text-teal-deep hover:text-teal underline underline-offset-2"
          >
            {t("reviewLinkLabel")} →
          </Link>
        </p>
      )}
    </>
  );
}
