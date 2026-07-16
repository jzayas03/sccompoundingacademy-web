import { describe, expect, it } from "vitest";
import {
  buildConfirmPageUrl,
  parseConfirmTarget,
} from "@/lib/portal/magic-link-confirm";

/**
 * Prefetch-safe magic-link interstitial (see src/lib/portal/magic-link-confirm.ts).
 *
 * Email security scanners (Outlook SafeLinks, corporate filters) follow
 * links in incoming mail and were consuming the single-use Auth.js
 * verification token before the student could click it. The email now
 * links to /{locale}/portal/confirmar, which only redeems the token on an
 * explicit button click. These tests pin down the two pure helpers:
 * the URL swap on the send side and the target validation on the page.
 */

const MAGIC_URL =
  "https://sccompoundingacademy.com/api/auth/callback/resend?callbackUrl=https%3A%2F%2Fsccompoundingacademy.com%2Fes%2Fportal&token=abc123&email=student%40example.com";

describe("buildConfirmPageUrl", () => {
  it("points at the locale-prefixed confirm page on the same origin", () => {
    const confirm = new URL(buildConfirmPageUrl(MAGIC_URL, "es"));
    expect(confirm.origin).toBe("https://sccompoundingacademy.com");
    expect(confirm.pathname).toBe("/es/portal/confirmar");
  });

  it("carries the callback path + query as the target param, never the origin", () => {
    const confirm = new URL(buildConfirmPageUrl(MAGIC_URL, "en"));
    const target = confirm.searchParams.get("target");
    expect(target).toBe(
      "/api/auth/callback/resend?callbackUrl=https%3A%2F%2Fsccompoundingacademy.com%2Fes%2Fportal&token=abc123&email=student%40example.com",
    );
    expect(confirm.pathname).toBe("/en/portal/confirmar");
  });

  it("keeps the magic link's own origin (previews sign in on the preview host)", () => {
    const previewUrl = MAGIC_URL.replace(
      "https://sccompoundingacademy.com",
      "https://sccompoundingacademy-web-git-x.vercel.app",
    );
    const confirm = new URL(buildConfirmPageUrl(previewUrl, "es"));
    expect(confirm.origin).toBe(
      "https://sccompoundingacademy-web-git-x.vercel.app",
    );
  });
});

describe("parseConfirmTarget", () => {
  const VALID_TARGET =
    "/api/auth/callback/resend?callbackUrl=%2Fes%2Fportal&token=abc123&email=x%40y.com";

  it("accepts a same-origin auth callback path and returns it verbatim", () => {
    expect(parseConfirmTarget(VALID_TARGET)).toBe(VALID_TARGET);
  });

  it("rejects absolute URLs (would allow redirecting off-site)", () => {
    expect(
      parseConfirmTarget("https://evil.example/api/auth/callback/resend?token=x"),
    ).toBeNull();
  });

  it("rejects protocol-relative URLs", () => {
    expect(
      parseConfirmTarget("//evil.example/api/auth/callback/resend?token=x"),
    ).toBeNull();
  });

  it("rejects paths outside the auth callback namespace", () => {
    expect(parseConfirmTarget("/es/portal")).toBeNull();
    expect(parseConfirmTarget("/api/portal/modulo/1/pdf")).toBeNull();
  });

  it("rejects path-traversal attempts out of the callback namespace", () => {
    expect(
      parseConfirmTarget("/api/auth/callback/../../../etc/passwd"),
    ).toBeNull();
    expect(parseConfirmTarget("/api/auth/callback/resend/../../signout")).toBeNull();
  });

  it("rejects missing / empty / malformed values", () => {
    expect(parseConfirmTarget(null)).toBeNull();
    expect(parseConfirmTarget(undefined)).toBeNull();
    expect(parseConfirmTarget("")).toBeNull();
    expect(parseConfirmTarget("api/auth/callback/resend")).toBeNull();
  });

  it("round-trips with buildConfirmPageUrl", () => {
    const confirm = new URL(buildConfirmPageUrl(MAGIC_URL, "es"));
    const target = confirm.searchParams.get("target");
    expect(parseConfirmTarget(target)).toBe(
      "/api/auth/callback/resend?callbackUrl=https%3A%2F%2Fsccompoundingacademy.com%2Fes%2Fportal&token=abc123&email=student%40example.com",
    );
  });
});
