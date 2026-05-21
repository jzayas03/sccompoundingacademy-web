"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/glass/GlassCard";

/**
 * Module PDF viewer with an optional Spanish/English language toggle.
 *
 * The owner drops the course material at `public/modulos/dia-{n}.pdf`
 * (Spanish) and, when ready, `public/modulos/dia-{n}-en.pdf` (English).
 * The server module page checks which files exist and passes the hrefs
 * here:
 *
 *   - both present  → an ES/EN toggle appears; the viewer and the
 *                      download button follow the selected language.
 *   - one present   → that language renders, no toggle.
 *   - none present  → a "coming soon" card.
 *
 * Forward-compatible: the toggle simply appears the day the owner
 * uploads the English PDFs — no code change needed.
 */
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
      {bothExist && (
        <div className="mb-3 flex justify-end">
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
        </div>
      )}

      <GlassCard className="overflow-hidden p-0">
        <object
          data={href}
          type="application/pdf"
          className="block h-[70vh] w-full"
        >
          <p className="text-gray-900 p-6 text-sm">{t("viewerFallback")}</p>
        </object>
      </GlassCard>

      <div className="mt-4">
        <a
          href={href}
          download
          className="border-teal-deep text-teal-deep bg-white shadow-soft hover:bg-teal-deep hover:text-off-white hover:shadow-lift focus-visible:ring-chartreuse font-heading inline-flex h-12 items-center justify-center rounded-md border-2 px-6 text-sm font-semibold transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none motion-safe:hover:-translate-y-px"
        >
          {t("downloadCta")} ↓
        </a>
      </div>
    </div>
  );
}
