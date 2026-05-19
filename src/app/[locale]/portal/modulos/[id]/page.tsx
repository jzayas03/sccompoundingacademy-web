import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { useTranslations, useMessages } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/glass/GlassCard";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Módulo · SCCA Portal",
  robots: { index: false, follow: false },
};

/**
 * `/[locale]/portal/modulos/[id]` — per-module workspace.
 *
 * Path-param validation: the dashboard module strip uses ids `modulo-1`,
 * `modulo-2`, `modulo-3` (matches the i18n catalogue at
 * `cursosGrid.items[0].modules`). Anything else → 404.
 *
 * Gating happens in two layers:
 *   1. `src/middleware.ts` redirects unauthenticated requests to
 *      `/portal/login` before the page even mounts.
 *   2. Here we query `users.paidAt` and bounce the user back to the
 *      dashboard (which surfaces the payment CTA) if they have not paid
 *      yet. Belt-and-suspenders against a paid-but-not-yet-paid window.
 *
 * PDF discovery: at request time we check whether the matching file
 * exists under `public/modulos/`. Until the owner uploads the Gamma
 * exports, we render a "coming soon" GlassCard in place of the viewer.
 * As soon as a file lands at e.g. `public/modulos/dia-1.pdf` the
 * `<object>` viewer takes over without code changes.
 */

const MODULE_IDS = ["modulo-1", "modulo-2", "modulo-3"] as const;
type ModuleId = (typeof MODULE_IDS)[number];

function dayNumberFromId(id: string): number | null {
  const idx = MODULE_IDS.indexOf(id as ModuleId);
  return idx >= 0 ? idx + 1 : null;
}

type ModuleMessage = {
  id: string;
  day: string;
  title: string;
  summary: string;
};

type CursosGridMessages = {
  cursosGrid: {
    items: Array<{ modules: ModuleMessage[] }>;
  };
};

export default async function ModulePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const day = dayNumberFromId(id);
  if (day === null) notFound();

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

  const pdfHref = `/modulos/dia-${day}.pdf`;
  const pdfAbsolutePath = join(process.cwd(), "public", "modulos", `dia-${day}.pdf`);
  const pdfExists = existsSync(pdfAbsolutePath);

  return <ModuleView id={id as ModuleId} day={day} pdfHref={pdfHref} pdfExists={pdfExists} />;
}

function ModuleView({
  id,
  day,
  pdfHref,
  pdfExists,
}: {
  id: ModuleId;
  day: number;
  pdfHref: string;
  pdfExists: boolean;
}) {
  const t = useTranslations("portal.module");
  const messages = useMessages() as unknown as CursosGridMessages;
  const moduleData = messages.cursosGrid.items[0]?.modules.find((m) => m.id === id);

  return (
    <Container className="max-w-5xl py-16 sm:py-20 lg:py-24">
      {/* Breadcrumb back to dashboard */}
      <p className="text-sm">
        <Link
          href="/portal"
          className="text-teal-deep hover:text-teal underline underline-offset-2"
        >
          ← {t("backToDashboard")}
        </Link>
      </p>

      {/* Header — eyebrow + module day + title + summary */}
      <div className="mt-6">
        <p className="font-heading text-teal-deep/80 flex items-center text-xs font-semibold tracking-[0.18em] uppercase">
          <span aria-hidden className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm" />
          {t("eyebrow")} · {moduleData?.day ?? `Día ${day}`}
        </p>
        <h1 className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl">
          {moduleData?.title ?? `Módulo ${day}`}
        </h1>
        {moduleData?.summary && (
          <p className="text-gray-900 mt-4 max-w-3xl text-base leading-relaxed sm:text-lg">
            {moduleData.summary}
          </p>
        )}
      </div>

      {/* Viewer — switches to a "coming soon" GlassCard until the owner
          uploads the Gamma-produced PDF to public/modulos/dia-{n}.pdf. */}
      <section aria-label={t("viewerTitle")} className="mt-10">
        {pdfExists ? (
          <GlassCard className="overflow-hidden p-0">
            <object
              data={pdfHref}
              type="application/pdf"
              className="block h-[70vh] w-full"
            >
              <p className="text-gray-900 p-6 text-sm">
                {t("viewerFallback")}
              </p>
            </object>
          </GlassCard>
        ) : (
          <GlassCard className="p-8 sm:p-10">
            <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
              {t("pdfMissingTitle")}
            </p>
            <p className="text-gray-900 mt-3 text-base leading-relaxed">
              {t("pdfMissingBody")}
            </p>
          </GlassCard>
        )}
      </section>

      {/* Action row — download + post-test link.
          PR 5 swaps the post-test CTA's `href` to /portal/modulos/[id]/post-test
          once the quiz engine ships; until then the button is rendered
          disabled with an explanatory hint. */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        {pdfExists && (
          <a
            href={pdfHref}
            download
            className="border-teal-deep text-teal-deep bg-white shadow-soft hover:bg-teal-deep hover:text-off-white hover:shadow-lift focus-visible:ring-chartreuse font-heading inline-flex h-12 items-center justify-center rounded-md border-2 px-6 text-sm font-semibold transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none motion-safe:hover:-translate-y-px"
          >
            {t("downloadCta")} ↓
          </a>
        )}
        <button
          type="button"
          disabled
          className="bg-chartreuse/40 text-teal-deep/70 ring-teal-deep/15 font-heading inline-flex h-12 cursor-not-allowed items-center justify-center rounded-md px-6 text-sm font-semibold ring-1"
          aria-disabled
        >
          {t("postTestCta")}
        </button>
        <p className="text-gray-700 text-xs italic">{t("postTestPendingHint")}</p>
      </div>
    </Container>
  );
}
