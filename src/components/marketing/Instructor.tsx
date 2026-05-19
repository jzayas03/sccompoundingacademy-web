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
 * The bio and credentials live in `messages/{es,en}.json → instructor`.
 * The professional photo is intentionally a tokenised placeholder until
 * the owner provides the asset (issue #TBD) — once the file is dropped
 * into `/public/photos/` and the path is wired into the i18n payload, the
 * placeholder block here is the only change needed in the markup.
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
          {/* Photo placeholder — replace this block with <Image src=... /> when
              the owner-provided portrait is added to /public/photos/. */}
          <div className="md:col-span-1">
            <div className="border-gray-300 bg-sand text-teal-deep/60 flex aspect-[3/4] w-full items-center justify-center rounded-lg border">
              <svg
                aria-hidden
                viewBox="0 0 64 64"
                className="h-16 w-16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="32" cy="24" r="10" />
                <path d="M12 56c2-10 11-16 20-16s18 6 20 16" />
              </svg>
            </div>
            <p className="text-gray-700 mt-3 text-center text-xs italic">
              {t("photoPlaceholderLabel")}
            </p>
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
