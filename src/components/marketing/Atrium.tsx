import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";

/**
 * §00 — Atrium / Cover.
 *
 * The opening surface of the site, designed as a literary chapter opening
 * rather than a SaaS hero:
 *
 *   - Sand background (the reading surface, like paper)
 *   - Small "Edición 01 · 2026" eyebrow in tracking-wide Avant Garde caps
 *   - Two-line opening, line 1 sans (Avant Garde / Montserrat extrabold),
 *     line 2 italic Cormorant — same rhythm as the brand tagline lockup
 *   - Single supporting line with USP chapters and place
 *   - One text-link CTA (no button — the link IS the action)
 *   - No image, no gradient, no decoration. The type IS the design.
 *
 * The composition deliberately mirrors the cover of an academic journal:
 * generous whitespace, small front-matter at top, massive subject in the
 * center, modest navigation cue at the bottom.
 */
export function Atrium() {
  const t = useTranslations("atrium");
  return (
    <section
      aria-labelledby="atrium-heading"
      className="bg-sand text-teal-deep relative isolate"
    >
      <Container className="relative grid min-h-[calc(100vh-4rem)] grid-rows-[auto_1fr_auto] gap-12 py-12 sm:py-16 lg:py-24">
        {/* Front-matter — small editorial eyebrow */}
        <p className="font-heading text-teal-deep/70 text-xs font-medium tracking-[0.2em] uppercase sm:text-sm">
          {t("edition")}
        </p>

        {/* Main composition — opening line + tagline */}
        <h1
          id="atrium-heading"
          className="self-center text-4xl leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-7xl xl:text-8xl"
        >
          <span className="font-heading text-teal-deep block font-extrabold">
            {t("openingLine1")}
          </span>
          <span className="font-accent text-teal-deep mt-1 block font-medium italic sm:mt-2">
            {t("openingLine2")}
          </span>
        </h1>

        {/* Below-the-fold cue: supporting line + single text-link CTA */}
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <p className="text-teal-deep/80 font-heading max-w-md text-sm sm:text-base">
            {t("supportingLine")}
          </p>
          <Link
            href="/cursos"
            className="font-heading text-teal-deep group inline-flex items-center gap-2 text-sm font-semibold tracking-wide uppercase sm:text-base"
          >
            <span className="border-teal-deep group-hover:border-teal border-b-2 pb-1 transition-colors">
              {t("primaryLink")}
            </span>
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
