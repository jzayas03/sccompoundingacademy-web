// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import sharp from "sharp";

// server-only throws outside the Next.js bundler — mock it away.
vi.mock("server-only", () => ({}));

// signedMatriculaUrl is exercised elsewhere; here we only care that
// fetchViewableMatricula turns whatever it fetches into viewable bytes.
vi.mock("@/lib/portal/blob-read", () => ({
  signedMatriculaUrl: vi.fn(async (u: string | null | undefined) =>
    u ? "https://signed.example/doc" : null,
  ),
}));

import { fetchViewableMatricula } from "@/lib/portal/matricula-view";

/** Build a Response-like stub for the mocked global fetch. */
function stubFetch(body: Uint8Array, contentType: string, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok,
      headers: { get: (k: string) => (k === "content-type" ? contentType : null) },
      arrayBuffer: async () =>
        body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
    })),
  );
}

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF

describe("fetchViewableMatricula", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("returns null for a missing doc URL (no fetch)", async () => {
    expect(await fetchViewableMatricula(null)).toBeNull();
    expect(await fetchViewableMatricula(undefined)).toBeNull();
  });

  it("normalizes a HEIF image to a browser-viewable JPEG", async () => {
    // The iPhone case: no browser renders HEIC/HEIF in <img>. Represent it
    // with a HEIF the local sharp can produce (AV1); the read+re-encode path
    // is identical for an HEVC .heic on the deploy target.
    const base = await sharp({
      create: { width: 32, height: 24, channels: 3, background: { r: 25, g: 85, b: 97 } },
    })
      .png()
      .toBuffer();
    const heif = await sharp(base).heif({ compression: "av1", quality: 50 }).toBuffer();
    stubFetch(new Uint8Array(heif), "image/heif");

    const out = await fetchViewableMatricula("https://blob/matricula.heic");
    expect(out).not.toBeNull();
    expect(out!.contentType).toBe("image/jpeg");
    expect([...out!.body.subarray(0, 3)]).toEqual(JPEG_MAGIC);
    // And it's a real decodable JPEG of the right size.
    const meta = await sharp(Buffer.from(out!.body)).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.width).toBe(32);
  });

  it("passes a PDF through untouched (browsers render it natively)", async () => {
    const pdf = new Uint8Array([...PDF_MAGIC, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
    stubFetch(pdf, "application/pdf");

    const out = await fetchViewableMatricula("https://blob/matricula.pdf");
    expect(out!.contentType).toBe("application/pdf");
    expect([...out!.body.subarray(0, 4)]).toEqual(PDF_MAGIC);
  });

  it("falls back to raw bytes when the payload is not a decodable image", async () => {
    // Safety net: an undecodable blob must never be worse than serving raw.
    const junk = new Uint8Array([1, 2, 3, 4, 5]);
    stubFetch(junk, "application/octet-stream");

    const out = await fetchViewableMatricula("https://blob/whatever.bin");
    expect(out!.contentType).toBe("application/octet-stream");
    expect([...out!.body]).toEqual([1, 2, 3, 4, 5]);
  });

  it("returns null when the upstream fetch is not ok", async () => {
    stubFetch(new Uint8Array([0]), "image/jpeg", false);
    expect(await fetchViewableMatricula("https://blob/x.jpg")).toBeNull();
  });
});
