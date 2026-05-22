import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

type Audience = { title: string; body: string; bullets: string[] };

/**
 * Para quién es — audiences card grid.
 *
 * Four sober cards covering the four buyer personas: licensed pharmacists,
 * pharmacy technicians, owners/managers, and students/career-changers.
 *
 * Each card states who the audience is (1 paragraph) and what they
 * concretely get (2 bullets) — no fake personas, no stock-photo
 * portraits, no "imagine if…" copy. Cards are 1×4 on lg, 1×2 on md,
 * 1×1 on mobile.
 */
export function ParaQuienEs() {
  const t = useTranslations("paraQuienEs");
  const messages = useMessages() as unknown as { paraQuienEs: { items: Audience[] } };
  const items = messages.paraQuienEs.items;

  return (
    <section
      aria-labelledby="para-quien-es-heading"
      className="bg-off-white"
    >
      <Container className="py-20 sm:py-24 lg:py-28">
        <Reveal>
          <div className="max-w-3xl">
            <p className="font-heading text-teal-deep/80 flex items-center text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
              <span aria-hidden className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm" />
              {t("eyebrow")}
            </p>
            <h2
              id="para-quien-es-heading"
              className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl lg:text-5xl"
            >
              {t("heading")}
            </h2>
            <p className="text-gray-900 mt-5 text-base leading-relaxed sm:text-lg">
              {t("intro")}
            </p>
          </div>
        </Reveal>

        <Reveal as="ul" className="mt-12 grid grid-cols-1 gap-6 sm:gap-7 md:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {items.map((audience) => (
            <li key={audience.title} className="h-full">
              <article className="border-gray-300 group relative flex h-full flex-col overflow-hidden rounded-lg border bg-white p-6 sm:p-7">
                {/* Brand-accent hover stripe — same vocabulary as CursosGrid */}
                <span
                  aria-hidden
                  className="bg-chartreuse absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
                />
                <h3 className="font-heading text-teal-deep text-lg font-semibold leading-snug sm:text-xl">
                  {audience.title}
                </h3>
                <p className="text-gray-900 mt-3 text-sm leading-relaxed sm:text-base">
                  {audience.body}
                </p>
                <ul className="border-gray-300 mt-5 space-y-2 border-t pt-4">
                  {audience.bullets.map((b) => (
                    <li key={b} className="text-gray-700 flex items-start gap-2 text-sm leading-snug">
                      <span aria-hidden className="text-teal-deep mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-current" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
