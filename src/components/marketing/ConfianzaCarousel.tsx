"use client";
import { useEffect, useState } from "react";
import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

/**
 * ConfianzaCarousel — "El primer cohorte" photo carousel.
 *
 * Recreated from the v2 handoff (§3). A 16:10 teal-deep stage where each
 * slide layers a heavily-blurred copy of the image as a backdrop behind
 * an object-contain foreground, so photos of any aspect ratio sit
 * cleanly. Auto-advances every 5.5s (pauses on hover), with arrow
 * controls and a dot rail (active dot widens).
 *
 * Photos live in /public/photos/cohort/ (owner-supplied first-cohort
 * shots). Missing files hide their foreground via onError, so the
 * section degrades to a neutral teal stage until the photos are added.
 */
const PHOTOS = [
  "/photos/cohort/01-grupo.jpg",
  "/photos/cohort/04-duo.jpg",
  "/photos/cohort/05-estudiante.jpg",
  "/photos/cohort/06-estudiante.jpg",
  "/photos/cohort/07-estudiante.jpg",
  "/photos/cohort/08-estudiante.jpg",
  "/photos/cohort/09-estudiante.jpg",
  "/photos/cohort/10-estudiante.jpg",
  "/photos/cohort/11-estudiante.jpg",
  "/photos/cohort/12-estudiante.jpg",
  "/photos/cohort/13-estudiante.jpg",
  "/photos/cohort/02-laboratorio.jpg",
  "/photos/cohort/03-instruccion.jpg",
] as const;

export function ConfianzaCarousel() {
  const t = useTranslations("confianzaCarousel");
  const messages = useMessages() as unknown as {
    confianzaCarousel: { captions: string[] };
  };
  const captions = messages.confianzaCarousel.captions;
  const n = PHOTOS.length;

  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = (d: number) => setI((prev) => (prev + d + n) % n);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setI((p) => (p + 1) % n), 5500);
    return () => clearInterval(timer);
  }, [n, paused]);

  return (
    <section aria-labelledby="confianza-heading" className="bg-white border-gray-300 border-t">
      <Container className="py-16 sm:py-20 lg:py-24">
        <Reveal>
          <div className="mx-auto mb-9 max-w-xl text-center">
            <p className="text-teal-mid font-heading text-[0.7rem] font-bold tracking-[0.16em] uppercase">
              {t("eyebrow")}
            </p>
            <h2
              id="confianza-heading"
              className="font-heading text-teal-deep mt-2.5 text-3xl font-bold tracking-[-0.03em] sm:text-4xl"
            >
              {t("heading")}
            </h2>
            <p className="text-teal-deep/70 mt-3 text-[15px] leading-relaxed">{t("subhead")}</p>
          </div>

          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="bg-teal-deep relative aspect-[16/10] overflow-hidden rounded-2xl"
            style={{ boxShadow: "0 24px 60px -28px rgba(25,85,97,0.5)" }}
          >
            {PHOTOS.map((src, idx) => (
              <div
                key={src}
                className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: idx === i ? 1 : 0, zIndex: idx === i ? 2 : 1 }}
              >
                {/* Plain <img> (not next/image): the blur backdrop + object-contain
                    foreground + onError-hide for not-yet-supplied photos don't map
                    cleanly onto the Image component. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  aria-hidden
                  src={src}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ filter: "blur(28px) brightness(0.5)", transform: "scale(1.15)" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={captions[idx] ?? ""}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                  className="relative z-[1] block h-full w-full object-contain"
                />
                <div
                  className="absolute inset-x-0 bottom-0 z-[2] px-7 pt-14 pb-5"
                  style={{ background: "linear-gradient(to top, rgba(20,68,78,0.92), transparent)" }}
                >
                  <p className="text-off-white mx-auto max-w-2xl text-center text-sm font-medium">
                    {captions[idx] ?? ""}
                  </p>
                </div>
              </div>
            ))}

            {(["prev", "next"] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => go(dir === "next" ? 1 : -1)}
                aria-label={dir === "next" ? t("next") : t("prev")}
                className="text-chartreuse absolute top-1/2 z-[3] flex h-[46px] w-[46px] -translate-y-1/2 items-center justify-center rounded-full border backdrop-blur-sm transition-colors"
                style={{
                  [dir === "next" ? "right" : "left"]: 16,
                  background: "rgba(25,85,97,0.82)",
                  borderColor: "rgba(230,234,130,0.5)",
                }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {dir === "next" ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
                </svg>
              </button>
            ))}
          </div>

          <div className="mt-5 flex justify-center gap-2.5">
            {PHOTOS.map((src, idx) => (
              <button
                key={src}
                type="button"
                onClick={() => setI(idx)}
                aria-label={t("dotAria", { n: idx + 1 })}
                aria-current={idx === i ? "true" : undefined}
                className="h-[9px] rounded-full transition-all duration-300"
                style={{
                  width: idx === i ? 26 : 9,
                  background: idx === i ? "var(--color-teal-deep)" : "var(--color-gray-300)",
                }}
              />
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
