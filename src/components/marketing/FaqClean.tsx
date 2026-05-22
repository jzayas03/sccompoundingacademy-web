import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Accordion } from "@/components/ui/Accordion";

type QA = { q: string; a: string };

/**
 * FaqClean — accordion FAQ.
 *
 * Replaces the editorial always-visible Q&A with a tighter accordion
 * pattern that scans better for working pharmacists comparing programs.
 * Reuses the existing `Accordion` UI primitive (with its keyboard-a11y
 * tests in `tests/components/Accordion.test.tsx`).
 *
 * Two-column shell: heading + intro on the left (≈4/12), accordion on
 * the right (≈8/12). Source of items is `faq.items[]` — same i18n shape
 * the project has used since the original FAQ, so we don't duplicate
 * keys.
 */
export function FaqClean() {
  const t = useTranslations("faqClean");
  const messages = useMessages() as unknown as { faq: { items: QA[] } };
  const items = messages.faq.items;

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="bg-white border-gray-300 border-t"
    >
      <Container className="grid grid-cols-1 gap-12 py-20 sm:py-24 lg:grid-cols-12 lg:gap-x-12 lg:py-28">
        <Reveal className="lg:col-span-4">
          <p className="font-heading text-teal-deep/80 flex items-center text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
            <span aria-hidden className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm" />
            {t("eyebrow")}
          </p>
          <h2
            id="faq-heading"
            className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl lg:text-5xl"
          >
            {t("heading")}
          </h2>
          <p className="text-gray-900 mt-5 max-w-md text-base leading-relaxed sm:text-lg">
            {t("intro")}
          </p>
        </Reveal>

        <Reveal className="lg:col-span-8">
          <Accordion items={items} />
        </Reveal>
      </Container>
    </section>
  );
}
