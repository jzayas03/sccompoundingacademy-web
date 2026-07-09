import "server-only";

import sharp from "sharp";
import { signedMatriculaUrl } from "@/lib/portal/blob-read";

export type ViewableMatricula = { body: Uint8Array; contentType: string };

/**
 * Fetch a stored matrícula and return bytes a browser can ACTUALLY render.
 *
 * The upload flow deliberately accepts iPhone HEIC/HEIF (so checkout does not
 * hang on "Procesando…" — see lib/portal/verification.ts), but no mainstream
 * browser renders HEIC in an `<img>`, and a downloaded `.heic` can't be opened
 * on Windows/Android without a converter. That left admins unable to view or
 * download a submitted matrícula.
 *
 * This normalizes any raster image to JPEG at view time (which also bakes in
 * EXIF orientation for iPhone portraits); PDFs pass through untouched. On ANY
 * failure it falls back to the raw upstream bytes, so a caller is never worse
 * off than serving the signed Blob URL directly.
 *
 * Works for already-uploaded HEIC files too — the conversion is at the
 * viewing boundary, not at upload — so no re-upload or backfill is needed.
 */
export async function fetchViewableMatricula(
  docUrl: string | null | undefined,
): Promise<ViewableMatricula | null> {
  if (!docUrl) return null;

  const signed = await signedMatriculaUrl(docUrl);
  if (!signed) return null;

  let upstream: Response;
  try {
    upstream = await fetch(signed);
  } catch (err) {
    console.error("[matricula-view] fetch failed", err);
    return null;
  }
  if (!upstream.ok) {
    console.error(`[matricula-view] upstream responded ${upstream.status}`);
    return null;
  }

  const rawType = upstream.headers.get("content-type") ?? "";
  const buf = Buffer.from(await upstream.arrayBuffer());

  // PDFs render fine in the browser's built-in viewer — serve as-is.
  if (rawType.includes("pdf") || /\.pdf(\?|$)/i.test(docUrl)) {
    return { body: buf, contentType: "application/pdf" };
  }

  // Normalize every raster image (HEIC/HEIF/WEBP/PNG/JPEG) to JPEG so it
  // renders in every browser and downloads viewable. `.rotate()` with no
  // argument applies the EXIF orientation tag.
  try {
    const jpeg = await sharp(buf).rotate().jpeg({ quality: 85 }).toBuffer();
    return { body: jpeg, contentType: "image/jpeg" };
  } catch (err) {
    console.error("[matricula-view] sharp normalize failed, serving raw", err);
    return { body: buf, contentType: rawType || "application/octet-stream" };
  }
}
