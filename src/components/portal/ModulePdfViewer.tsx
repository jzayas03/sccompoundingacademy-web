"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/glass/GlassCard";

/**
 * Module material viewer with an optional Spanish/English toggle and a
 * fullscreen control.
 *
 * The owner drops the course material at `public/modulos/{basename}.pdf`
 * (Spanish) and, when ready, `{basename}-en.pdf` (English). The server
 * module page checks which files exist and passes the hrefs here:
 *
 *   - both present  → an ES/EN toggle appears; the viewer follows the
 *                      selected language.
 *   - one present   → that language renders, no toggle.
 *   - none present  → a "coming soon" card.
 *
 * View-only by design: pages are rendered to `<canvas>` via pdf.js (see
 * `ModulePdfCanvas`) so there is no native download/print toolbar, the
 * text/annotation layers are disabled (nothing to select or copy), and
 * the container blocks the context menu ("Save as…"). This is deterrence,
 * not DRM — the authenticated bytes still reach the browser.
 */

// pdf.js touches browser-only globals, so load the renderer client-side
// only. A lightweight placeholder keeps layout stable during hydration.
const ModulePdfCanvas = dynamic(
  () => import("./ModulePdfCanvas").then((m) => m.ModulePdfCanvas),
  { ssr: false },
);

type Props = {
  esPdfHref: string | null;
  enPdfHref: string | null;
};

export function ModulePdfViewer({ esPdfHref, enPdfHref }: Props) {
  const t = useTranslations("portal.module");
  const bothExist = Boolean(esPdfHref && enPdfHref);
  const [lang, setLang] = useState<"es" | "en">(esPdfHref ? "es" : "en");

  const href =
    (lang === "es" ? esPdfHref : enPdfHref) ?? esPdfHref ?? enPdfHref;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageWidth, setPageWidth] = useState<number>();

  // Keep the button label in sync with the actual fullscreen state, which
  // can also change via Esc or the browser chrome (not just our button).
  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Render pages at the container's current width so they stay crisp and
  // responsive — including when the container expands to fill the screen.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      // Cap the width for readability on very wide fullscreen displays.
      if (w) setPageWidth(Math.min(Math.floor(w) - 16, 1100));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Fullscreen can be blocked (permissions, unsupported) — ignore and
      // leave the inline viewer as-is.
    }
  }, []);

  if (!href) {
    return (
      <GlassCard className="p-8 sm:p-10">
        <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
          {t("pdfMissingTitle")}
        </p>
        <p className="text-gray-900 mt-3 text-base leading-relaxed">
          {t("pdfMissingBody")}
        </p>
      </GlassCard>
    );
  }

  return (
    <div>
      {/* Controls row — ES/EN toggle (only when both languages exist) on
          the left, the fullscreen button on the right. */}
      <div className="mb-3 flex items-center justify-between gap-3">
        {bothExist ? (
          <div
            role="group"
            aria-label="Idioma del material"
            className="border-gray-300 inline-flex rounded-md border bg-white p-0.5"
          >
            {(["es", "en"] as const).map((code) => {
              const active = lang === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={active}
                  className={`font-heading rounded px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                    active
                      ? "bg-teal-deep text-off-white"
                      : "text-teal-deep hover:bg-teal-deep/10"
                  }`}
                >
                  {code}
                </button>
              );
            })}
          </div>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={toggleFullscreen}
          className="border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-off-white focus-visible:ring-chartreuse font-heading inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
        >
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            fill="none"
            className="h-3.5 w-3.5"
          >
            <path
              d={
                isFullscreen
                  ? "M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4"
                  : "M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4"
              }
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {isFullscreen ? t("exitFullscreen") : t("fullscreen")}
        </button>
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div
          ref={containerRef}
          // Block the context menu so "Save as…"/"Save image" is not an
          // easy path to the material.
          onContextMenu={(e) => e.preventDefault()}
          className={`bg-gray-100 w-full select-none overflow-auto ${
            isFullscreen ? "h-screen" : "h-[70vh]"
          }`}
        >
          <ModulePdfCanvas href={href} width={pageWidth} />
        </div>
      </GlassCard>
    </div>
  );
}
