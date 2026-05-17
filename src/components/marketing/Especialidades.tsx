import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

type Specialty = { id: string; label: string; body: string };

/**
 * Especialidades — practice areas covered by the program.
 *
 * Six specialty rows in a two-column grid: label (uppercase eyebrow) +
 * description per row, each separated by a thin gray-300 border-top.
 * Sober and scannable — meant to communicate breadth of practice scope
 * without resorting to icon-card decoration.
 *
 * Surface restyled from sand → white as part of the medical-clean
 * direction; the editorial §-number gutter is dropped.
 */
export function Especialidades() {
  const t = useTranslations("especialidades");
  const messages = useMessages() as unknown as {
    especialidades: { items: Specialty[] };
  };
  const items = messages.especialidades.items;

  return (
    <section
      aria-labelledby="especialidades-heading"
      className="bg-white border-gray-300 border-t"
    >
      <Container className="py-20 sm:py-24 lg:py-28">
        <Reveal>
          <div className="max-w-3xl">
            <p className="font-heading text-teal-deep/70 text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
              {t("eyebrow")}
            </p>
            <h2
              id="especialidades-heading"
              className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl lg:text-5xl"
            >
              {t("heading")}
            </h2>
            <p className="text-gray-900 mt-5 text-base leading-relaxed sm:text-lg">
              {t("intro")}
            </p>
          </div>
        </Reveal>

        <Reveal as="ul" className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 sm:gap-y-10 md:grid-cols-2 lg:mt-14">
          {items.map((it) => (
            <li key={it.id} className="border-gray-300 border-t pt-5">
              <h3 className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
                {it.label}
              </h3>
              <p className="text-gray-900 mt-3 text-base leading-relaxed sm:text-lg">
                {it.body}
              </p>
            </li>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
