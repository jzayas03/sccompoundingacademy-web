import { useLocale, useTranslations, useMessages } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { getCourseById, getCohortsForCourse, type CourseId } from "@/lib/courses";

type CourseItem = {
  id: string;
  level: string;
  title: string;
  description: string;
  duration: string;
};

/**
 * CursosGrid — programs catalogue as a sober 3-card grid.
 *
 * Each card carries scannable, factual metadata at a glance:
 *   - Level eyebrow · USP chapter alignment (inline, top of card)
 *   - Course title (clean, without USP-suffix duplication)
 *   - 2-line description
 *   - Footer row: duration + next-cohort month + 'Ver curso →' link
 *
 * Cohort dates and USP labels come from `lib/courses.ts` (single source
 * of truth for catalogue data). The i18n strings own the localised
 * display copy (title, description, eyebrow labels) keyed by course id.
 *
 * Visual restraint:
 *   - White card surface on white section bg, separated by 1px gray-300 border
 *   - Chartreuse hover stripe on the top edge for on-brand interactivity
 *   - No extra shadows, no scale tricks — info density carries the weight
 */
export function CursosGrid() {
  const t = useTranslations("cursosGrid");
  const locale = useLocale();
  const messages = useMessages() as unknown as { cursosGrid: { items: CourseItem[] } };
  const items = messages.cursosGrid.items;

  // Format cohort start as "month year" in the user's locale (es-PR or
  // en-US). Returns null for courses without an open cohort — the card
  // omits the cohort row entirely in that case.
  function nextCohortLabel(courseId: string): string | null {
    const course = getCourseById(courseId);
    if (!course) return null;
    const cohort = getCohortsForCourse(course.id as CourseId)[0];
    if (!cohort) return null;
    return new Intl.DateTimeFormat(locale === "es" ? "es-PR" : "en-US", {
      month: "long",
      year: "numeric",
    }).format(new Date(cohort.startDate));
  }

  return (
    <section
      id="cursos"
      aria-labelledby="cursos-heading"
      className="bg-white"
    >
      <Container className="py-20 sm:py-24 lg:py-28">
        <Reveal>
          <div className="max-w-3xl">
            <p className="font-heading text-teal-deep/70 flex items-center text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
              <span aria-hidden className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm" />
              {t("eyebrow")}
            </p>
            <h2
              id="cursos-heading"
              className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl lg:text-5xl"
            >
              {t("heading")}
            </h2>
            <p className="text-gray-900 mt-5 text-base leading-relaxed sm:text-lg">
              {t("intro")}
            </p>
          </div>
        </Reveal>

        <Reveal as="ul" className="mt-12 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {items.map((course) => {
            const courseData = getCourseById(course.id);
            const cohortMonth = nextCohortLabel(course.id);
            return (
              <li key={course.id} className="h-full">
                <article className="border-gray-300 group relative flex h-full flex-col overflow-hidden rounded-lg border bg-white p-6 sm:p-7">
                  {/* Brand-accent hover stripe — chartreuse rule slides in
                      along the top edge to signal interactivity on-brand
                      rather than greying the border. */}
                  <span
                    aria-hidden
                    className="bg-chartreuse absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
                  />
                  {/* Eyebrow row: level + USP chapter as inline metadata so
                      both are scannable above the title without duplicating
                      USP inside it. */}
                  <p className="font-heading text-teal-deep flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold tracking-[0.18em] uppercase">
                    <span>{course.level}</span>
                    {courseData?.uspLabel && (
                      <>
                        <span aria-hidden className="text-teal-deep/40">·</span>
                        <span className="text-teal-deep/80">{courseData.uspLabel}</span>
                      </>
                    )}
                  </p>
                  <h3 className="font-heading text-gray-900 mt-3 text-xl font-semibold leading-snug sm:text-2xl">
                    {course.title}
                  </h3>
                  <p className="text-gray-700 mt-3 text-sm leading-relaxed sm:text-base">
                    {course.description}
                  </p>
                  <div className="mt-auto pt-6">
                    {/* Footer row: duration on the left, next-cohort tag
                        stacked above the CTA on the right. Cohort omitted
                        if no open cohorts exist (the data lives in
                        lib/courses.ts; the form is the source of truth). */}
                    <div className="border-gray-300 border-t pt-4">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-gray-700 font-heading text-xs font-medium tracking-wide uppercase">
                            {t("durationLabel")}{" "}
                            <span className="text-gray-900 font-semibold">{course.duration}</span>
                          </p>
                          {cohortMonth && (
                            <p className="text-gray-700 font-heading mt-1 text-xs font-medium tracking-wide uppercase">
                              {t("nextCohortLabel")}{" "}
                              <span className="text-gray-900 font-semibold capitalize">
                                {cohortMonth}
                              </span>
                            </p>
                          )}
                        </div>
                        {/* Per-card CTA goes directly to the inscription form
                            with the course pre-selected via query param. */}
                        <Link
                          href={{ pathname: "/inscripcion", query: { course: course.id } }}
                          className="font-heading text-teal-deep group-hover:text-teal inline-flex shrink-0 items-center gap-1 text-sm font-semibold transition-colors"
                          aria-label={`${t("courseLinkAria")}: ${course.title}`}
                        >
                          <span>{t("courseCta")}</span>
                          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                            →
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </Reveal>
      </Container>
    </section>
  );
}
