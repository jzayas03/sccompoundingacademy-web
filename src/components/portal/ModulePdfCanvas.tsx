"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useTranslations } from "next-intl";

/**
 * pdf.js canvas renderer for the module material.
 *
 * Why pdf.js instead of a native `<object>`/`<iframe>`: the browser's
 * built-in PDF viewer ships its own toolbar with download + print
 * buttons that we cannot remove. Rendering each page to a `<canvas>`
 * ourselves drops that toolbar entirely, which (together with the
 * disabled text/annotation layers and the blocked context menu in the
 * parent `ModulePdfViewer`) keeps the course material view-only.
 *
 * NOTE: this is best-effort deterrence, not DRM — the PDF bytes still
 * reach the browser over the same authenticated request, so a determined
 * user can recover them. It removes the one-click download, nothing more.
 *
 * Loaded via `next/dynamic` with `ssr: false` from `ModulePdfViewer`, so
 * react-pdf (which touches browser-only globals) never runs on the server.
 */

// Self-host the worker from the pinned `pdfjs-dist` dependency so the
// version always matches the API bundled by react-pdf (no CDN drift).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type Props = {
  /** Same-origin `/modulos/{basename}.pdf` href (cookie-gated by middleware). */
  href: string;
  /** Pixel width to render each page at; follows the parent container. */
  width?: number;
};

export function ModulePdfCanvas({ href, width }: Props) {
  const t = useTranslations("portal.module");
  const [numPages, setNumPages] = useState(0);

  const loading = (
    <p className="text-gray-700 p-6 text-sm">{t("viewerLoading")}</p>
  );
  const error = <p className="text-gray-900 p-6 text-sm">{t("viewerError")}</p>;

  return (
    <Document
      file={href}
      onLoadSuccess={({ numPages: n }) => setNumPages(n)}
      loading={loading}
      error={error}
      // Keep the previous href's pages on screen while a language switch
      // loads, then swap — avoids a flash of the loading state.
      className="flex flex-col items-center gap-2 py-2"
    >
      {Array.from({ length: numPages }, (_, i) => (
        <Page
          key={`${href}-${i}`}
          pageNumber={i + 1}
          width={width}
          // Text + annotation layers off: nothing to select/copy, and no
          // clickable links — reinforces the view-only intent and avoids
          // shipping the layer CSS.
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="shadow-soft max-w-full"
        />
      ))}
    </Document>
  );
}
