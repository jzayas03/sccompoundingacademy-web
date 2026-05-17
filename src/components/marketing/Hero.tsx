import Image from "next/image";
import { useTranslations, useMessages } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";

/**
 * Hero — top of the landing page.
 *
 * Clean medical-pharma direction: white surface, no decoration,
 * left-aligned 2-line eyebrow + display heading + 2-line subcopy +
 * two CTAs (primary chartreuse + secondary outline-teal) + trust
 * signals row.
 *
 * Asymmetric on lg: ~7/12 text column, ~5/12 photograph (frontispiece
 * photo from the gallery — bench composition, treated as proof not
 * decoration). Mobile stacks vertical, photo last so the message + CTAs
 * stay above the fold.
 *
 * Not wrapped in <Reveal> — it's above the fold, no scroll needed.
 */
export function Hero() {
  const t = useTranslations("hero");
  const messages = useMessages() as unknown as { hero: { trustItems: string[] } };
  const trustItems = messages.hero.trustItems;

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="bg-white relative isolate"
    >
      <Container className="grid grid-cols-1 gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-x-12 lg:py-28">
        {/* Text column */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <p className="font-heading text-teal-deep/70 flex items-center text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
            <span aria-hidden className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm" />
            {t("eyebrow")}
          </p>
          <h1
            id="hero-heading"
            className="font-heading text-teal-deep mt-5 text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-balance sm:text-5xl lg:text-6xl xl:text-[3.75rem]"
          >
            {t("headline")}
          </h1>
          <p className="text-gray-900 mt-6 max-w-2xl text-base leading-relaxed sm:text-lg">
            {t("subheadline")}
          </p>

          {/* CTA row — primary chartreuse + secondary outline-teal.
              Both rendered as link-styled buttons (Link → button-class span)
              so they keep button affordance + correct routing. */}
          <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              href="/cursos"
              className="bg-chartreuse text-teal-deep hover:bg-chartreuse/90 font-heading focus-visible:ring-chartreuse focus-visible:ring-offset-white inline-flex h-12 items-center justify-center rounded-md px-6 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:h-14 sm:px-7 sm:text-base"
            >
              {t("primaryCta")}
            </Link>
            <Link
              href="/contacto"
              className="border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-off-white font-heading focus-visible:ring-chartreuse focus-visible:ring-offset-white inline-flex h-12 items-center justify-center rounded-md border-2 px-6 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:h-14 sm:px-7 sm:text-base"
            >
              {t("secondaryCta")}
            </Link>
          </div>

          {/* Trust signals row — small inline items with check marks.
              Wraps onto multiple rows on mobile; single row on desktop. */}
          <ul className="border-gray-300 mt-10 grid grid-cols-1 gap-3 border-t pt-6 sm:grid-cols-2">
            {trustItems.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  fill="none"
                  className="text-teal-deep mt-0.5 h-4 w-4 shrink-0"
                >
                  <path
                    d="M4 10.5l3.5 3.5L16 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-gray-700 text-sm leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Photograph column — proof not decoration */}
        <div className="lg:col-span-5 lg:order-last order-first lg:flex lg:items-center">
          <div className="border-gray-300 relative aspect-[4/5] w-full overflow-hidden rounded-lg border sm:aspect-[16/10] lg:aspect-[4/5]">
            <Image
              src="/photos/photo-frontispiece.jpg"
              alt={t("imageAlt")}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
