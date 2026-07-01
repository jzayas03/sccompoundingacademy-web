import Image from "next/image";
import { useTranslations, useMessages } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";

type Milestone = { year: string; text: string };
type InstructorMessages = { instructor: { timeline: Milestone[] } };

/**
 * Instructor — course director, photo + career timeline.
 *
 * Recreated from the SCCA Design System handoff: a full-height portrait
 * on the left fading into the teal-deep field, and a four-milestone
 * career timeline on the right (year marker + rule + note). Name, title,
 * and the milestone copy come from `messages → instructor`.
 *
 * Portrait: /public/photos/jorge-reyes.jpg (from the handoff bundle),
 * server-loaded via next/image so it stays optimized.
 */
export function Instructor() {
  const t = useTranslations("instructor");
  const messages = useMessages() as unknown as InstructorMessages;
  const timeline = messages.instructor.timeline;

  return (
    <section
      id="instructor"
      aria-labelledby="instructor-heading"
      className="bg-teal-deep relative overflow-hidden"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 md:grid-cols-2 md:items-stretch">
        {/* Portrait — fades into the teal field on md+ */}
        <div className="relative min-h-[22rem] md:min-h-[36rem]">
          <div className="bg-sand absolute inset-0">
            <Image
              src="/photos/jorge-reyes.jpg"
              alt={t("photoAlt")}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover object-top md:object-contain md:object-[center_top]"
              priority={false}
            />
          </div>
          <div
            aria-hidden
            className="absolute inset-0 hidden md:block"
            style={{
              background:
                "linear-gradient(to right, transparent 60%, var(--color-teal-deep) 100%)",
            }}
          />
        </div>

        {/* Content */}
        <Reveal className="text-off-white flex flex-col justify-center gap-9 px-6 py-14 sm:px-10 lg:py-20 lg:pr-16 lg:pl-12">
          <div>
            <h2
              id="instructor-heading"
              className="font-heading text-off-white text-3xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-4xl"
            >
              {t("heading")}
            </h2>
            <p className="text-off-white/60 mt-2 text-sm tracking-wide">{t("title")}</p>
          </div>

          <ol aria-label={t("timelineLabel")} className="flex flex-col gap-7">
            {timeline.map((m) => (
              <li key={m.year} className="grid grid-cols-[3.25rem_1fr] items-start gap-5">
                <span className="font-heading text-chartreuse text-base font-extrabold leading-relaxed">
                  {m.year}
                </span>
                <div>
                  <span aria-hidden className="bg-chartreuse/35 mb-2.5 block h-px w-6" />
                  <p className="text-off-white/80 text-sm leading-relaxed">{m.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
