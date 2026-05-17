import { useTranslations } from "next-intl";
import Image from "next/image";
import { Container } from "@/components/ui/Container";

/**
 * §00.5 — Epigraph band.
 *
 * The chapter-break between §00 Atrium (sand cover) and §01 Manifesto.
 * Treats the brand tagline as a literary epigraph — like the quoted
 * passage that opens a chapter in a literary nonfiction book.
 *
 * Composition:
 *   - Full-bleed teal-deep section
 *   - The SCCA pattern wallpaper (page 6 of the brandsheet) sits behind
 *     the type at low opacity — adds brand texture without competing
 *   - Hairline chartreuse rules at top + bottom
 *   - Giant Cormorant italic tagline in chartreuse, centered
 *   - Small attribution line below, off-white tracking-wide caps
 *
 * Uses the existing `tagline.*` messages — the brand tagline lives in
 * shared messages so future treatments can share the same source.
 */
export function Epigraph() {
  const t = useTranslations("tagline");
  const ta = useTranslations("epigraph");
  return (
    <section
      aria-label="Epigraph"
      className="bg-teal-deep relative isolate overflow-hidden border-y border-chartreuse/30"
    >
      {/* Pattern wallpaper as a low-opacity backdrop. Repeats horizontally
          so the texture fills any viewport width without stretching. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-30">
        <Image
          src="/brand/pattern-tile.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <Container className="relative py-20 sm:py-28 lg:py-32">
        <blockquote className="mx-auto max-w-5xl text-center">
          <p className="font-accent text-chartreuse text-4xl leading-[1.05] tracking-tight text-balance italic sm:text-5xl lg:text-6xl xl:text-7xl">
            {t("line1")}{" "}
            <em className="font-accent not-italic">
              <span className="block sm:inline">{t("line2")}</span>
            </em>
          </p>
          <footer className="font-heading text-off-white/70 mt-10 text-xs font-medium tracking-[0.25em] uppercase sm:text-sm">
            {ta("attribution")}
          </footer>
        </blockquote>
      </Container>
    </section>
  );
}
