import Image from "next/image";
import { useTranslations, useMessages } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";

type Row = { label: string; text: string };
type InstructorMessages = { instructor: { rows: Row[] } };

/**
 * Instructor — course director, portrait + role facets (v2 handoff §6).
 *
 * A full-height portrait on the left fading into the teal-deep field, and
 * on the right the name + credential line + role, followed by four
 * labeled facets (Founder / Educator / Specialist / Honored), each a
 * chartreuse label + short rule + note. Copy from `messages → instructor`.
 *
 * Portrait: /public/photos/jorge-reyes.jpg (handoff bundle), server-loaded
 * via next/image so it stays optimized.
 */
export function Instructor() {
  const t = useTranslations("instructor");
  const messages = useMessages() as unknown as InstructorMessages;
  const rows = messages.instructor.rows;

  return (
    <section
      id="instructor"
      aria-labelledby="instructor-heading"
      className="bg-teal-deep relative overflow-hidden"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 md:grid-cols-2 md:items-stretch">
        {/* Portrait — fades into the teal field on md+ */}
        <div className="relative min-h-[22rem] md:min-h-[36rem]">
          <div className="bg-teal-deep absolute inset-0">
            <Image
              src="/photos/jorge-reyes.jpg"
              alt={t("photoAlt")}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover object-top"
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
              {t("name")}
            </h2>
            <p className="text-chartreuse mt-2 text-sm font-semibold tracking-wide">{t("credLine")}</p>
            <p className="text-off-white/55 mt-1 text-[13px] tracking-wide">{t("roleLine")}</p>
          </div>

          <div className="flex flex-col gap-6">
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[110px_1fr] items-start gap-5">
                <span className="text-chartreuse font-heading pt-0.5 text-[0.7rem] font-bold tracking-[0.12em] uppercase">
                  {row.label}
                </span>
                <div>
                  <span aria-hidden className="bg-chartreuse/35 mb-2.5 block h-px w-6" />
                  <p className="text-off-white/80 text-sm leading-relaxed">{row.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
