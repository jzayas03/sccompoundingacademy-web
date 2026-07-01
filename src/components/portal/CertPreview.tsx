"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

/**
 * Live preview of the learner's actual certificate, shown in the cert card.
 * Fetches `/api/certificate` (the same PDF the download button serves — the
 * `?preview=` variant for owners) and renders its first page to fill the
 * card, so what you see IS what you download.
 *
 * react-pdf is browser-only, so the canvas loads via `next/dynamic`
 * (ssr:false). While it loads — or if the PDF ever fails to render — a quiet
 * teal placeholder holds the card so the layout never jumps.
 */
const CertPreviewCanvas = dynamic(
  () => import("./CertPreviewCanvas").then((m) => m.CertPreviewCanvas),
  { ssr: false },
);

export function CertPreview({ pdfUrl }: { pdfUrl: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();
  const [failed, setFailed] = useState(false);

  // Render the page at the card's live width so it stays crisp + responsive.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.floor(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[linear-gradient(160deg,var(--color-teal-deep),#123f48)]"
    >
      {/* Placeholder eyebrow behind the canvas — visible while the PDF loads
          or if it fails, so the card is never blank. */}
      <p className="text-chartreuse/70 pointer-events-none absolute text-[11px] font-bold tracking-[0.22em] uppercase">
        Certificate of Completion
      </p>
      {!failed && width ? (
        <div className="relative w-full">
          <CertPreviewCanvas
            pdfUrl={pdfUrl}
            width={width}
            onError={() => setFailed(true)}
          />
        </div>
      ) : null}
    </div>
  );
}
