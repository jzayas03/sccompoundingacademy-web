import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { useTranslations, useMessages, useLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { GlassCard } from "@/components/glass/GlassCard";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";
import { isEligibleForCertificate } from "@/lib/certificates";
import {
  showAcpeDisclosure,
  getModuleCatalogue,
  resolveEffectiveTier,
  type UserTier,
} from "@/lib/curriculum";
import { isAdminEmail } from "@/lib/admin";
import { getCohort } from "@/lib/cohorts";
import {
  courseAccessExpiresAt,
  isCourseAccessActive,
} from "@/lib/portal/course-access";
import { resolveVerificationGate } from "@/lib/portal/verification-gate";
import { AcpeDisclosure } from "@/components/portal/AcpeDisclosure";
import { InstructorHero } from "@/components/portal/InstructorHero";
import { SectionBanner } from "@/components/portal/SectionBanner";

export const metadata: Metadata = {
  title: "Portal · SCCA",
  robots: { index: false, follow: false },
};

export default async function PortalDashboardPage({
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

  // Re-fetch the user row so we have the portal-extension columns
  // (tier, paidAt, cohortId) that Auth.js does not surface on `session.user`.
  // If the row vanished — e.g. an admin deletion — we treat it as a forced
  // sign-out and bounce back to the login screen.
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
  if (!user) {
    redirect(`/${locale}/portal/login`);
  }

  // Student-tier users must pass matrícula verification before the
  // dashboard renders. Owners and the profesional tier are unaffected.
  if (
    resolveVerificationGate({
      isOwner: isAdminEmail(session.user.email),
      tier: user.tier,
      studentVerification: user.studentVerification,
    }) === "redirect-verificacion"
  ) {
    redirect(`/${locale}/portal/verificacion`);
  }

  // Cert eligibility surfaces a top-of-dashboard CTA when all three
  // post-tests are passed — same query the certificate page runs, just
  // pulled up one level so paid students notice the unlock without
  // hunting for the cert tab. Owners (ADMIN_EMAILS) always see the
  // cert-ready banner so they can preview the download flow.
  const isOwner = isAdminEmail(session.user.email);
  const effectiveTier = resolveEffectiveTier({
    isOwner,
    userTier: user.tier,
    preview,
  });
  // Only thread a preview through to navigation when an owner actually
  // supplied a valid one — non-owners and bare visits stay in their
  // real portal with no query pollution.
  const effectivePreview =
    isOwner && (preview === "student" || preview === "profesional")
      ? preview
      : undefined;
  // Full eligibility report (when paid or owner) drives both the
  // cert-ready banner AND the per-module "completed" state + progress bar.
  const report =
    user.paidAt || isOwner
      ? await isEligibleForCertificate(user.id, effectiveTier)
      : { eligible: false, passedModules: {} as Record<number, boolean> };
  const certEligible = isOwner || report.eligible;

  // Course-material access ends 30 days after the cohort closes; the
  // dashboard shows an "access ended" notice + locks the module strip past
  // that (the certificate stays available). Owners never gate.
  const cohort = user.cohortId ? await getCohort(user.cohortId) : null;
  const accessExpiresAt = courseAccessExpiresAt(cohort?.endDate ?? null);
  const accessActive = isCourseAccessActive({
    isOwner,
    cohortEndDate: cohort?.endDate ?? null,
    now: new Date(),
  });

  return (
    <Dashboard
      user={user}
      sessionEmail={session.user.email}
      certEligible={certEligible}
      passedModules={report.passedModules}
      isOwner={isOwner}
      effectiveTier={effectiveTier}
      preview={effectivePreview}
      accessActive={accessActive}
      accessExpiresAt={accessExpiresAt}
    />
  );
}

function Dashboard({
  user,
  sessionEmail,
  certEligible,
  passedModules,
  isOwner,
  effectiveTier,
  preview,
  accessActive,
  accessExpiresAt,
}: {
  user: User;
  sessionEmail: string;
  certEligible: boolean;
  passedModules: Record<number, boolean>;
  isOwner: boolean;
  effectiveTier: UserTier;
  preview?: "profesional" | "student";
  accessActive: boolean;
  accessExpiresAt: Date | null;
}) {
  const t = useTranslations("portal.dashboard");
  const locale = useLocale() === "en" ? "en" : "es";
  const modules = getModuleCatalogue(useMessages(), effectiveTier);
  const displayName = user.name?.trim() || sessionEmail.split("@")[0] || t("fallbackName");
  // Owners get the full unlocked layout without a real Stripe payment.
  const isPaid = Boolean(user.paidAt) || isOwner;
  // Course-material access ends 30 days after the cohort closes. Past that a
  // paid student can still see the dashboard + get their certificate, but the
  // module strip locks. `materialLocked` = paid but past the window.
  const canOpenModules = isPaid && accessActive;
  const materialLocked = isPaid && !accessActive;
  const accessEndedLabel = accessExpiresAt
    ? new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-PR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(accessExpiresAt)
    : "";
  // Catalogue order matches curriculum ordinals (1..N), so the module at
  // index `idx` is completed iff its ordinal (idx+1) passed.
  const isCompleted = (idx: number) => passedModules[idx + 1] === true;
  const completedCount = modules.filter((_, idx) => isCompleted(idx)).length;

  return (
    <>
      {/* Photo section banner — replaces the old eyebrow + greeting block;
          the greeting is now the banner title (glassmorphism redesign). */}
      <SectionBanner
        photo="/photos/photo-cursos-bench.jpg"
        eyebrow={t("eyebrow")}
        title={t("greeting", { name: displayName })}
      />

      {/* Instructor hero — compact glass card right under the greeting
          so paid students see the human anchor for the course before
          the payment + cert + module banners. */}
      <InstructorHero />

      {/* ACPE Standard 3 — learner-facing financial-relationships
          disclosure. Must appear before any module content. */}
      {showAcpeDisclosure(effectiveTier) && <AcpeDisclosure locale={locale} />}

      {/* Payment-pending alert — primary CTA when the user has not paid yet. */}
      {!isPaid && (
        <GlassCard interactive={false} className="mt-10 p-6 sm:p-8">
          <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
            {t("paymentPendingTitle")}
          </p>
          <p className="text-gray-900 mt-3 text-base leading-relaxed">
            {t("paymentPendingBody")}
          </p>
          <div className="mt-6">
            <Link
              href="/inscripcion"
              className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift focus-visible:ring-chartreuse font-heading inline-flex h-12 items-center rounded-md px-6 text-sm font-semibold ring-1 transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none sm:text-base motion-safe:hover:-translate-y-px"
            >
              {t("paymentCta")} →
            </Link>
          </div>
        </GlassCard>
      )}

      {/* Certificate-ready banner — shows once a paid student has passed
          all three post-tests. Sits above the module strip so the unlock
          is the first thing the user notices on their next visit. The
          paired "leave a review" card lands directly below; clicking it
          goes to /portal/reseñas which gracefully handles the
          already-submitted state. */}
      {isPaid && certEligible && (
        <div className="mt-10 space-y-4">
          <GlassCard interactive={false} className="p-6 sm:p-8">
            <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
              {t("certReadyTitle")}
            </p>
            <p className="text-gray-900 mt-3 text-base leading-relaxed">
              {t("certReadyBody")}
            </p>
            <div className="mt-6">
              <Link
                href="/portal/certificado"
                className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift focus-visible:ring-chartreuse font-heading inline-flex h-12 items-center rounded-md px-6 text-sm font-semibold ring-1 transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none sm:text-base motion-safe:hover:-translate-y-px"
              >
                {t("certReadyCta")} →
              </Link>
            </div>
          </GlassCard>

          <GlassCard interactive={false} className="p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
                  {t("reviewPromptTitle")}
                </p>
                <p className="text-gray-900 mt-2 text-sm leading-relaxed">
                  {t("reviewPromptBody")}
                </p>
              </div>
              <Link
                href="/portal/resenas"
                className="border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-off-white focus-visible:ring-chartreuse font-heading inline-flex h-10 shrink-0 items-center justify-center rounded-md border px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
              >
                {t("reviewPromptCta")} →
              </Link>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Access-ended notice — a paid student past the 30-day post-cohort
          window keeps the dashboard + certificate, but the module material
          locks. */}
      {materialLocked && (
        <GlassCard interactive={false} className="mt-10 p-6 sm:p-8">
          <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
            {t("accessEndedTitle")}
          </p>
          <p className="text-gray-900 mt-3 text-base leading-relaxed">
            {t("accessEndedBody", { date: accessEndedLabel })}
          </p>
          <div className="mt-6">
            <Link
              href="/portal/certificado"
              className="border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-off-white focus-visible:ring-chartreuse font-heading inline-flex h-11 items-center rounded-md border px-5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
            >
              {t("accessEndedCta")} →
            </Link>
          </div>
        </GlassCard>
      )}

      {/* Module strip — locked decorative cards until `paidAt` is set (and
          while the access window is open), then each card becomes a Link
          into /portal/modulos/[id]. The module page + PDF route re-check the
          paywall AND the access window as defense in depth. */}
      <section aria-labelledby="modules-heading" className="mt-12">
        <div className="flex items-end justify-between">
          <h2
            id="modules-heading"
            className="font-heading text-teal-deep text-xl font-semibold sm:text-2xl"
          >
            {t("modulesTitle")}
          </h2>
          <p className="text-gray-700 text-xs italic">
            {canOpenModules ? t("modulesUnlockedHint") : t("modulesLockedHint")}
          </p>
        </div>

        {/* Progress meter — completed post-tests / total modules. */}
        {isPaid && modules.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div className="bg-teal-deep/10 h-[3px] flex-1 rounded-full">
              <div
                className="bg-chartreuse h-full rounded-full"
                style={{ width: `${(completedCount / modules.length) * 100}%` }}
              />
            </div>
            <span className="text-teal-deep/55 text-[13px] font-medium tabular-nums whitespace-nowrap">
              {completedCount} / {modules.length}
            </span>
          </div>
        )}

        <ul
          className={`mt-6 grid grid-cols-1 gap-4 ${
            modules.length === 2 ? "sm:grid-cols-2" : "md:grid-cols-3"
          }`}
        >
          {modules.map((mod, idx) => (
            <li key={mod.id}>
              {canOpenModules ? (
                <Link
                  href={{
                    pathname: "/portal/modulos/[id]",
                    params: { id: mod.id },
                    ...(preview ? { query: { preview } } : {}),
                  }}
                  aria-label={t("moduleOpenAria", { n: idx + 1 })}
                  className="focus-visible:ring-chartreuse block h-full rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-off-white focus-visible:outline-none"
                >
                  {isCompleted(idx) ? (
                    /* Completed — solid teal-deep fill + chartreuse check. */
                    <div className="bg-teal-deep shadow-lift relative flex h-full flex-col rounded-lg p-5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-chartreuse font-heading text-xs font-semibold tracking-wide uppercase">
                          {mod.day}
                        </p>
                        <svg aria-hidden viewBox="0 0 20 20" fill="none" className="text-chartreuse h-4 w-4 shrink-0">
                          <path d="M4 10.5l3.5 3.5L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <p className="text-off-white font-heading mt-2 text-base font-semibold leading-snug">
                        {mod.title}
                      </p>
                      <p className="text-off-white/70 mt-3 text-sm leading-relaxed">
                        {mod.summary}
                      </p>
                    </div>
                  ) : (
                    <GlassCard interactive className="relative flex h-full flex-col p-5">
                      <p className="font-heading text-teal-deep/80 text-xs font-semibold tracking-wide uppercase">
                        {mod.day}
                      </p>
                      <p className="font-heading text-gray-900 mt-2 text-base font-semibold leading-snug">
                        {mod.title}
                      </p>
                      <p className="text-gray-700 mt-3 text-sm leading-relaxed">
                        {mod.summary}
                      </p>
                      {/* Available badge — chartreuse accent. */}
                      <span className="bg-chartreuse text-teal-deep absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide uppercase">
                        {t("openBadge")} →
                      </span>
                    </GlassCard>
                  )}
                </Link>
              ) : (
                <GlassCard
                  interactive={false}
                  aria-label={t("moduleAria", { n: idx + 1 })}
                  className="relative flex h-full flex-col p-5 opacity-70"
                >
                  <p className="font-heading text-teal-deep/80 text-xs font-semibold tracking-wide uppercase">
                    {mod.day}
                  </p>
                  <p className="font-heading text-gray-900 mt-2 text-base font-semibold leading-snug">
                    {mod.title}
                  </p>
                  <p className="text-gray-700 mt-3 text-sm leading-relaxed">
                    {mod.summary}
                  </p>
                  {/* Locked badge — gray, matches the disabled look. */}
                  <span className="bg-gray-300 text-gray-900 absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide uppercase">
                    <svg
                      aria-hidden
                      viewBox="0 0 16 16"
                      fill="none"
                      className="h-3 w-3"
                    >
                      <path
                        d="M4 7V5a4 4 0 018 0v2m-9 0h10v7H3V7z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {t("lockedBadge")}
                  </span>
                </GlassCard>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
