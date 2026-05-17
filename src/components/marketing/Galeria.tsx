import Image from "next/image";
import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

type GalleryItem = { id: string; caption: string; src: string };

/**
 * §04 — Galería / Gallery.
 *
 * Editorial photo set treated as field notes from the laboratory.
 * Three images in an asymmetric staggered grid (think Aesop's
 * journal-style image arrays, not a uniform 3-up gallery):
 *
 *   - Sand reading surface continues
 *   - Same left-gutter §-number rhythm
 *   - Right column: 3 photographs at varying widths and offsets,
 *     each with an italic Cormorant caption directly below
 *   - On mobile, stacks into a single column with same captions
 *
 * Reuses the three reserved photos from public/photos/ (instructor
 * portrait repurposed as "bench" since the dedicated Instructor section
 * was removed; mortar + chemo hood photos otherwise unused on the page).
 */
export function Galeria() {
  const t = useTranslations("galeria");
  const messages = useMessages() as unknown as {
    galeria: { items: GalleryItem[] };
  };
  const items = messages.galeria.items;

  // Asymmetric span pattern: full-width "lead" image, then two narrower
  // images side-by-side. Mobile-first stacks them all.
  const layoutClasses = [
    "lg:col-span-12",  // lead image, full row
    "lg:col-span-7",   // medium image, left
    "lg:col-span-5",   // narrower image, right
  ];

  return (
    <section
      aria-labelledby="galeria-heading"
      className="bg-sand text-teal-deep border-teal-deep/10 relative isolate border-t"
    >
      <Container className="relative py-20 sm:py-28 lg:py-40">
        {/* Header — section number + label + italic intro */}
        <Reveal className="grid gap-10 lg:grid-cols-12 lg:gap-x-12">
          <header className="lg:col-span-3">
            <p className="font-heading text-teal-deep/60 text-xs font-medium tracking-[0.25em] uppercase">
              {t("sectionNumber")}
            </p>
            <h2
              id="galeria-heading"
              className="font-heading text-teal-deep mt-2 text-4xl font-bold tracking-[-0.025em] sm:text-5xl lg:text-6xl"
            >
              {t("sectionLabel")}
            </h2>
          </header>
          <p className="text-teal-deep/85 text-base leading-relaxed lg:col-span-7 lg:text-lg">
            {t("intro")}
          </p>
        </Reveal>

        {/* Photo grid — asymmetric */}
        <Reveal as="ul" className="mt-12 grid grid-cols-1 gap-y-12 sm:gap-y-16 lg:mt-20 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
          {items.map((it, idx) => (
            <li key={it.id} className={layoutClasses[idx] ?? "lg:col-span-12"}>
              <figure className="m-0">
                <div
                  className={`ring-teal-deep/10 shadow-soft relative w-full overflow-hidden rounded-sm ring-1 ${
                    idx === 0 ? "aspect-[21/9]" : "aspect-[4/3]"
                  }`}
                >
                  <Image
                    src={it.src}
                    alt=""
                    aria-hidden
                    fill
                    sizes={idx === 0 ? "(max-width: 1280px) 100vw, 1280px" : "(max-width: 1024px) 100vw, 50vw"}
                    className="object-cover"
                  />
                </div>
                <figcaption className="font-accent text-teal-deep/80 mt-4 max-w-xl text-base leading-snug italic sm:text-lg">
                  {it.caption}
                </figcaption>
              </figure>
            </li>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
