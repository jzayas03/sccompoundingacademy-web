import { useMessages, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { type Tier } from "@/lib/courses";

type CourseItem = {
  id: string;
  title: string;
  description: string;
  enrollCourseId?: string;
  enrollTier?: Tier;
  enrollProf?: string;
};

/**
 * CursosHome — homepage three-track course cards.
 *
 * Recreated from the SCCA Design System handoff (Courses section): the
 * Professional track (Farmacéuticos y Técnicos) as a teal-deep card, the
 * Otros Profesionales track, and the Student track — the latter two as
 * white cards — each with a highlight checklist and an Enroll CTA.
 * Distinct from `CursosGrid` (the detailed /cursos catalogue page) — this
 * is the leaner landing presentation only.
 *
 * Enrollment wiring (course id + tier → /inscripcion query) mirrors the
 * catalogue so all three buttons reach the correct checkout. Copy comes
 * from `cursosGrid.items[]` plus the handoff's professional/otros
 * profesionales/student highlight lists.
 */
export function CursosHome() {
  const t = useTranslations("cursosGrid");
  const messages = useMessages() as unknown as {
    cursosGrid: {
      items: CourseItem[];
      professionalHighlights: string[];
      studentHighlights: string[];
      otrosProfesionalesHighlights: string[];
    };
  };
  const { items, professionalHighlights, studentHighlights, otrosProfesionalesHighlights } =
    messages.cursosGrid;
  const professional = items.find((c) => c.id === "basic-compounding") ?? items[0];
  const student = items.find((c) => c.id === "student-foundations") ?? items[1];
  const otros = items.find((c) => c.id === "otros-profesionales");
  if (!professional || !student) return null;

  return (
    <section id="cursos" aria-label={t("heading")} className="bg-off-white">
      <Container className="py-16 sm:py-20 lg:py-24">
        <Reveal className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch">
          <CourseCard
            tone="dark"
            course={professional}
            highlights={professionalHighlights}
            enrollCta={t("courseCta")}
            enrollAria={t("courseLinkAria")}
            priceNote={t("priceNoteProfessional")}
          />
          {otros && (
            <CourseCard
              tone="light"
              course={otros}
              highlights={otrosProfesionalesHighlights}
              enrollCta={t("courseCta")}
              enrollAria={t("courseLinkAria")}
              priceNote={t("priceNoteStudent")}
            />
          )}
          <CourseCard
            tone="light"
            course={student}
            highlights={studentHighlights}
            enrollCta={t("courseCta")}
            enrollAria={t("courseLinkAria")}
            priceNote={t("priceNoteStudent")}
          />
        </Reveal>
      </Container>
    </section>
  );
}

function CourseCard({
  tone,
  course,
  highlights,
  enrollCta,
  enrollAria,
  priceNote,
}: {
  tone: "dark" | "light";
  course: CourseItem;
  highlights: string[];
  enrollCta: string;
  enrollAria: string;
  priceNote: string;
}) {
  const dark = tone === "dark";
  return (
    <article
      className={cn(
        "flex h-full flex-col gap-5 rounded-[13px] p-8 sm:p-9",
        dark ? "bg-teal-deep" : "border-gray-300 border bg-white",
      )}
    >
      <div>
        <h3
          className={cn(
            "font-heading text-xl font-bold leading-snug tracking-[-0.02em] sm:text-2xl",
            dark ? "text-off-white" : "text-teal-deep",
          )}
        >
          {course.title}
        </h3>
        <p className={cn("mt-3 text-sm leading-relaxed", dark ? "text-off-white/75" : "text-gray-700")}>
          {course.description}
        </p>
      </div>

      <ul className="flex flex-col gap-2.5">
        {highlights.map((item) => (
          <li
            key={item}
            className={cn(
              "flex items-start gap-2.5 text-sm",
              dark ? "text-off-white/80" : "text-gray-900",
            )}
          >
            <svg
              aria-hidden
              viewBox="0 0 16 16"
              fill="none"
              className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", dark ? "text-chartreuse" : "text-teal")}
            >
              <path
                d="M3 8.5l3 3L13 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div
        className={cn(
          "mt-auto flex flex-wrap items-end justify-between gap-4 border-t pt-5",
          dark ? "border-white/10" : "border-gray-300",
        )}
      >
        <p className={cn("text-[11.5px]", dark ? "text-off-white/55" : "text-gray-700")}>
          {priceNote}
        </p>
        <Link
          href={{
            pathname: "/inscripcion",
            query: {
              course: course.enrollCourseId ?? course.id,
              ...(course.enrollTier ? { tier: course.enrollTier } : {}),
              ...(course.enrollProf ? { prof: course.enrollProf } : {}),
            },
          }}
          aria-label={`${enrollAria}: ${course.title}`}
        >
          <Button variant={dark ? "primary" : "secondary"} size="md">
            {enrollCta}
          </Button>
        </Link>
      </div>
    </article>
  );
}
