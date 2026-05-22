import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";
import {
  InscripcionForm,
  type CohortOption,
} from "@/components/marketing/inscripcion/InscripcionForm";
import { listOpenCohorts, formatCohortLabel } from "@/lib/cohorts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "es"
        ? "Inscripción · Santa Cruz Compounding Academy"
        : "Enroll · Santa Cruz Compounding Academy",
    description:
      locale === "es"
        ? "Reserva tu plaza en la próxima cohorte de SCCA. Pago seguro en línea."
        : "Reserve your seat in the next SCCA cohort. Secure online payment.",
    robots: { index: false, follow: true }, // form pages don't need indexing
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ course?: string }>;
}) {
  const { locale } = await params;
  const { course } = await searchParams;
  setRequestLocale(locale);
  const loc = locale as "es" | "en";

  // Cohorts live in the DB so the owner can edit them from the admin
  // panel; format each label here (server-side) in the page locale.
  const openCohorts = await listOpenCohorts();
  const cohorts: CohortOption[] = openCohorts.map((c) => ({
    id: c.id,
    courseId: c.courseId,
    label: formatCohortLabel(c, loc),
  }));

  return (
    <InscripcionPage locale={loc} preselectedCourseSlug={course} cohorts={cohorts} />
  );
}

function InscripcionPage({
  locale,
  preselectedCourseSlug,
  cohorts,
}: {
  locale: "es" | "en";
  preselectedCourseSlug?: string;
  cohorts: CohortOption[];
}) {
  const t = useTranslations("inscripcion");
  // Pull the version stamp of legal docs the user is accepting — same
  // "Last updated" string the doc pages display. Server-rendered here so
  // the version is locked at page-load time, not at submit time.
  const messages = useMessages() as unknown as {
    legal: { terms: { lastUpdated: string } };
  };
  // Strip the "Última actualización: " / "Last updated: " prefix to leave
  // just the date — that's what the audit trail records.
  const docsVersion = messages.legal.terms.lastUpdated.replace(/^[^:]+:\s*/, "").trim();

  return (
    <section className="bg-white">
      <Container className="max-w-2xl py-16 sm:py-20 lg:py-24">
        <p className="font-heading text-teal-deep/80 flex items-center text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
          <span aria-hidden className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm" />
          {t("eyebrow")}
        </p>
        <h1 className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl lg:text-5xl">
          {t("title")}
        </h1>
        <p className="text-gray-900 mt-5 text-base leading-relaxed sm:text-lg">{t("intro")}</p>

        <div className="mt-10">
          <InscripcionForm
            locale={locale}
            preselectedCourseId={preselectedCourseSlug}
            cohorts={cohorts}
            docsVersion={docsVersion}
          />
        </div>
      </Container>
    </section>
  );
}
