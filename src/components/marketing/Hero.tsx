"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";

/**
 * Hero — full-bleed compounded-product slideshow with one decisive CTA.
 *
 * Recreated from the SCCA Design System handoff (Marketing Homepage):
 * four compounded-product photographs (light backgrounds) crossfade,
 * anchored `right center` so the product breathes on the right while a
 * single bottom-weighted teal gradient darkens the lower band. The XL
 * Montserrat headline sits bottom-left over that band, and a chartreuse
 * "View courses" button drives the primary action.
 *
 * Client component — the crossfade advances on a 6s interval. Slides are
 * decorative background layers (aria-hidden); the <h1> carries the
 * accessible name. Not wrapped in <Reveal>: it's above the fold.
 */
const HERO_PHOTOS = [
  "/photos/product-cream-tube.webp",
  "/photos/product-ointment-jar.webp",
  "/photos/product-capsules.webp",
  "/photos/product-pain-pump.webp",
] as const;

export function Hero() {
  const t = useTranslations("hero");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % HERO_PHOTOS.length), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="bg-teal-deep text-off-white relative isolate flex overflow-hidden"
      style={{ minHeight: "clamp(560px, 78vh, 760px)" }}
    >
      {/* Crossfading product slideshow (decorative). Light-background
          product shots anchored `right center` (see .hero-slide) so the
          product breathes on the right of the frame. */}
      {HERO_PHOTOS.map((src, i) => (
        <div
          key={src}
          aria-hidden
          className={cn("hero-slide", i === idx && "active")}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      {/* Bottom-weighted teal gradient: opaque at the base to carry the
          headline, clearing toward the top so the product shows. */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to top, rgba(18,62,71,0.97) 0%, rgba(19,64,73,0.9) 30%, rgba(22,76,86,0.5) 52%, rgba(25,85,97,0.12) 100%)",
        }}
      />
      {/* Corner scrim behind the bottom-left headline. These product shots
          fill the frame under `cover`, so the product's own printed label
          would otherwise read through the words; this angled wash grounds
          the headline while fading out toward the top-right, keeping the
          product visible where it breathes. */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to top right, rgba(18,62,71,0.92) 0%, rgba(20,68,78,0.55) 28%, rgba(22,76,86,0.16) 48%, transparent 62%)",
        }}
      />
      {/* Bottom-anchored content: headline + CTA sit on the darkened band. */}
      <Container className="relative z-[2] flex items-end pt-16 pb-[72px]">
        <div className="flex max-w-[780px] flex-col justify-end">
          <h1
            id="hero-heading"
            className="font-heading text-off-white text-4xl leading-[1.03] font-extrabold tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl"
            style={{ textShadow: "0 2px 24px rgba(15,52,60,0.55)" }}
          >
            {t("headline")}
          </h1>
          <div className="mt-9">
            <Link
              href="/cursos"
              className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift focus-visible:ring-chartreuse font-heading focus-visible:ring-offset-teal-deep inline-flex h-14 items-center justify-center rounded-[13px] px-8 text-base font-semibold ring-1 transition-[background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-safe:hover:-translate-y-px"
            >
              {t("primaryCta")}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
