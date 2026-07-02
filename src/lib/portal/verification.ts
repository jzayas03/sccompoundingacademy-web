/**
 * Shared constants for the matrícula verification upload, used by both the
 * client form and the Blob token-issuing route so the limits stay in sync.
 */
// MUST stay a superset of (or equal to) the enrollment form's file-input
// `accept` list — the form derives `accept` from this very constant, and the
// Blob token route gates the upload on it. When the two drifted (form offered
// HEIC/WEBP, server allowed only JPG/PNG/PDF) an iPhone (HEIC) photo got a
// token but was rejected at the PUT, and @vercel/blob's retry loop left
// checkout hung on "Procesando…". heic/heif cover iPhone photos; webp covers
// modern Android/desktop exports.
export const VERIFICATION_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
] as const;

/** 15 MB — comfortably above a high-res phone photo, below anything abusive. */
export const VERIFICATION_MAX_BYTES = 15 * 1024 * 1024;

/** Blob pathname prefix so all verification docs share a folder. */
export const VERIFICATION_BLOB_PREFIX = "matricula";

/** File extension → an allow-listed content-type. */
const EXT_CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
};

/**
 * Content-type to DECLARE on the matrícula Blob upload PUT.
 *
 * iOS Safari frequently reports an empty `File.type` for HEIC photos (because
 * `image/heic` is in the picker's `accept` list, iOS hands over the original
 * HEIC instead of transcoding to JPEG). If we let the browser PUT that file
 * with no explicit content-type, the request's Content-Type is empty, Vercel
 * Blob checks it against `allowedContentTypes`, matches nothing, and rejects
 * the upload — which the student sees as "No pudimos subir tu matrícula".
 *
 * So we ALWAYS hand `upload()` a real, allow-listed content-type: the file's
 * own `type` when the browser gave one, otherwise inferred from its extension,
 * defaulting to JPEG (the dominant phone-photo format) so an unknown-typed
 * image still uploads. The return value is guaranteed to be in
 * `VERIFICATION_ACCEPTED_TYPES`, so the PUT can never be rejected on type.
 */
export function matriculaContentType(name: string, type: string): string {
  if (type && (VERIFICATION_ACCEPTED_TYPES as readonly string[]).includes(type))
    return type;
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return EXT_CONTENT_TYPE[ext] ?? "image/jpeg";
}

export type MatriculaFileIssue = "too-large" | "bad-type" | null;

/**
 * Client-side pre-flight for the matrícula upload. Run BEFORE handing the file
 * to the Blob client so a too-large or unsupported file fails fast with a
 * message, instead of getting a token and then stalling in the Blob client's
 * retry loop (which surfaces to the student as a checkout stuck on
 * "Procesando…"). An empty/unknown `type` passes here — iOS Safari reports ""
 * for HEIC — because we can't classify it from the type alone; the upload then
 * declares a real, allow-listed content-type via `matriculaContentType` (from
 * the file extension), so the PUT still carries a valid type.
 */
export function matriculaFileIssue(
  size: number,
  type: string,
): MatriculaFileIssue {
  if (size > VERIFICATION_MAX_BYTES) return "too-large";
  if (type && !(VERIFICATION_ACCEPTED_TYPES as readonly string[]).includes(type))
    return "bad-type";
  return null;
}
