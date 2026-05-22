import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Ubicación — location with embedded Google Maps.
 *
 * Restyled to the medical-clean direction: off-white surface, sober
 * gray-300 borders, no §-number gutter. Two-up on lg: address detail
 * card on the left, embedded map iframe on the right. Stacks vertical
 * on mobile (map first so the visual orients quickly).
 *
 * Map embed uses Google's no-API-key iframe format. Address line and
 * embed query both come from i18n so the pin can be swapped without
 * touching the component.
 */
export function Ubicacion() {
  const t = useTranslations("ubicacion");
  const embedQuery = t("embedQuery");
  const openMapsUrl = `https://www.google.com/maps/search/?api=1&query=${embedQuery}`;
  const iframeSrc = `https://maps.google.com/maps?q=${embedQuery}&t=&z=15&output=embed`;
  const iframeTitle = `${t("heading")} — ${t("addressLine")}`;

  return (
    <section
      id="ubicacion"
      aria-labelledby="ubicacion-heading"
      className="bg-off-white"
    >
      <Container className="py-20 sm:py-24 lg:py-28">
        <Reveal>
          <div className="max-w-3xl">
            <p className="font-heading text-teal-deep/80 flex items-center text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
              <span aria-hidden className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm" />
              {t("eyebrow")}
            </p>
            <h2
              id="ubicacion-heading"
              className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl lg:text-5xl"
            >
              {t("heading")}
            </h2>
            <p className="text-gray-900 mt-5 text-base leading-relaxed sm:text-lg">
              {t("intro")}
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-10 grid grid-cols-1 gap-8 lg:mt-14 lg:grid-cols-12 lg:gap-x-8">
          {/* Address detail */}
          <div className="lg:col-span-5 lg:order-first order-last">
            <div className="border-gray-300 rounded-lg border bg-white p-6 sm:p-7">
              <dl className="space-y-5">
                <div>
                  <dt className="font-heading text-teal-deep/80 text-xs font-semibold tracking-[0.18em] uppercase">
                    {t("addressLabel")}
                  </dt>
                  <dd className="text-gray-900 mt-2 text-base sm:text-lg">{t("addressLine")}</dd>
                </div>
                <div className="border-gray-300 border-t pt-5">
                  <dt className="font-heading text-teal-deep/80 text-xs font-semibold tracking-[0.18em] uppercase">
                    {t("hoursLabel")}
                  </dt>
                  <dd className="text-gray-900 mt-2 text-base sm:text-lg">{t("hoursValue")}</dd>
                </div>
                <div className="border-gray-300 border-t pt-5">
                  <dt className="font-heading text-teal-deep/80 text-xs font-semibold tracking-[0.18em] uppercase">
                    {t("parkingLabel")}
                  </dt>
                  <dd className="text-gray-700 mt-2 text-sm leading-relaxed sm:text-base">
                    {t("parkingNote")}
                  </dd>
                </div>
                <div className="border-gray-300 border-t pt-5">
                  <dt className="font-heading text-teal-deep/80 text-xs font-semibold tracking-[0.18em] uppercase">
                    {t("transitLabel")}
                  </dt>
                  <dd className="text-gray-700 mt-2 text-sm leading-relaxed sm:text-base">
                    {t("transitNote")}
                  </dd>
                </div>
              </dl>

              <p className="border-gray-300 mt-6 border-t pt-5">
                <a
                  href={openMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-heading text-teal-deep hover:text-teal group inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                >
                  <span>{t("openInMapsLabel")}</span>
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </a>
              </p>
            </div>
          </div>

          {/* Map iframe */}
          <div className="lg:col-span-7">
            <div className="border-gray-300 relative aspect-[4/3] w-full overflow-hidden rounded-lg border">
              <iframe
                src={iframeSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={iframeTitle}
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
