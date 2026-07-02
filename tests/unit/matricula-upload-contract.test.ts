import { describe, it, expect } from "vitest";
import {
  VERIFICATION_ACCEPTED_TYPES,
  VERIFICATION_MAX_BYTES,
  matriculaFileIssue,
  matriculaContentType,
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

  describe("matriculaContentType — the content-type declared to the Blob PUT", () => {
    it("uses the file's own type when the browser provides one", () => {
      expect(matriculaContentType("photo.jpg", "image/jpeg")).toBe("image/jpeg");
      expect(matriculaContentType("scan.pdf", "application/pdf")).toBe(
        "application/pdf",
      );
    });

    it("infers image/heic from the extension when iOS reports an empty type", () => {
      // The exact iPhone failure: Safari hands over a HEIC photo with File.type
      // === "". Without an explicit content-type the PUT is sent with an empty
      // Content-Type, which matches nothing in allowedContentTypes and the
      // upload is rejected. We must derive a real, allow-listed type.
      expect(matriculaContentType("IMG_4821.HEIC", "")).toBe("image/heic");
      expect(matriculaContentType("IMG_4821.heif", "")).toBe("image/heif");
    });

    it("infers the other formats from the extension when type is empty", () => {
      expect(matriculaContentType("a.png", "")).toBe("image/png");
      expect(matriculaContentType("a.webp", "")).toBe("image/webp");
      expect(matriculaContentType("a.jpeg", "")).toBe("image/jpeg");
      expect(matriculaContentType("a.pdf", "")).toBe("application/pdf");
    });

    it("NEVER returns an empty or off-allowlist type (the upload-breaking invariant)", () => {
      // Whatever the input, the declared type must be one Vercel Blob will
      // accept — otherwise we reproduce the very rejection we're fixing.
      for (const [name, type] of [
        ["", ""],
        ["noextension", ""],
        ["weird.bin", ""],
        ["IMG.HEIC", ""],
      ] as const) {
        const ct = matriculaContentType(name, type);
        expect(ct).not.toBe("");
        expect(VERIFICATION_ACCEPTED_TYPES).toContain(ct);
      }
    });
  });
});
