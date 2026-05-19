import Image from "next/image";
import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

type InstructorMessages = {
  instructor: {
    credentials: string[];
  };
};

/**
 * Instructor — single-column section introducing the course director.
 *
 * Bio + credentials live in `messages/{es,en}.json → instructor`.
 * Portrait is at `public/instructor/jorge-reyes.jpg` (owner-provided,
 * 2026-05-19). The photo is server-loaded via next/image so the LCP
 * candidate stays optimized (Vercel serves AVIF/WebP automatically).
 */
export function Instructor() {
  const t = useTranslations("instructor");
  const messages = useMessages() as unknown as InstructorMessages;
  const credentials = messages.instructor.credentials;

  return (
    <section id="instructor" aria-labelledby="instructor-heading" className="bg-off-white">
      <Container className="py-20 sm:py-24 lg:py-28">
        <Reveal>
          <div className="max-w-3xl">
            <p className="font-heading text-teal-deep/70 flex items-center text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
              <span aria-hidden className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm" />
              {t("eyebrow")}
            </p>
            <h2
              id="instructor-heading"
              className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl lg:text-5xl"
            >
              {t("heading")}
            </h2>
            <p className="font-heading text-teal-deep/80 mt-2 text-sm font-semibold tracking-wide uppercase">
              {t("title")}
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          <div className="md:col-span-1">
            <div className="border-gray-300 relative aspect-[3/4] w-full overflow-hidden rounded-lg border bg-sand">
              <Image
                src="/instructor/jorge-reyes.jpg"
                alt={t("photoAlt")}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover"
                priority={false}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <p className="text-gray-900 text-base leading-relaxed sm:text-lg">{t("bio")}</p>

            <div className="mt-8">
              <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
                {t("credentialsLabel")}
              </p>
              <ul className="mt-4 space-y-2">
                {credentials.map((credential) => (
                  <li key={credential} className="flex items-start gap-3 text-base text-gray-900">
                    <span
                      aria-hidden
                      className="bg-chartreuse mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    />
                    <span>{credential}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
