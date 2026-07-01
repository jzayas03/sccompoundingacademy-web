import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Content-Security-Policy for the whole site. Enumerated from what the app
 * actually loads in the browser:
 *   - Turnstile   → script + iframe on challenges.cloudflare.com
 *   - Instagram   → the instructor reel <iframe> (VideoIntro)
 *   - Google Maps → the location <iframe> (Ubicacion / HomeContact)
 *   - Vercel Blob → OG/other images
 *   - pdf.js      → a blob: web worker for the module PDF viewer
 *   - Stripe      → checkout is a top-level redirect (no embedded stripe.js),
 *                   so only form-action needs it
 *
 * `'unsafe-inline'`/`'unsafe-eval'` on script-src are kept because Next.js
 * ships inline hydration scripts (no nonce pipeline here) and pdf.js needs
 * eval; the real value of this policy is the structural hardening —
 * `frame-ancestors 'none'` (clickjacking), `object-src 'none'` (no plugins),
 * `base-uri 'self'` (no <base> injection), and a locked `form-action`.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.blob.vercel-storage.com",
  "font-src 'self' data:",
  "frame-src 'self' https://challenges.cloudflare.com https://www.instagram.com https://www.google.com https://maps.google.com",
  "worker-src 'self' blob:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self' https://checkout.stripe.com",
].join("; ");

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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
