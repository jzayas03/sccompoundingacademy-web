"use client";

import { Document, Page, pdfjs } from "react-pdf";

/**
 * Renders page 1 of the REAL certificate PDF (`/api/certificate`) to a
 * canvas, so the certificate card shows exactly what the learner downloads
 * instead of a hand-built mock. Loaded only client-side via `next/dynamic`
 * (ssr:false) from `CertPreview` — react-pdf touches browser-only globals.
 *
 * Same self-hosted worker as the module viewer (no CDN drift), and the
 * text/annotation layers are off (this is a static preview, nothing to
 * select). The PDF request is same-origin so the session cookie rides along
 * and the `/api/certificate` auth + eligibility gate still applies.
 */
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export function CertPreviewCanvas({
  pdfUrl,
  width,
  onError,
}: {
  pdfUrl: string;
  width?: number;
  onError?: () => void;
}) {
  return (
    <Document
      file={pdfUrl}
      loading={null}
      error={null}
      onLoadError={onError}
      noData={null}
    >
      <Page
        pageNumber={1}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        onRenderError={onError}
        className="max-w-full"
      />
    </Document>
  );
}
