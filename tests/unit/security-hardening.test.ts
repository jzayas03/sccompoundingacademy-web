import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "@/lib/turnstile";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { CSP_DIRECTIVES, CSP_VALUE } from "@/lib/security/csp";

/**
 * CSP regression guards. The Content-Security-Policy is structural hardening,
 * but a too-tight directive silently breaks browser features (the app talks to
 * these hosts via fetch/XHR/iframes). These pin the directives that a browser
 * feature depends on so a future edit can't quietly drop one.
 *
 * The `connect-src` + Blob-host case is a real incident: the matrícula upload
 * (student enrollment) PUTs the photo straight to `*.blob.vercel-storage.com`
 * from the browser. When that host was present in `img-src` but missing from
 * `connect-src`, the upload PUT was CSP-blocked — the same-origin token mint
 * still returned 200, but the form hung forever on "Procesando…" and no
 * enrollment was ever created.
 */
describe("Content-Security-Policy", () => {
  const directive = (name: string): string =>
    CSP_DIRECTIVES.find((d) => d.startsWith(`${name} `)) ?? "";

  it("allows the Vercel Blob host in connect-src (matrícula upload PUT)", () => {
    // Without this the browser blocks the client-upload PUT and student
    // enrollment hangs on "Procesando…".
    expect(directive("connect-src")).toContain(
      "https://*.blob.vercel-storage.com",
    );
  });

  it("keeps the Blob host in img-src too (matrícula preview / OG images)", () => {
    expect(directive("img-src")).toContain(
      "https://*.blob.vercel-storage.com",
    );
  });

  it("allows the Turnstile origin in script-src and connect-src", () => {
    expect(directive("script-src")).toContain(
      "https://challenges.cloudflare.com",
    );
    expect(directive("connect-src")).toContain(
      "https://challenges.cloudflare.com",
    );
  });

  it("keeps the structural lockdowns intact", () => {
    expect(CSP_VALUE).toContain("frame-ancestors 'none'");
    expect(CSP_VALUE).toContain("object-src 'none'");
    expect(CSP_VALUE).toContain("base-uri 'self'");
    expect(directive("form-action")).toContain("https://checkout.stripe.com");
  });
});

/**
 * These guard the most important property of the hardening work: it must
 * degrade GRACEFULLY. With no integration configured, nothing may block a
 * legitimate enrollment. And the CAPTCHA, once configured, must actually
 * reject a missing token.
 */

describe("verifyTurnstile", () => {
  const original = process.env.TURNSTILE_SECRET_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = original;
    vi.restoreAllMocks();
  });

  it("skips verification (success) when no secret key is configured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const res = await verifyTurnstile(undefined);
    expect(res.success).toBe(true);
  });

  it("rejects a missing token when a secret key IS configured", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    const res = await verifyTurnstile("");
    expect(res.success).toBe(false);
    expect(res.errorCodes).toContain("missing-input-response");
  });

  it("fails open if Cloudflare is unreachable", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const res = await verifyTurnstile("some-token", "1.2.3.4");
    expect(res.success).toBe(true);
  });
});

describe("rateLimit", () => {
  it("fails open (allows) when Upstash is not configured", async () => {
    const res = await rateLimit("test", "1.2.3.4", 1, 60);
    expect(res.success).toBe(true);
    expect(res.retryAfterSeconds).toBe(0);
  });
});

describe("clientIp", () => {
  it("takes the first entry of x-forwarded-for", () => {
    const req = new Request("https://x.test", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(clientIp(req)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    const withReal = new Request("https://x.test", {
      headers: { "x-real-ip": "198.51.100.4" },
    });
    expect(clientIp(withReal)).toBe("198.51.100.4");
    expect(clientIp(new Request("https://x.test"))).toBe("unknown");
  });
});
