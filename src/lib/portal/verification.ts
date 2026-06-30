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

export type MatriculaFileIssue = "too-large" | "bad-type" | null;

/**
 * Client-side pre-flight for the matrícula upload. Run BEFORE handing the file
 * to the Blob client so a too-large or unsupported file fails fast with a
 * message, instead of getting a token and then stalling in the Blob client's
 * retry loop (which surfaces to the student as a checkout stuck on
 * "Procesando…"). An empty/unknown `type` passes here — some browsers report
 * "" for HEIC — and the server's `allowedContentTypes` remains the authority.
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
