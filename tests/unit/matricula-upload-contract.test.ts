import { describe, it, expect } from "vitest";
import {
  VERIFICATION_ACCEPTED_TYPES,
  VERIFICATION_MAX_BYTES,
  matriculaFileIssue,
} from "@/lib/portal/verification";

describe("matrícula upload contract", () => {
  it("accepts every format the enrollment form offers (incl. HEIC/WEBP)", () => {
    // The form's file picker advertises these; the Blob token route gates on
    // the SAME constant, so the two can never drift and silently reject an
    // iPhone (HEIC) or WEBP photo — the bug that hung checkout at "Procesando…".
    for (const t of [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf",
    ]) {
      expect(VERIFICATION_ACCEPTED_TYPES).toContain(t);
    }
  });

  it("flags an oversize file (so it fails fast instead of hanging)", () => {
    expect(matriculaFileIssue(VERIFICATION_MAX_BYTES + 1, "image/jpeg")).toBe(
      "too-large",
    );
  });

  it("flags a clearly-unsupported type", () => {
    expect(matriculaFileIssue(1000, "image/gif")).toBe("bad-type");
  });

  it("allows an empty/unknown type (some browsers report '' for HEIC)", () => {
    expect(matriculaFileIssue(1000, "")).toBeNull();
  });

  it("passes a normal in-range jpeg", () => {
    expect(matriculaFileIssue(1_000_000, "image/jpeg")).toBeNull();
  });
});
