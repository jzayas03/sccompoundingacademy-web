import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config.
 *
 * The webServer block boots `pnpm dev` and waits for the URL to respond
 * before running the tests. The `env` map injects test-only values for
 * the Auth.js + Stripe configuration so portal pages can render without
 * the production secrets being on disk:
 *
 *   - `AUTH_SECRET` — Auth.js refuses to start without one. We pass a
 *     deterministic dummy 32+ char string; sessions issued during tests
 *     are valid only for that test run.
 *   - DATABASE_URL is left unset so the placeholder URL in lib/db kicks
 *     in. Tests that touch the DB (e.g. /verificar with a real cert)
 *     are skipped — we only assert render+routing here.
 *
 * Everything else (Stripe, Resend) stays unset; the request-time guards
 * in those routes return 503/500 cleanly without breaking the page tree.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      AUTH_SECRET:
        process.env.AUTH_SECRET ??
        "playwright-test-secret-do-not-use-in-prod-32chars",
      AUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    },
  },
});
