import Image from "next/image";
import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

type GalleryItem = { id: string; caption: string; src: string };

/**
 * Galería — laboratory proof photos.
 *
 * Three workplace photos arranged in an asymmetric grid (one lead
 * landscape + two narrower aspect-4/3 photos side by side). Photos
 * are proof, not decoration — they show the actual bench, the mortar
 * & pestle in use, and the hazardous-drug safety cabinet.
 *
 * Restyled to the medical-clean direction: white surface, gray-300
 * borders on each frame, captions back to a single short line in
 * regular slate (no italic Cormorant, no multi-sentence pedagogy).
 */
export function Galeria() {
  const t = useTranslations("galeria");
  const messages = useMessages() as unknown as {
    galeria: { items: GalleryItem[] };
  };
  const items = messages.galeria.items;

  const layoutClasses = [
    "lg:col-span-12", // lead, full row
    "lg:col-span-7",
    "lg:col-span-5",
  ];

  return (
    <section
      aria-labelledby="galeria-heading"
      className="bg-white border-gray-300 border-t"
    >
      <Container className="py-20 sm:py-24 lg:py-28">
        <Reveal>
          <div className="max-w-3xl">
            <p className="font-heading text-teal-deep/70 text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
              {t("eyebrow")}
            </p>
            <h2
              id="galeria-heading"
              className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl lg:text-5xl"
            >
              {t("heading")}
            </h2>
            <p className="text-gray-900 mt-5 text-base leading-relaxed sm:text-lg">
              {t("intro")}
            </p>
          </div>
        </Reveal>

        <Reveal
          as="ul"
          className="mt-10 grid grid-cols-1 gap-y-10 sm:gap-y-12 lg:mt-14 lg:grid-cols-12 lg:gap-x-6"
        >
          {items.map((it, idx) => (
            <li key={it.id} className={layoutClasses[idx] ?? "lg:col-span-12"}>
              <figure className="m-0">
                <div
                  className={`border-gray-300 relative w-full overflow-hidden rounded-lg border ${
                    idx === 0 ? "aspect-[21/9]" : "aspect-[4/3]"
                  }`}
                >
                  <Image
                    src={it.src}
                    alt={it.caption}
                    fill
                    sizes={
                      idx === 0
                        ? "(max-width: 1280px) 100vw, 1280px"
                        : "(max-width: 1024px) 100vw, 50vw"
                    }
                    className="object-cover"
                  />
                </div>
                <figcaption className="text-gray-700 mt-3 max-w-2xl text-sm leading-snug sm:text-base">
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
