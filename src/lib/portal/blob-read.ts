import "server-only";

import { issueSignedToken, presignUrl } from "@vercel/blob";

/**
 * Turn a stored matrícula Blob URL into a URL a human can actually open.
 *
 * The matrícula photo is an identity document, so it lives in a PRIVATE Blob
 * store: the bare `…private.blob.vercel-storage.com/…` URL 403s without a
 * signature. This mints a short-lived signed GET URL via the Blob control API
 * (server-only — uses `BLOB_READ_WRITE_TOKEN`).
 *
 * A legacy `…public.blob…` URL (or anything we can't parse) is returned
 * unchanged: public blobs are directly viewable, and a parse failure degrades
 * to "no preview" rather than throwing in a render path.
 *
 * `ttlMs` controls how long the link stays valid. Pages pass a short TTL (the
 * URL is regenerated on every render); the admin review EMAIL passes a long one
 * because the owner may open it hours or days after it arrives.
 */
export async function signedMatriculaUrl(
  docUrl: string | null | undefined,
  ttlMs: number = 60 * 60 * 1000,
): Promise<string | null> {
  if (!docUrl) return null;

  // Public blobs (legacy) are already directly viewable — pass through.
  if (!/\.private\.blob\.vercel-storage\.com\//.test(docUrl)) return docUrl;

  let pathname: string;
  try {
    pathname = new URL(docUrl).pathname.replace(/^\/+/, "");
  } catch {
    return null;
  }
  if (!pathname) return null;

  try {
    const validUntil = Date.now() + ttlMs;
    const token = await issueSignedToken({
      pathname,
      operations: ["get"],
      validUntil,
    });
    const { presignedUrl } = await presignUrl(token, {
      operation: "get",
      pathname,
      access: "private",
    });
    return presignedUrl;
  } catch (err) {
    console.error("[blob] signedMatriculaUrl failed", err);
    return null;
  }
}
