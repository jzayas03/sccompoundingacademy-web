"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";

/**
 * Hero — full-bleed working-lab slideshow with one decisive CTA.
 *
 * Recreated from the SCCA Design System handoff (Marketing Homepage):
 * four laboratory photographs crossfade behind an angled teal scrim, an
 * XL Montserrat headline sits on the darker left edge, and a single
 * chartreuse "View courses" button drives the primary action.
 *
 * Client component — the crossfade advances on a 7s interval. Slides are
 * decorative background layers (aria-hidden); the <h1> carries the
 * accessible name. Not wrapped in <Reveal>: it's above the fold.
 */
const HERO_PHOTOS = [
  "/photos/photo-chemo-lab.png",
  "/photos/photo-mortar-gloves.png",
  "/photos/photo-cursos-bench.jpg",
  "/photos/photo-lab-bottles.jpg",
] as const;

export function Hero() {
  const t = useTranslations("hero");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % HERO_PHOTOS.length), 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="text-off-white relative isolate overflow-hidden"
    >
      {/* Crossfading photo slideshow (decorative). */}
      {HERO_PHOTOS.map((src, i) => (
        <div
          key={src}
          aria-hidden
          className={cn("hero-slide", i === idx && "active")}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      {/* Angled teal scrim: dark where the headline sits, clearing to the
          right so the photograph still breathes. */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(105deg, rgba(25,85,97,0.72) 0%, rgba(25,85,97,0.52) 50%, rgba(25,85,97,0.28) 100%)",
        }}
      />
      <Container className="relative z-[2] py-24 sm:py-28 lg:py-32">
        <div className="max-w-2xl">
          <h1
            id="hero-heading"
            className="font-heading text-off-white text-4xl font-extrabold leading-[1.03] tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl"
          >
            {t("headline")}
          </h1>
          <div className="mt-9">
            <Link
              href="/cursos"
              className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift focus-visible:ring-chartreuse font-heading inline-flex h-14 items-center justify-center rounded-[13px] px-8 text-base font-semibold ring-1 transition-[background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-deep focus-visible:outline-none motion-safe:hover:-translate-y-px"
            >
              {t("primaryCta")}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
