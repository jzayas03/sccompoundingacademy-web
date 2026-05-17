import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

/**
 * CtaFinal — closing call to action.
 *
 * One strong color statement at the bottom of the page (teal-deep band)
 * to anchor the visual rhythm — every other section is white or
 * off-white, so this becomes the page's "punctuation."
 *
 * Centered: h2 in off-white, single-line subcopy, primary chartreuse
 * CTA, and a small "or contact us" secondary link. No urgency banner,
 * no countdown, no badge — just a clear ask.
 */
export function CtaFinal() {
  const t = useTranslations("ctaFinal");
  return (
    <section
      id="reservar"
      aria-labelledby="cta-final-heading"
      className="bg-teal-deep text-off-white"
    >
      <Container className="py-20 sm:py-24 lg:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-heading text-chartreuse text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
            {t("eyebrow")}
          </p>
          <h2
            id="cta-final-heading"
            className="font-heading text-off-white mt-4 text-3xl font-bold leading-[1.15] tracking-[-0.015em] text-balance sm:text-4xl lg:text-5xl"
          >
            {t("headline")}
          </h2>
          <p className="text-off-white/85 mt-5 text-base leading-relaxed sm:text-lg">
            {t("subheadline")}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/contacto"
              className="bg-chartreuse text-teal-deep hover:bg-chartreuse/90 font-heading focus-visible:ring-chartreuse focus-visible:ring-offset-teal-deep inline-flex h-12 items-center justify-center rounded-md px-7 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:h-14 sm:px-8 sm:text-base"
            >
              {t("primaryCta")}
            </Link>
            <p className="text-off-white/80 text-sm sm:text-base">
              {t("secondaryNote")}{" "}
              <Link
                href="/contacto"
                className="text-off-white border-off-white/40 hover:border-chartreuse hover:text-chartreuse border-b font-semibold transition-colors"
              >
                {t("secondaryCta")}
              </Link>
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
