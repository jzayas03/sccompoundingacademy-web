import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

/**
 * §01 — Manifiesto.
 *
 * An editorial single paragraph that explains what SCCA does, laid out
 * like the opening of a feature article in a literary magazine.
 *
 *   - Sand background continues (same reading surface as §00)
 *   - Left gutter holds the "first reading" label, the §-number, and
 *     the section name — stacked, tracked-wide, journal-style
 *   - Body in Cormorant Garamond with a 4-line italic drop cap, rendered
 *     by extracting the first character of the translated paragraph at
 *     render time (works for both ES "E" and EN "A")
 *   - Right gutter holds a marginal "definition note" — the
 *     encyclopedia-style gloss adds editorial gravitas
 *   - Closing ornament centered below the paragraph (chartreuse ❦),
 *     punctuating the end-of-chapter rhythm
 */
export function Manifiesto() {
  const t = useTranslations("manifiesto");
  const paragraph = t("paragraph");
  const dropCap = paragraph.charAt(0);
  const rest = paragraph.slice(1);

  return (
    <section
      id="manifiesto"
      aria-labelledby="manifiesto-heading"
      className="bg-sand text-teal-deep border-teal-deep/10 relative isolate border-t"
    >
      <Container className="relative py-20 sm:py-28 lg:py-40">
        <Reveal className="grid gap-10 lg:grid-cols-12 lg:gap-x-12">
          {/* Left gutter: reading label + section number + label, stacked tight */}
          <header className="lg:col-span-2">
            <p className="font-heading text-chartreuse-foreground/0 text-teal-deep/50 text-[0.6875rem] font-medium tracking-[0.25em] uppercase">
              {t("readingLabel")}
            </p>
            <div className="bg-teal-deep/20 mt-3 h-px w-12" aria-hidden />
            <p className="font-heading text-teal-deep/60 mt-3 text-xs font-medium tracking-[0.25em] uppercase">
              {t("sectionNumber")}
            </p>
            <h2
              id="manifiesto-heading"
              className="font-heading text-teal-deep mt-2 text-xl font-bold tracking-tight"
            >
              {t("sectionLabel")}
            </h2>
          </header>

          {/* Center column: drop-cap paragraph in Cormorant + closing ornament */}
          <div className="lg:col-span-7">
            <p className="text-teal-deep text-base leading-relaxed sm:text-lg lg:text-xl">
              <span
                aria-hidden
                className="font-accent text-teal-deep float-left mt-[0.18em] mr-3 text-[5.5em] leading-[0.85] font-medium italic sm:mr-4"
              >
                {dropCap}
              </span>
              {rest}
            </p>

            {/* Closing ornament — Cormorant flower / fleuron, centered.
                Subtle punctuation that says "end of section." */}
            <div className="mt-12 flex items-center justify-center gap-4" aria-hidden>
              <span className="bg-teal-deep/20 h-px w-16" />
              <span className="font-accent text-chartreuse text-teal-deep text-2xl leading-none">
                ❦
              </span>
              <span className="bg-teal-deep/20 h-px w-16" />
            </div>
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
        </Reveal>
      </Container>
    </section>
  );
}
