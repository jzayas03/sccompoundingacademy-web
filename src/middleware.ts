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
 * Two classes of requests are gated:
 *
 *   1. `/[locale]/portal/...`        — every portal page except login
 *                                      and verify (public).
 *   2. `/modulos/dia-{1,2,3}.pdf`    — the module PDFs themselves; the
 *                                      page-level paidAt gate stops
 *                                      authenticated-but-unpaid users
 *                                      from discovering the URL through
 *                                      the dashboard, and this Edge
 *                                      check stops anonymous direct
 *                                      access.
 *
 * Anything that does not match those rules falls through to the next-intl
 * middleware, which handles locale prefixing for the marketing site.
 */

const { auth: authCheck } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

function isPublicPortalPath(pathname: string): boolean {
  return (
    pathname.endsWith("/portal/login") ||
    pathname.endsWith("/portal/verify")
  );
}

function requiresSession(pathname: string): boolean {
  // /es/portal/*, /en/portal/* — but not /portal/login or /portal/verify.
  if (/^\/(es|en)\/portal(\/|$)/.test(pathname) && !isPublicPortalPath(pathname)) {
    return true;
  }
  // Module PDFs served from /public/modulos/ — block anonymous direct hits.
  if (pathname.startsWith("/modulos/")) {
    return true;
  }
  return false;
}

export default authCheck((req) => {
  const { pathname } = req.nextUrl;

  if (requiresSession(pathname) && !req.auth) {
    return NextResponse.redirect(new URL("/es/portal/login", req.url));
  }

  // PDF requests skip i18n routing entirely (no locale prefix needed).
  if (pathname.startsWith("/modulos/")) {
    return NextResponse.next();
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
    // Module PDFs — extension match so the previous pattern misses them.
    "/modulos/:path*",
  ],
};
