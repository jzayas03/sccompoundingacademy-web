import { useMessages, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { getCourseById, getPricingByTier, formatPrice, type Tier } from "@/lib/courses";

type CourseItem = {
  id: string;
  title: string;
  description: string;
  enrollCourseId?: string;
  enrollTier?: Tier;
};

/**
 * CursosHome — homepage two-track course cards.
 *
 * Recreated from the SCCA Design System handoff (Courses section): the
 * Professional track as a teal-deep card and the Student track as a
 * white card, each with a five-point highlight checklist and an Enroll
 * CTA. Distinct from `CursosGrid` (the detailed /cursos catalogue page)
 * — this is the leaner landing presentation only.
 *
 * Enrollment wiring (course id + tier → /inscripcion query) mirrors the
 * catalogue so both buttons reach the correct checkout. Copy comes from
 * `cursosGrid.items[]` plus the handoff's professional/student highlight
 * lists.
 */
export function CursosHome() {
  const t = useTranslations("cursosGrid");
  const messages = useMessages() as unknown as {
    cursosGrid: {
      items: CourseItem[];
      professionalHighlights: string[];
      studentHighlights: string[];
    };
  };
  const { items, professionalHighlights, studentHighlights } = messages.cursosGrid;
  const professional = items.find((c) => c.id === "basic-compounding") ?? items[0];
  const student = items.find((c) => c.id === "student-foundations") ?? items[1];
  if (!professional || !student) return null;

  // Prices are the single source of truth in the catalogue (both tracks
  // share the basic-compounding product; Stripe is authoritative at
  // checkout — this is the display label only).
  const base = getCourseById("basic-compounding");
  const proCents = base ? getPricingByTier(base, "profesional")?.priceUsdCents : undefined;
  const studentCents = base ? getPricingByTier(base, "student")?.priceUsdCents : undefined;

  return (
    <section id="cursos" aria-label={t("heading")} className="bg-off-white">
      <Container className="py-16 sm:py-20 lg:py-24">
        <Reveal className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
          <CourseCard
            tone="dark"
            course={professional}
            highlights={professionalHighlights}
            enrollCta={t("courseCta")}
            enrollAria={t("courseLinkAria")}
            price={proCents !== undefined ? formatPrice(proCents) : null}
            perLabel={t("perParticipant")}
            priceNote={t("priceNoteProfessional")}
          />
          <CourseCard
            tone="light"
            course={student}
            highlights={studentHighlights}
            enrollCta={t("courseCta")}
            enrollAria={t("courseLinkAria")}
            price={studentCents !== undefined ? formatPrice(studentCents) : null}
            perLabel={t("perStudent")}
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
  price,
  perLabel,
  priceNote,
}: {
  tone: "dark" | "light";
  course: CourseItem;
  highlights: string[];
  enrollCta: string;
  enrollAria: string;
  price: string | null;
  perLabel: string;
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
        {price && (
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "font-heading text-3xl font-extrabold tracking-[-0.03em]",
                  dark ? "text-chartreuse" : "text-teal-deep",
                )}
              >
                {price}
              </span>
              <span className={cn("text-xs", dark ? "text-off-white/60" : "text-gray-700")}>
                {perLabel}
              </span>
            </div>
            <p className={cn("mt-1.5 text-[11.5px]", dark ? "text-off-white/55" : "text-gray-700")}>
              {priceNote}
            </p>
          </div>
        )}
        <Link
          href={{
            pathname: "/inscripcion",
            query: {
              course: course.enrollCourseId ?? course.id,
              ...(course.enrollTier ? { tier: course.enrollTier } : {}),
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
