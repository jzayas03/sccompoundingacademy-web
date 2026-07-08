import { del } from "@vercel/blob";

/** Matches our own Blob store hosts only — the same pattern the API route
 *  uses to ACCEPT a matrícula upload. The accept-check and the delete-check
 *  must be one pattern, and we never delete an arbitrary user-supplied URL. */
export const MATRICULA_BLOB_URL_RE =
  /^https:\/\/[a-z0-9]+\.(?:public|private)\.blob\.vercel-storage\.com\//;

/**
 * Best-effort deletion of an orphaned matrícula blob after the server
 * rejects an inscription. The form re-uploads the photo on EVERY submit
 * attempt (the upload lives inside the submit handler), so a rejected
 * attempt's blob is garbage the moment the rejection is sent — deleting it
 * cannot break a retry. Never throws — cleanup must not change the API
 * response. No-op for empty or foreign URLs.
 */
export async function discardMatriculaBlob(
  url: string | null | undefined,
): Promise<void> {
  const candidate = (url ?? "").trim();
  if (!MATRICULA_BLOB_URL_RE.test(candidate)) return;
  try {
    await del(candidate);
  } catch (err) {
    console.warn("[inscripcion] failed to discard orphaned matricula blob", err);
  }
}
