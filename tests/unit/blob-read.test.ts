// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// server-only throws outside the Next.js bundler — mock it away.
vi.mock("server-only", () => ({}));

const issueSignedToken = vi.fn(async () => ({
  clientSigningToken: "cst",
  delegationToken: "dt",
}));
const presignUrl = vi.fn(async () => ({
  presignedUrl: "https://store.private.blob.vercel-storage.com/doc?signed=1",
}));
vi.mock("@vercel/blob", () => ({
  issueSignedToken: (...a: unknown[]) => issueSignedToken(...(a as [])),
  presignUrl: (...a: unknown[]) => presignUrl(...(a as [])),
}));

import { signedMatriculaUrl } from "@/lib/portal/blob-read";

const HOST = "https://abc123.private.blob.vercel-storage.com";

describe("signedMatriculaUrl", () => {
  beforeEach(() => {
    issueSignedToken.mockClear();
    presignUrl.mockClear();
  });

  it("returns null for a missing URL", async () => {
    expect(await signedMatriculaUrl(null)).toBeNull();
    expect(await signedMatriculaUrl(undefined)).toBeNull();
  });

  it("passes a non-private (legacy public) URL through unchanged", async () => {
    const u = "https://abc123.public.blob.vercel-storage.com/doc.jpg";
    expect(await signedMatriculaUrl(u)).toBe(u);
    expect(issueSignedToken).not.toHaveBeenCalled();
  });

  it("signs a plain-ASCII pathname as-is", async () => {
    await signedMatriculaUrl(`${HOST}/matricula-abc.jpg`);
    expect(issueSignedToken).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "matricula-abc.jpg" }),
    );
  });

  it("signs the DECODED pathname when the filename has spaces/accents", async () => {
    // Real uploads keep the student's original filename ("Juan Pérez López -x1y2.jpg"),
    // which the blob URL percent-encodes. The store knows the blob by its decoded
    // pathname; signing the %20-encoded form yields a signature for a different
    // object and every fetch 403s (admins saw a blanket 502 "No disponible").
    const decoded = "Juan Pérez López -x1y2.jpg";
    const url = `${HOST}/${encodeURIComponent(decoded).replace(/%2F/g, "/")}`;

    const out = await signedMatriculaUrl(url);
    expect(out).toBe("https://store.private.blob.vercel-storage.com/doc?signed=1");
    expect(issueSignedToken).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: decoded }),
    );
    expect(presignUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ pathname: decoded }),
    );
  });

  it("degrades to null (not a throw) on an unparseable private-host URL", async () => {
    expect(
      await signedMatriculaUrl("::broken.private.blob.vercel-storage.com/x.jpg"),
    ).toBeNull();
  });
});
