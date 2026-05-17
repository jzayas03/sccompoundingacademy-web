import { useTranslations, useMessages } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";

type CourseRow = {
  id: string;
  chapter: string;
  title: string;
  description: string;
  hours: string;
};

/**
 * §02 — Cursos / Programs.
 *
 * The course catalog laid out as a literal table-of-contents, like the
 * opening pages of a syllabus or a textbook. Each program is a single
 * row, not a card. Editorial discipline:
 *
 *   - Sand reading surface continues
 *   - Left gutter holds §02 + section label (same rhythm as §01)
 *   - "Próxima cohorte: Enero 2026" stamp at the top-right of the
 *     header row — concrete urgency without a marketing banner
 *   - Each row: USP chapter pill (chartreuse) · serif title · short
 *     sans description · dotted leader · hours in tabular numerals
 *   - Hover inverts the row to chartreuse-on-teal-deep (subtle reveal
 *     of the program's identity); no layout shift, no transform jank
 *   - Closing link to the future full catalogue page
 */
export function Cursos() {
  const t = useTranslations("cursos");
  const messages = useMessages() as unknown as {
    cursos: { items: CourseRow[] };
  };
  const items = messages.cursos.items;

  return (
    <section
      aria-labelledby="cursos-heading"
      className="bg-sand text-teal-deep border-teal-deep/10 relative isolate border-t"
    >
      <Container className="relative py-16 sm:py-24 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-12">
          {/* Left gutter: §02 / Cursos */}
          <header className="lg:col-span-3">
            <p className="font-heading text-teal-deep/60 text-xs font-medium tracking-[0.25em] uppercase">
              {t("sectionNumber")}
            </p>
            <h2
              id="cursos-heading"
              className="font-heading text-teal-deep mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
            >
              {t("sectionLabel")}
            </h2>
            <p className="font-accent text-teal-deep/85 mt-6 text-lg leading-snug italic">
              {t("intro")}
            </p>
          </header>

          {/* Right column: TOC + cohort stamp + catalog link */}
          <div className="lg:col-span-9">
            {/* Cohort stamp row */}
            <div className="border-teal-deep/20 flex items-baseline justify-between gap-4 border-b pb-4">
              <p className="font-heading text-teal-deep/60 text-xs font-medium tracking-[0.25em] uppercase">
                {t("nextCohort")}
              </p>
              <p className="font-heading text-teal-deep text-sm font-bold tracking-wide uppercase sm:text-base">
                {t("cohortDate")}
              </p>
            </div>

            {/* Course rows */}
            <ul className="divide-teal-deep/15 divide-y">
              {items.map((row) => (
                <li key={row.id} className="group">
                  <div className="hover:bg-teal-deep grid grid-cols-12 gap-3 py-6 transition-colors sm:gap-6 sm:py-8">
                    {/* Title + description + chapter pill */}
                    <div className="col-span-9 sm:col-span-10">
                      <p className="font-heading text-teal-deep/60 group-hover:text-chartreuse/80 text-[0.6875rem] font-semibold tracking-[0.25em] uppercase transition-colors">
                        {row.chapter}
                      </p>
                      <h3 className="font-accent text-teal-deep group-hover:text-chartreuse mt-1 text-2xl leading-snug font-medium italic transition-colors sm:text-3xl">
                        {row.title}
                      </h3>
                      <p className="text-teal-deep/80 group-hover:text-off-white/85 font-heading mt-2 max-w-2xl text-sm leading-snug transition-colors sm:text-base">
                        {row.description}
                      </p>
                    </div>

                    {/* Hours column — right-aligned, tabular numerals */}
                    <div className="col-span-3 flex flex-col items-end justify-start sm:col-span-2">
                      <p className="font-heading text-teal-deep group-hover:text-chartreuse text-3xl font-bold tabular-nums transition-colors sm:text-4xl">
                        {row.hours}
                      </p>
                      <p className="font-heading text-teal-deep/60 group-hover:text-chartreuse/70 mt-1 text-[0.6875rem] font-medium tracking-wide uppercase transition-colors">
                        {t("hoursLabel")}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Catalog link */}
            <div className="border-teal-deep/20 mt-8 border-t pt-8">
              <Link
                href="/cursos"
                className="font-heading text-teal-deep group inline-flex items-center gap-2 text-sm font-semibold tracking-wide uppercase sm:text-base"
              >
                <span className="border-teal-deep group-hover:border-teal border-b-2 pb-1 transition-colors">
                  {t("viewAll")}
                </span>
                <span aria-hidden className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
