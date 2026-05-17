import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";

/**
 * §00 — Atrium / Cover.
 *
 * The opening surface of the site, composed like the cover of an
 * academic journal:
 *
 *   - Sand reading surface
 *   - Thin chartreuse hairline rule across the top
 *   - Front-matter row: edition number (left) + dateline (right) — both
 *     small tracking-wide Avant Garde caps
 *   - Two-line tagline as the literary headline (sans bold + italic
 *     Cormorant), self-centered in the available vertical space
 *   - Supporting line + primary text-link CTA + small scroll cue stacked
 *     below the fold
 *   - A small chartreuse shield "seal" in the lower-right corner,
 *     anchoring the otherwise type-only composition (like an old
 *     apothecary jar stamp)
 *
 * Anti-AI-slop: no gradient, no decorative shapes, no stock photo.
 * Type and one brand mark.
 */
export function Atrium() {
  const t = useTranslations("atrium");
  return (
    <section
      aria-labelledby="atrium-heading"
      className="bg-sand text-teal-deep relative isolate overflow-hidden"
    >
      {/* Hairline rule at the very top of the cover */}
      <div aria-hidden className="bg-chartreuse/60 absolute inset-x-0 top-0 h-px" />

      {/* Lower-right "apothecary seal" — small chartreuse shield mark
          rendered BEFORE the Container so Container content sits on top
          (no overlap with scroll-cue text). Hidden on mobile (would crowd
          the bottom row), tucked into the corner at sm+. */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-6 bottom-6 hidden h-16 w-16 sm:right-8 sm:bottom-8 sm:block sm:h-20 sm:w-20"
      >
        <Image
          src="/brand/logo-mark.png"
          alt=""
          width={1887}
          height={1878}
          className="rotate-3 object-contain opacity-80"
        />
      </div>

      <Container className="relative grid min-h-[calc(100vh-5rem)] grid-rows-[auto_1fr_auto] gap-12 py-12 sm:py-16 lg:py-24">
        {/* Front-matter row: edition + dateline, split across the line */}
        <div className="flex items-center justify-between gap-4">
          <p className="font-heading text-teal-deep/70 text-xs font-medium tracking-[0.2em] uppercase sm:text-sm">
            {t("edition")}
          </p>
          <p className="font-heading text-teal-deep/70 text-right text-xs font-medium tracking-[0.2em] uppercase sm:text-sm">
            {t("dateline")}
          </p>
        </div>

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

        {/* Below-the-fold cue row */}
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <p className="text-teal-deep/80 font-heading max-w-md text-sm sm:text-base">
            {t("supportingLine")}
          </p>
          <div className="flex flex-col items-start gap-4 sm:items-end">
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
            <a
              href="#manifiesto"
              className="font-heading text-teal-deep/60 hover:text-teal-deep inline-flex items-center gap-1.5 text-xs tracking-wide uppercase transition-colors"
            >
              <span aria-hidden>↓</span>
              {t("scrollCue")}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
