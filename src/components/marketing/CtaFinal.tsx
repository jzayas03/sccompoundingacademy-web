import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "./_shared/Eyebrow";

/**
 * CtaFinal — closing call to action over a photographic field.
 *
 * Recreated from the SCCA Design System handoff: a pharmacy photograph
 * under a solid teal wash, a centered eyebrow + headline, and two CTAs
 * (Enroll → /inscripcion, Contact → /contacto). Anchors the bottom of
 * the page. The photo is a decorative background; the heading carries
 * the accessible name.
 */
export function CtaFinal() {
  const t = useTranslations("ctaFinal");
  return (
    <section
      id="reservar"
      aria-labelledby="cta-final-heading"
      className="text-off-white relative isolate overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/photos/photo-pills-counter.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div aria-hidden className="absolute inset-0" style={{ background: "rgba(25,85,97,0.72)" }} />
      <Container className="relative z-[1] py-20 sm:py-24 lg:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow className="justify-center [&_.eyebrow-bar]:bg-chartreuse text-chartreuse/80">
            {t("eyebrow")}
          </Eyebrow>
          <h2
            id="cta-final-heading"
            className="font-heading text-off-white mt-4 text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-balance sm:text-4xl lg:text-5xl"
          >
            {t("headline")}
          </h2>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/inscripcion"
              className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-lift hover:bg-chartreuse/95 focus-visible:ring-chartreuse font-heading inline-flex h-14 items-center justify-center rounded-[13px] px-8 text-base font-semibold ring-1 transition-[background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-deep focus-visible:outline-none motion-safe:hover:-translate-y-px"
            >
              {t("primaryCta")}
            </Link>
            <Link
              href="/contacto"
              className="bg-off-white text-teal-deep shadow-soft hover:bg-white focus-visible:ring-off-white font-heading inline-flex h-14 items-center justify-center rounded-[13px] px-8 text-base font-semibold transition-[background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-deep focus-visible:outline-none motion-safe:hover:-translate-y-px"
            >
              {t("secondaryCta")}
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
