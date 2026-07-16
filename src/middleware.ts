import { NextResponse, type NextRequest } from "next/server";
import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { authConfig } from "@/lib/auth.config";
import { routing } from "@/i18n/routing";

/**
 * Combined middleware: next-intl locale routing + Auth.js session gating.
 *
 * Runs on Vercel Edge so we use the trimmed `authConfig` (no Drizzle
 * adapter, no Resend SDK). All it does is validate the session JWT
 * cookie — sufficient to gate authenticated routes; per-route payment
 * status is enforced at the page level where DB queries are cheap.
 *
 * Gated requests: `/[locale]/portal/...` — every portal page except login
 * and verify (public). Per-route payment status is enforced at the page
 * level (and, for the course-material bytes, by the authenticated
 * `/api/portal/modulo/[id]/pdf` route — the PDFs no longer live under
 * `/public`, so there is nothing statically served to gate here).
 *
 * Anything that does not match falls through to the next-intl middleware,
 * which handles locale prefixing for the marketing site.
 */

const { auth: authCheck } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

function isPublicPortalPath(pathname: string): boolean {
  return (
    pathname.endsWith("/portal/login") ||
    pathname.endsWith("/portal/verify") ||
    // Magic-link interstitial — reached from the email, before a session
    // exists (see lib/portal/magic-link-confirm.ts).
    pathname.endsWith("/portal/confirmar")
  );
}

function requiresSession(pathname: string): boolean {
  // /es/portal/*, /en/portal/* — but not /portal/login or /portal/verify.
  return (
    /^\/(es|en)\/portal(\/|$)/.test(pathname) && !isPublicPortalPath(pathname)
  );
}

export default authCheck((req) => {
  const { pathname } = req.nextUrl;

  if (requiresSession(pathname) && !req.auth) {
    // Preserve the user's chosen locale across the auth bounce.
    const locale = pathname.startsWith("/en/") ? "en" : "es";
    return NextResponse.redirect(new URL(`/${locale}/portal/login`, req.url));
  }

  // Everything else: hand off to next-intl for locale resolution.
  return intlMiddleware(req as unknown as NextRequest);
});

export const config = {
  matcher: [
    // Locale-prefixed pages. Excludes /api, /_next, /_vercel, /verificar
    // (public certificate verification — keeps the cert URL clean of any
    // locale prefix), and any path with a file extension.
    "/((?!api|_next|_vercel|verificar|.*\\..*).*)",
  ],
};
