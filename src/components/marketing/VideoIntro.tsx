import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

/**
 * VideoIntro — "In his own words" (§7 of the v2 handoff).
 *
 * A dark teal editorial band with a faint SCCA watermark bleeding off the
 * right edge. Left: the instructor's Instagram Reel embedded in a rounded
 * black frame. Right: eyebrow, headline, an italic pull-quote with a
 * chartreuse rule, and a "watch on Instagram" pill (the reliable fallback
 * when the inline embed only renders a card).
 */
const REEL_URL = "https://www.instagram.com/reel/DZaq9noBYmj/";
const REEL_EMBED = "https://www.instagram.com/reel/DZaq9noBYmj/embed/";

export function VideoIntro() {
  const t = useTranslations("videoIntro");
  return (
    <section
      className="text-off-white relative overflow-hidden border-t border-white/10 py-20 sm:py-24 lg:py-28"
      style={{
        background:
          "linear-gradient(150deg, rgb(12,38,38) 0%, var(--color-teal-deep) 45%, rgb(6,22,22) 100%)",
      }}
    >
      {/* Watermark — logo mark bleeding off the right edge (decorative;
          fixed-size, so next/image gives no benefit).
          eslint-disable-next-line @next/next/no-img-element */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/brand/logo-mark.png"
        alt=""
        className="pointer-events-none absolute top-1/2 right-[-90px] hidden h-[640px] w-auto -translate-y-1/2 select-none lg:block"
        style={{ opacity: 0.06, filter: "grayscale(0.2)" }}
      />

      <Container className="relative z-[1]">
        <Reveal className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[400px_1fr] lg:gap-20">
          {/* Reel frame */}
          <div className="mx-auto w-full max-w-[400px]">
            <div
              className="overflow-hidden rounded-[20px] border bg-black"
              style={{
                borderColor: "rgba(230,234,130,0.22)",
                boxShadow: "0 40px 90px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
              }}
            >
              <iframe
                title={t("frameTitle")}
                src={REEL_EMBED}
                className="block h-[600px] w-full border-0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                scrolling="no"
              />
            </div>
          </div>

          {/* Editorial content */}
          <div>
            <p className="text-chartreuse font-heading text-[0.72rem] font-bold tracking-[0.18em] uppercase">
              {t("eyebrow")}
            </p>
            <h2 className="font-heading text-off-white mt-4 text-3xl font-bold tracking-[-0.03em] sm:text-4xl lg:text-5xl">
              {t("heading")}
            </h2>
            <div className="mt-7 mb-8 flex max-w-xl gap-5">
              <span aria-hidden className="bg-chartreuse w-[3px] shrink-0 rounded-sm" />
              <p className="font-heading text-off-white/90 text-lg leading-relaxed font-medium italic">
                &ldquo;{t("quote")}&rdquo;
              </p>
            </div>
            <a
              href={REEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-chartreuse text-teal-deep font-heading inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-[15px] font-bold tracking-[-0.01em]"
            >
              <span aria-hidden className="text-xs">
                ▶
              </span>
              {t("watchCta")}
            </a>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
