import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vercel/blob", () => ({ del: vi.fn().mockResolvedValue(undefined) }));

import { del } from "@vercel/blob";
import { discardMatriculaBlob, MATRICULA_BLOB_URL_RE } from "@/lib/inscripcion/blob-cleanup";

const OURS = "https://abc123.private.blob.vercel-storage.com/matricula-x.jpg";
const OURS_PUBLIC = "https://abc123.public.blob.vercel-storage.com/matricula-y.jpg";

describe("discardMatriculaBlob", () => {
  beforeEach(() => {
    vi.mocked(del).mockClear();
    vi.mocked(del).mockResolvedValue(undefined as never);
  });

  it("deletes a private-store URL", async () => {
    await discardMatriculaBlob(OURS);
    expect(del).toHaveBeenCalledWith(OURS);
  });

  it("deletes a public-store URL (legacy uploads)", async () => {
    await discardMatriculaBlob(OURS_PUBLIC);
    expect(del).toHaveBeenCalledWith(OURS_PUBLIC);
  });

  it("no-ops on empty, null, undefined, and foreign URLs", async () => {
    await discardMatriculaBlob("");
    await discardMatriculaBlob(null);
    await discardMatriculaBlob(undefined);
    await discardMatriculaBlob("https://evil.example.com/x.jpg");
    // Same-suffix but wrong shape must not match either.
    await discardMatriculaBlob("https://evil.com/?u=abc.private.blob.vercel-storage.com/");
    expect(del).not.toHaveBeenCalled();
  });

  it("never throws when del rejects", async () => {
    vi.mocked(del).mockRejectedValueOnce(new Error("network"));
    await expect(discardMatriculaBlob(OURS)).resolves.toBeUndefined();
  });
});

describe("MATRICULA_BLOB_URL_RE", () => {
  it("anchors at the start (no substring matches)", () => {
    expect(MATRICULA_BLOB_URL_RE.test(OURS)).toBe(true);
    expect(MATRICULA_BLOB_URL_RE.test(`https://evil.com/${OURS}`)).toBe(false);
  });
});
