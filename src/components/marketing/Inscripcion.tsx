import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";

/**
 * §06 — Inscripción / Registration.
 *
 * The closing call-to-action of the editorial page — treated like a
 * letterpress invitation card, not a SaaS conversion banner. Two
 * confident moves only:
 *
 *   1. A primary text-link "Inscribirme →" pointing at /contacto
 *      (the existing contact form takes the registration intent)
 *   2. A small "questions?" secondary link for hesitant readers
 *
 * No buttons (the link IS the action), no urgency banner, no
 * dramatic shouting. A small "Cohorte inaugural · Enero 2026" stamp
 * at the top establishes the cohort timing concretely.
 */
export function Inscripcion() {
  const t = useTranslations("inscripcion");
  return (
    <section
      id="inscripcion"
      aria-labelledby="inscripcion-heading"
      className="bg-sand text-teal-deep border-teal-deep/10 relative isolate border-t"
    >
      <Container className="relative py-20 sm:py-28 lg:py-36">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-12">
          {/* Left gutter: §06 / Inscripción */}
          <header className="lg:col-span-3">
            <p className="font-heading text-teal-deep/60 text-xs font-medium tracking-[0.25em] uppercase">
              {t("sectionNumber")}
            </p>
            <h2
              id="inscripcion-heading"
              className="font-heading text-teal-deep mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
            >
              {t("sectionLabel")}
            </h2>
          </header>

          {/* Right column: cohort stamp · headline · CTA stack */}
          <div className="lg:col-span-9">
            {/* Cohort stamp row */}
            <div className="border-teal-deep/20 flex items-baseline justify-between gap-4 border-b pb-4">
              <p className="font-heading text-teal-deep/60 text-xs font-medium tracking-[0.25em] uppercase">
                {t("cohortLabel")}
              </p>
              <p className="font-heading text-teal-deep text-sm font-bold tracking-wide uppercase sm:text-base">
                {t("cohortDate")}
              </p>
            </div>

            {/* Headline — letterpress invitation */}
            <h3 className="font-accent text-teal-deep mt-12 max-w-3xl text-4xl leading-tight italic sm:mt-16 sm:text-5xl lg:text-6xl">
              {t("headline")}
            </h3>
            <p className="text-teal-deep/80 font-heading mt-6 max-w-xl text-base sm:text-lg">
              {t("subheadline")}
            </p>

            {/* CTA stack — primary text-link + secondary "questions?" line */}
            <div className="mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:gap-12">
              <Link
                href="/contacto"
                className="font-heading text-teal-deep group inline-flex items-center gap-2 text-base font-semibold tracking-wide uppercase sm:text-lg"
              >
                <span className="border-teal-deep group-hover:border-teal border-b-2 pb-1 transition-colors">
                  {t("primaryCta")}
                </span>
                <span aria-hidden className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <p className="text-teal-deep/70 font-heading text-sm">
                {t("secondaryNote")}{" "}
                <Link
                  href="/contacto"
                  className="text-teal-deep hover:text-teal border-teal-deep/40 hover:border-teal border-b font-semibold transition-colors"
                >
                  {t("secondaryCta")}
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
