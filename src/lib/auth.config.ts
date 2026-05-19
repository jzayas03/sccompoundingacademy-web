import type { NextAuthConfig } from "next-auth";

/**
 * Edge-runtime-safe Auth.js config shared between two callers:
 *
 *   1. `src/lib/auth.ts` — the full Node-runtime instance that adds the
 *      Drizzle adapter and the Resend SDK provider. Used by API routes
 *      and server pages.
 *   2. `src/middleware.ts` — runs on Vercel Edge and only needs to
 *      validate the session JWT. Importing the Drizzle adapter or the
 *      Resend SDK in middleware would explode the Edge bundle, so we
 *      keep this file deliberately minimal (no DB, no email SDK, no
 *      Node-only deps).
 *
 * Session strategy is `jwt` so the middleware can decode the cookie
 * locally with `AUTH_SECRET`, no DB round-trip required. The Drizzle
 * adapter (configured in `auth.ts`) still owns user / account /
 * verification-token persistence — JWTs just replace the `sessions`
 * table for cookie-issuance.
 *
 * Providers stay empty here on purpose; the Resend provider lives in
 * `auth.ts` because the magic-link handler runs in Node runtime and
 * imports the Resend SDK + the branded email template.
 */
export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/es/portal/login",
    verifyRequest: "/es/portal/verify",
  },
  providers: [],
} satisfies NextAuthConfig;
