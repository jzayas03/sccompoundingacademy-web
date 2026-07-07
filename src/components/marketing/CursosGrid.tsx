import { useLocale, useTranslations, useMessages } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { getCourseById, type Tier } from "@/lib/courses";
import { AUDIENCE_LABELS, type CohortAudience } from "@/lib/cohorts/audience";

/** One open cohort, trimmed to what the grid footer needs. The server
 * page fetches these from the DB (`lib/cohorts.ts`) and passes them in. */
export type CohortBrief = {
  courseId: string;
  /** ISO date (yyyy-mm-dd) of the cohort's first day. */
  startDate: string;
  audience: CohortAudience;
};

type ModuleItem = {
  id: string;
  day: string;
  title: string;
  summary: string;
};

type CourseItem = {
  id: string;
  level: string;
  title: string;
  description: string;
  duration: string;
  modules: ModuleItem[];
  uspLabel?: string;
  includesItems?: string[];
  credentialNote?: string;
  enrollCourseId?: string;
  enrollTier?: Tier;
  courseRef?: string;
  enrollProf?: string;
  noCe?: boolean;
  audience: CohortAudience;
};

/**
 * CursosGrid — single-course detail section.
 *
 * The catalogue collapsed from three programs to a single 18-hour course
 * organised in three on-site modules (one per day). The component still
 * lives inside a `<ul>` so the markup stays semantically tidy and so the
 * card-driven layout is preserved if the catalogue ever grows again.
 *
 * Each course renders:
 *   - Eyebrow with level · USP chapter alignment
 *   - Title + 2-line description
 *   - Modules list (day badge + title + summary)
 *   - Footer with duration + next cohort + Enroll CTA
 *
 * Cohort dates and USP labels come from `lib/courses.ts` (catalogue
 * truth). i18n owns the localised copy keyed by course id.
 */
export function CursosGrid({ openCohorts }: { openCohorts: CohortBrief[] }) {
  const t = useTranslations("cursosGrid");
  const locale = useLocale();
  const messages = useMessages() as unknown as {
    cursosGrid: { items: CourseItem[]; includesItems: string[] };
  };
  const items = messages.cursosGrid.items;
  const includesItems = messages.cursosGrid.includesItems;

  function nextCohortLabel(courseId: string, audience: CohortAudience): string | null {
    // `openCohorts` arrives ordered earliest-first, so the first match is the
    // upcoming cohort for this course + audience.
    const cohort = openCohorts.find(
      (c) => c.courseId === courseId && c.audience === audience,
    );
    if (!cohort) return null;
    return new Intl.DateTimeFormat(locale === "es" ? "es-PR" : "en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
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
            <p className="font-heading text-teal-deep/80 flex items-center text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
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

        <Reveal as="ul" className="mt-12 grid grid-cols-1 gap-6 sm:gap-8 lg:mt-16">
          {items.map((course) => {
            const courseData = getCourseById(course.courseRef ?? course.id);
            const cohortMonth = nextCohortLabel(
              course.enrollCourseId ?? course.courseRef ?? course.id,
              course.audience,
            );
            const uspLabel = courseData?.uspLabel ?? course.uspLabel;
            const cardIncludes = course.includesItems ?? includesItems;
            return (
              <li key={course.id} className="h-full">
                <article className="border-gray-300 group relative flex h-full flex-col overflow-hidden rounded-lg border bg-white p-6 sm:p-8 lg:p-10">
                  <span
                    aria-hidden
                    className="bg-chartreuse absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
                  />
                  <p className="font-heading text-teal-deep flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold tracking-[0.18em] uppercase">
                    <span>{course.level}</span>
                    {uspLabel && (
                      <>
                        <span aria-hidden className="text-teal-deep/40">·</span>
                        <span className="text-teal-deep/80">{uspLabel}</span>
                      </>
                    )}
                  </p>
                  <h3 className="font-heading text-gray-900 mt-3 text-2xl font-semibold leading-snug sm:text-3xl">
                    {course.title}
                  </h3>
                  <p className="text-gray-700 mt-3 text-sm leading-relaxed sm:text-base">
                    {course.description}
                  </p>

                  {course.modules?.length > 0 && (
                    <div className="mt-8">
                      <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
                        {t("modulesLabel")}
                      </p>
                      <ol
                        className={`mt-4 grid gap-4 ${
                          course.modules.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
                        }`}
                      >
                        {course.modules.map((mod) => (
                          <li
                            key={mod.id}
                            className="border-gray-300 flex h-full flex-col rounded-md border bg-white p-4 sm:p-5"
                          >
                            <p className="font-heading text-teal-deep/80 text-xs font-semibold tracking-wide uppercase">
                              {mod.day}
                            </p>
                            <p className="font-heading text-gray-900 mt-2 text-base font-semibold leading-snug">
                              {mod.title}
                            </p>
                            <p className="text-gray-700 mt-2 text-sm leading-relaxed">
                              {mod.summary}
                            </p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Inclusiones — chartreuse-check selling points just
                      above the price/CE block. Two-column on sm+ to keep
                      the card height contained. */}
                  {cardIncludes?.length > 0 && (
                    <div className="border-gray-300 mt-8 border-t pt-6">
                      <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
                        {t("includesLabel")}
                      </p>
                      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {cardIncludes.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm">
                            <svg
                              aria-hidden
                              viewBox="0 0 20 20"
                              fill="none"
                              className="text-teal-deep mt-0.5 h-4 w-4 shrink-0"
                            >
                              <path
                                d="M4 10.5l3.5 3.5L16 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span className="text-gray-900">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {courseData?.acpe && !course.noCe && (
                    <div className="border-gray-300 mt-6 border-t pt-6">
                      <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
                        {t("ceLabel")}
                      </p>
                      <p className="text-gray-900 mt-3 text-sm leading-relaxed">
                        {t("ceBody", {
                          contactHours: courseData.acpe.contactHours,
                          ceus: courseData.acpe.ceus,
                          providerNumber: courseData.acpe.providerNumber,
                          provider: courseData.acpe.provider,
                        })}
                      </p>
                    </div>
                  )}

                  {(course.noCe || !courseData?.acpe) && course.credentialNote && (
                    <div className="border-gray-300 mt-6 border-t pt-6">
                      <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
                        {t("credentialLabel")}
                      </p>
                      <p className="text-gray-900 mt-3 text-sm leading-relaxed">
                        {course.credentialNote}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto pt-8">
                    <div className="border-gray-300 border-t pt-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
                              {" · "}
                              {t("cohortAudience", {
                                label: AUDIENCE_LABELS[course.audience][locale === "es" ? "es" : "en"],
                              })}
                            </p>
                          )}
                        </div>
                        <Link
                          href={{
                            pathname: "/inscripcion",
                            query: {
                              course: course.enrollCourseId ?? course.id,
                              ...(course.enrollTier ? { tier: course.enrollTier } : {}),
                              ...(course.enrollProf ? { prof: course.enrollProf } : {}),
                            },
                          }}
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
