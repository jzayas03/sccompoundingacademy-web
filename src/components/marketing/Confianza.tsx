import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

type Item = { label: string; body: string };

/**
 * Confianza — credentials / trust band.
 *
 * Three concrete statements that establish authority by reference,
 * not by decoration: affiliated pharmacy with 15+ years of practice,
 * supervised laboratory access, USP-aligned curriculum.
 *
 * Clean medical-pharma direction: off-white surface, no icons (avoiding
 * the generic-card look), three columns of label + body with a thin
 * gray-300 border-top per column for structure.
 */
export function Confianza() {
  const t = useTranslations("confianza");
  const messages = useMessages() as unknown as { confianza: { items: Item[] } };
  const items = messages.confianza.items;

  return (
    <section
      aria-labelledby="confianza-heading"
      className="bg-off-white border-gray-300 border-y"
    >
      <Container className="py-16 sm:py-20 lg:py-24">
        <Reveal>
          <h2 id="confianza-heading" className="sr-only">
            {t("srHeading")}
          </h2>
          <ul className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-3">
            {items.map((item) => (
              <li key={item.label} className="border-teal-deep border-t-2 pt-6">
                <h3 className="font-heading text-teal-deep text-base font-semibold tracking-wide sm:text-lg">
                  {item.label}
                </h3>
                <p className="text-gray-900 mt-3 text-sm leading-relaxed sm:text-base">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
