/**
 * Shared constants for the matrícula verification upload, used by both the
 * client form and the Blob token-issuing route so the limits stay in sync.
 */
export const VERIFICATION_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

/** 8 MB — comfortably above a phone photo, below anything abusive. */
export const VERIFICATION_MAX_BYTES = 8 * 1024 * 1024;

/** Blob pathname prefix so all verification docs share a folder. */
export const VERIFICATION_BLOB_PREFIX = "matricula";
