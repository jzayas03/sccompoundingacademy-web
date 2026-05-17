import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";

/**
 * §01 — Manifiesto.
 *
 * A single editorial paragraph that explains what SCCA does, treated like
 * the opening of a feature article in a magazine:
 *
 *   - Sand background continues (same reading surface as §00)
 *   - "§01 / Manifiesto" sits in the left gutter, rotated and tracked-wide
 *   - 4-line drop cap on the first letter (display-size Cormorant italic
 *     in chartreuse-ish... actually teal-deep for legibility)
 *   - Body in Cormorant Garamond for that editorial, journal-like read
 *   - A marginal "definition note" floats in the right gutter on lg+,
 *     stacks below on smaller screens — adds the encyclopedia feel
 *
 * The split-paragraph drop cap is rendered by extracting the first
 * character of the translated string at render time. This keeps the
 * messages bundle plain text (no markdown / no HTML to escape) and works
 * across both Spanish ("E" from "En…") and English ("A" from "At…").
 */
export function Manifiesto() {
  const t = useTranslations("manifiesto");
  const paragraph = t("paragraph");
  const dropCap = paragraph.charAt(0);
  const rest = paragraph.slice(1);

  return (
    <section
      aria-labelledby="manifiesto-heading"
      className="bg-sand text-teal-deep relative isolate border-t border-teal-deep/10"
    >
      <Container className="relative py-16 sm:py-24 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-12">
          {/* Left gutter: section number + label, stacked, tight */}
          <header className="lg:col-span-2">
            <p className="font-heading text-teal-deep/60 text-xs font-medium tracking-[0.25em] uppercase">
              {t("sectionNumber")}
            </p>
            <h2
              id="manifiesto-heading"
              className="font-heading text-teal-deep mt-2 text-xl font-bold tracking-tight"
            >
              {t("sectionLabel")}
            </h2>
          </header>

          {/* Center column: drop-cap paragraph, Cormorant body */}
          <div className="lg:col-span-7">
            <p className="font-accent text-teal-deep text-xl leading-[1.55] sm:text-2xl lg:text-[1.625rem]">
              <span
                aria-hidden
                className="font-accent text-teal-deep float-left mt-[0.18em] mr-3 text-[5.5em] leading-[0.85] font-medium italic sm:mr-4"
              >
                {dropCap}
              </span>
              {rest}
            </p>
          </div>

          {/* Right gutter: marginalia — definition note */}
          <aside
            aria-label="Note"
            className="border-teal-deep/30 border-l-2 pl-4 sm:pl-6 lg:col-span-3 lg:border-l lg:pl-5"
          >
            <p className="font-heading text-teal-deep/60 text-[0.6875rem] font-medium tracking-[0.2em] uppercase">
              Nota · Note
            </p>
            <p className="font-accent text-teal-deep mt-2 text-base leading-snug italic sm:text-lg">
              <span className="font-heading text-teal-deep block text-xs font-semibold tracking-wide uppercase not-italic sm:text-sm">
                {t("marginaliaTerm")}
              </span>
              {t("marginaliaDefinition")}
            </p>
          </aside>
        </div>
      </Container>
    </section>
  );
}
