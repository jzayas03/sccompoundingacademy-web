import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";

/**
 * §01.5 — Frontispicio / Frontispiece.
 *
 * The opening photographic spread of the editorial top — the visual
 * anchor between §01 Manifesto (a single editorial paragraph) and §02
 * Cursos (the catalog). Treated like the full-page photograph that
 * opens a chapter in a long-form nonfiction book or a museum
 * exhibition catalogue:
 *
 *   - Full-width 16:9 photograph with a teal-deep matte border (a single
 *     thin hairline at top and bottom continues the editorial rhythm)
 *   - Caption underneath: small "§01.5 · Frontispicio" eyebrow in the
 *     left gutter, italic Cormorant caption in the body, no decorative
 *     wrapping or "Fig. 1" prefix — the caption reads like a museum
 *     label
 *   - The photograph itself does the heavy lifting (composition of
 *     USP/NF ingredients on marble; "COMPOUNDING WORKSHEET" form visible
 *     in the corner does the brand-pharmacy work without us labelling
 *     anything)
 */
export function Frontispiece() {
  const t = useTranslations("frontispiece");
  return (
    <section
      aria-labelledby="frontispiece-caption"
      className="bg-sand text-teal-deep border-teal-deep/10 relative isolate border-t"
    >
      <Container className="relative py-12 sm:py-16 lg:py-20">
        {/* The photograph — 16:9 frame with subtle border + soft shadow */}
        <figure className="m-0">
          <div className="ring-teal-deep/10 shadow-soft relative aspect-[16/9] w-full overflow-hidden rounded-sm ring-1">
            <Image
              src="/photos/photo-frontispiece.jpg"
              alt={t("alt")}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
          </div>

          {/* Caption row: gutter eyebrow + italic body */}
          <figcaption
            id="frontispiece-caption"
            className="mt-6 grid gap-3 lg:grid-cols-12 lg:gap-x-12"
          >
            <p className="font-heading text-teal-deep/60 text-[0.6875rem] font-medium tracking-[0.25em] uppercase lg:col-span-3">
              {t("sectionNumber")} · {t("sectionLabel")}
            </p>
            <p className="font-accent text-teal-deep/85 text-base leading-snug italic sm:text-lg lg:col-span-9">
              {t("caption")}
            </p>
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
