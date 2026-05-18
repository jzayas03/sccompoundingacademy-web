import { useTranslations, useMessages } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

type Course = {
  id: string;
  level: string;
  title: string;
  description: string;
  duration: string;
};

/**
 * CursosGrid — programs catalogue as a sober 3-card grid.
 *
 * Each card carries concrete facts: level (Fundamentos / Intermedio /
 * Avanzado), title, 2-line description, duration, and a "Ver curso →"
 * link to the catalogue.
 *
 * Visual restraint:
 *   - White card surface on white section bg, separated by 1px gray-300 border
 *   - No shadow at rest; on hover, border-color darkens to teal-deep/40
 *     and the arrow translates right. No transform/scale tricks.
 *   - Level eyebrow + duration footer carry the "info density" so the
 *     description can stay short.
 */
export function CursosGrid() {
  const t = useTranslations("cursosGrid");
  const messages = useMessages() as unknown as { cursosGrid: { items: Course[] } };
  const items = messages.cursosGrid.items;

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
          {items.map((course) => (
            <li key={course.id} className="h-full">
              <article className="border-gray-300 group relative flex h-full flex-col overflow-hidden rounded-lg border bg-white p-6 sm:p-7">
                {/* Brand-accent hover stripe — chartreuse rule slides in
                    along the top edge to signal interactivity on-brand
                    rather than greying the border. */}
                <span
                  aria-hidden
                  className="bg-chartreuse absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
                />
                <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
                  {course.level}
                </p>
                <h3 className="font-heading text-gray-900 mt-3 text-xl font-semibold leading-snug sm:text-2xl">
                  {course.title}
                </h3>
                <p className="text-gray-700 mt-3 text-sm leading-relaxed sm:text-base">
                  {course.description}
                </p>
                <div className="mt-auto pt-6">
                  <div className="border-gray-300 flex items-center justify-between border-t pt-4">
                    <p className="text-gray-700 font-heading text-xs font-medium tracking-wide uppercase">
                      {t("durationLabel")}{" "}
                      <span className="text-gray-900 font-semibold">{course.duration}</span>
                    </p>
                    {/* Per-card CTA goes directly to the inscription form
                        with the course pre-selected via query param. Single
                        click from catalogue → form → payment. */}
                    <Link
                      href={{ pathname: "/inscripcion", query: { course: course.id } }}
                      className="font-heading text-teal-deep group-hover:text-teal inline-flex items-center gap-1 text-sm font-semibold transition-colors"
                      aria-label={`${t("courseLinkAria")}: ${course.title}`}
                    >
                      <span>{t("courseCta")}</span>
                      <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
