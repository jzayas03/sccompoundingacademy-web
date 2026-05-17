import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";

type QA = { q: string; a: string };

/**
 * §05 — Preguntas / Questions.
 *
 * Editorial Q&A — replaces the previous FAQ accordion with an
 * always-visible journal-style layout. No expand/collapse: in a
 * literary publication, all the answers are on the page.
 *
 *   - Sand reading surface continues
 *   - Same left-gutter §-number rhythm
 *   - Right column: numbered Q01–Q06 items
 *   - Q in tracking-wide uppercase sans (bold)
 *   - A in italic Cormorant, indented and slightly muted
 *   - Hairline rule between each pair
 *
 * Reuses the existing faq.items[] message array — the editorial layout
 * is purely a presentation change; the underlying questions stay the
 * same.
 */
export function Preguntas() {
  const t = useTranslations("preguntas");
  const messages = useMessages() as unknown as {
    faq: { items: QA[] };
  };
  const items = messages.faq.items;

  return (
    <section
      id="preguntas"
      aria-labelledby="preguntas-heading"
      className="bg-sand text-teal-deep border-teal-deep/10 relative isolate border-t"
    >
      <Container className="relative py-16 sm:py-24 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-12">
          {/* Header — section number + label + italic intro */}
          <header className="lg:col-span-3">
            <p className="font-heading text-teal-deep/60 text-xs font-medium tracking-[0.25em] uppercase">
              {t("sectionNumber")}
            </p>
            <h2
              id="preguntas-heading"
              className="font-heading text-teal-deep mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
            >
              {t("sectionLabel")}
            </h2>
            <p className="font-accent text-teal-deep/85 mt-6 text-lg leading-snug italic">
              {t("intro")}
            </p>
          </header>

          {/* Right column: numbered Q&A list */}
          <ol className="divide-teal-deep/15 divide-y lg:col-span-9">
            {items.map((qa, idx) => {
              const num = String(idx + 1).padStart(2, "0");
              return (
                <li key={qa.q} className="py-8 first:pt-0 sm:py-10">
                  <article className="grid grid-cols-12 gap-4 sm:gap-6">
                    {/* Numeral in the inner gutter */}
                    <p
                      aria-hidden
                      className="font-accent text-teal-deep/40 col-span-2 text-3xl leading-none font-medium italic tabular-nums sm:col-span-1 sm:text-4xl"
                    >
                      Q{num}
                    </p>

                    {/* Q + A stack */}
                    <div className="col-span-10 sm:col-span-11">
                      <p className="font-heading text-teal-deep text-sm font-bold tracking-[0.15em] uppercase sm:text-base">
                        {qa.q}
                      </p>
                      <p className="font-accent text-teal-deep/85 mt-3 text-lg leading-snug italic sm:text-xl">
                        {qa.a}
                      </p>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </section>
  );
}
