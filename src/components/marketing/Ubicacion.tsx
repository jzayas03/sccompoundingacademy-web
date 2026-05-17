import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

/**
 * §07 — Ubicación / Location.
 *
 * Editorial map section. Same gutter rhythm as every other §-numbered
 * section:
 *
 *   - Left gutter (lg:col-span-3): §07 eyebrow + section heading
 *   - Right column (lg:col-span-9): two-up on lg
 *     - 5/9 address card with sede / parking / transit + "Open in
 *       Google Maps" external link
 *     - 7/9 embedded Google Maps iframe in a 4:3 framed box (matches
 *       Frontispiece's ring/shadow treatment)
 *
 * On mobile the iframe and address stack vertically (map first).
 *
 * Map embed uses Google's no-API-key iframe format
 * (https://maps.google.com/maps?q=…&output=embed). The query string and
 * full text address both come from i18n, so the user can drop in an
 * exact street address later without touching the component.
 */
export function Ubicacion() {
  const t = useTranslations("ubicacion");
  const embedQuery = t("embedQuery");
  const openMapsUrl = `https://www.google.com/maps/search/?api=1&query=${embedQuery}`;
  const iframeSrc = `https://maps.google.com/maps?q=${embedQuery}&t=&z=15&output=embed`;
  const iframeTitle = `${t("sectionLabel")} — ${t("addressLine")}`;

  return (
    <section
      id="ubicacion"
      aria-labelledby="ubicacion-heading"
      className="bg-sand text-teal-deep border-teal-deep/10 relative isolate border-t"
    >
      <Container className="relative py-20 sm:py-28 lg:py-40">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-12">
            {/* Left gutter */}
            <header className="lg:col-span-3">
              <p className="font-heading text-teal-deep/60 text-xs font-medium tracking-[0.25em] uppercase">
                {t("sectionNumber")}
              </p>
              <h2
                id="ubicacion-heading"
                className="font-heading text-teal-deep mt-2 text-4xl font-bold tracking-[-0.025em] sm:text-5xl lg:text-6xl"
              >
                {t("sectionLabel")}
              </h2>
              <p className="text-teal-deep/85 mt-6 max-w-md text-base leading-relaxed sm:text-lg">
                {t("intro")}
              </p>
            </header>

            {/* Right column: address + map */}
            <div className="grid gap-8 lg:col-span-9 lg:grid-cols-12 lg:gap-x-8">
              {/* Address card */}
              <div className="lg:col-span-5">
                <dl className="border-teal-deep/15 space-y-6 border-t pt-6">
                  <div>
                    <dt className="font-heading text-teal-deep/60 text-xs font-medium tracking-[0.25em] uppercase">
                      {t("addressLabel")}
                    </dt>
                    <dd className="text-teal-deep mt-2 text-base sm:text-lg">{t("addressLine")}</dd>
                  </div>
                  <div>
                    <dt className="font-heading text-teal-deep/60 text-xs font-medium tracking-[0.25em] uppercase">
                      {t("parkingLabel")}
                    </dt>
                    <dd className="text-teal-deep/85 mt-2 text-sm leading-relaxed sm:text-base">
                      {t("parkingNote")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-heading text-teal-deep/60 text-xs font-medium tracking-[0.25em] uppercase">
                      {t("transitLabel")}
                    </dt>
                    <dd className="text-teal-deep/85 mt-2 text-sm leading-relaxed sm:text-base">
                      {t("transitNote")}
                    </dd>
                  </div>
                </dl>

                <p className="mt-10">
                  <a
                    href={openMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-heading text-teal-deep group inline-flex items-center gap-2 text-sm font-semibold tracking-wide uppercase sm:text-base"
                  >
                    <span className="border-teal-deep group-hover:border-teal border-b-2 pb-1 transition-colors">
                      {t("openInMapsLabel")}
                    </span>
                    <span aria-hidden className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </a>
                </p>
              </div>

              {/* Map iframe */}
              <div className="lg:col-span-7 lg:order-last order-first">
                <div className="ring-teal-deep/10 shadow-soft relative aspect-[4/3] w-full overflow-hidden rounded-sm ring-1">
                  <iframe
                    src={iframeSrc}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={iframeTitle}
                    className="absolute inset-0 h-full w-full border-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
