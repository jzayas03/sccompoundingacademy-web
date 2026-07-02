import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
// CSP lives in its own module so it can be unit-tested (regression guard) and
// stays the single source of truth. See src/lib/security/csp.ts.
import { CSP_VALUE } from "./src/lib/security/csp";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const csp = CSP_VALUE;

const securityHeaders = [
  // Belt-and-suspenders with `frame-ancestors 'none'` above — covers older
  // browsers that ignore CSP frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  // Stop MIME sniffing (a served file can't be coerced into executable JS).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs (which can carry tokens) to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deny powerful browser features the site never uses.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Force HTTPS for two years incl. subdomains (Vercel already sends HSTS;
  // this pins our own strong value + preload eligibility).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // The paid course PDFs live outside /public (in private/modulos/), so
  // Next won't include them in the serverless bundle unless we trace them
  // into the functions that read them from disk: the authenticated stream
  // route and the module page's existence check.
  outputFileTracingIncludes: {
    "/api/portal/modulo/[id]/pdf": ["./private/modulos/**"],
    // Both variants — depending on Next's version the route-group segment
    // may or may not appear in the tracing key; extra keys are harmless.
    "/[locale]/(portal)/portal/modulos/[id]": ["./private/modulos/**"],
    "/[locale]/portal/modulos/[id]": ["./private/modulos/**"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
