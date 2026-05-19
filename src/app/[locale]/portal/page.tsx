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
import { users, type User } from "@/lib/db/schema";
import { isEligibleForCertificate } from "@/lib/certificates";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: "Portal · SCCA",
  robots: { index: false, follow: false },
};

type ModuleI18n = {
  id: string;
  day: string;
  title: string;
  summary: string;
};

type CursosGridMessages = {
  cursosGrid: {
    items: Array<{
      modules: ModuleI18n[];
    }>;
  };
};

export default async function PortalDashboardPage({
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

  // Cert eligibility surfaces a top-of-dashboard CTA when all three
  // post-tests are passed — same query the certificate page runs, just
  // pulled up one level so paid students notice the unlock without
  // hunting for the cert tab.
  const certEligible = user.paidAt
    ? (await isEligibleForCertificate(user.id)).eligible
    : false;

  return (
    <Dashboard
      user={user}
      sessionEmail={session.user.email}
      certEligible={certEligible}
    />
  );
}

function Dashboard({
  user,
  sessionEmail,
  certEligible,
}: {
  user: User;
  sessionEmail: string;
  certEligible: boolean;
}) {
  const t = useTranslations("portal.dashboard");
  const messages = useMessages() as unknown as CursosGridMessages;
  const modules = messages.cursosGrid.items[0]?.modules ?? [];
  const displayName = user.name?.trim() || sessionEmail.split("@")[0] || t("fallbackName");
  const isPaid = Boolean(user.paidAt);

  return (
    <Container className="max-w-4xl py-16 sm:py-20 lg:py-24">
      {/* Header row: greeting + logout. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-teal-deep/80 flex items-center text-xs font-semibold tracking-[0.18em] uppercase">
            <span
              aria-hidden
              className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm"
            />
            {t("eyebrow")}
          </p>
          <h1 className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl">
            {t("greeting", { name: displayName })}
          </h1>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-off-white font-heading inline-flex h-10 items-center rounded-md border px-4 text-sm font-semibold transition-colors"
          >
            {t("logout")}
          </button>
        </form>
      </div>

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
          is the first thing the user notices on their next visit. */}
      {isPaid && certEligible && (
        <GlassCard interactive={false} className="mt-10 p-6 sm:p-8">
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
      )}

      {/* Module strip — locked decorative cards until `paidAt` is set, then
          each card becomes a Link into /portal/modulos/[id]. Middleware
          still does the redirect-to-login pass; the module page itself
          re-checks paidAt as defense in depth. */}
      <section aria-labelledby="modules-heading" className="mt-12">
        <div className="flex items-end justify-between">
          <h2
            id="modules-heading"
            className="font-heading text-teal-deep text-xl font-semibold sm:text-2xl"
          >
            {t("modulesTitle")}
          </h2>
          <p className="text-gray-700 text-xs italic">
            {isPaid ? t("modulesUnlockedHint") : t("modulesLockedHint")}
          </p>
        </div>

        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {modules.map((mod, idx) => (
            <li key={mod.id}>
              {isPaid ? (
                <Link
                  href={{ pathname: "/portal/modulos/[id]", params: { id: mod.id } }}
                  aria-label={t("moduleOpenAria", { n: idx + 1 })}
                  className="block h-full"
                >
                  <GlassCard
                    interactive
                    className="relative flex h-full flex-col p-5"
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
                    {/* Available badge — chartreuse accent. */}
                    <span className="bg-chartreuse text-teal-deep absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide uppercase">
                      {t("openBadge")} →
                    </span>
                  </GlassCard>
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
    </Container>
  );
}
