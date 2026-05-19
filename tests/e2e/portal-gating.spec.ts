import { test, expect } from "@playwright/test";

/**
 * Middleware gating contract for the portal namespace.
 *
 * Verifies that unauthenticated requests to gated routes return a 307
 * pointing at the magic-link sign-in page, while public surfaces
 * (`/portal/login`, `/portal/verify`, `/verificar/*`) stay reachable.
 *
 * We disable redirect-following on the request fixture (`maxRedirects: 0`)
 * so Playwright surfaces the 307 itself instead of silently chasing it
 * — otherwise a passing test wouldn't actually prove gating works.
 */
test.describe("Portal middleware gating", () => {
  const GATED_ROUTES = [
    "/es/portal",
    "/es/portal/certificado",
    "/es/portal/rese%C3%B1as",
    "/es/portal/modulos/modulo-1",
    "/es/portal/modulos/modulo-1/post-test",
    "/es/portal/modulos/modulo-1/post-test/resultados",
    // Direct PDF requests are gated separately by the second matcher entry.
    "/modulos/dia-1.pdf",
  ];

  for (const route of GATED_ROUTES) {
    test(`anonymous GET ${route} → 307 to /es/portal/login`, async ({
      request,
    }) => {
      const res = await request.get(route, { maxRedirects: 0 });
      expect(res.status()).toBe(307);
      expect(res.headers().location).toContain("/es/portal/login");
    });
  }

  test("/es/portal/login is publicly reachable", async ({ request }) => {
    const res = await request.get("/es/portal/login", { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });

  test("/es/portal/verify is publicly reachable", async ({ request }) => {
    const res = await request.get("/es/portal/verify", { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });

  test("Auth.js handler is registered (CSRF endpoint responds)", async ({
    request,
  }) => {
    const res = await request.get("/api/auth/csrf");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.csrfToken).toBe("string");
    expect(body.csrfToken.length).toBeGreaterThan(16);
  });
});
