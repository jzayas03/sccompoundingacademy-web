/**
 * Content-Security-Policy for the whole site — the single source of truth,
 * imported by `next.config.ts` (to emit the header) and guarded by
 * `tests/unit/security-hardening.test.ts` (so a directive can't silently
 * regress and break a browser feature again).
 *
 * Enumerated from what the app actually loads/talks-to in the browser:
 *   - Turnstile     → script + iframe on challenges.cloudflare.com
 *   - Instagram     → the instructor reel <iframe> (VideoIntro)
 *   - Google Maps   → the location <iframe> (Ubicacion / HomeContact)
 *   - Vercel Blob   → OG/other images (img-src) AND the matrícula upload PUT
 *                     (connect-src) — the client-upload SDK fetches the file
 *                     straight to `*.blob.vercel-storage.com`, so BOTH
 *                     directives need the host. Omitting it from connect-src
 *                     is what silently hung student enrollment on
 *                     "Procesando…" (the upload PUT was CSP-blocked while the
 *                     same-origin token mint still succeeded).
 *   - pdf.js        → a blob: web worker for the module PDF viewer
 *   - Stripe        → checkout is a top-level redirect (no embedded stripe.js),
 *                     so only form-action needs it
 *
 * `'unsafe-inline'`/`'unsafe-eval'` on script-src are kept because Next.js
 * ships inline hydration scripts (no nonce pipeline here) and pdf.js needs
 * eval; the real value of this policy is the structural hardening —
 * `frame-ancestors 'none'` (clickjacking), `object-src 'none'` (no plugins),
 * `base-uri 'self'` (no <base> injection), and a locked `form-action`.
 *
 * Note on the Blob host wildcard: `*.blob.vercel-storage.com` matches
 * multi-level subdomains, so it covers BOTH the public host
 * (`<id>.public.blob.vercel-storage.com`) and the private one the matrícula
 * store uses (`<id>.private.blob.vercel-storage.com`).
 */
const BLOB_HOST = "https://*.blob.vercel-storage.com";

export const CSP_DIRECTIVES: readonly string[] = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${BLOB_HOST}`,
  "font-src 'self' data:",
  "frame-src 'self' https://challenges.cloudflare.com https://www.instagram.com https://www.google.com https://maps.google.com",
  "worker-src 'self' blob:",
  // connect-src governs fetch/XHR/beacon — including the matrícula client
  // upload's PUT to the Blob store. It MUST list the Blob host or the browser
  // blocks the upload and the enrollment form hangs forever on "Procesando…".
  `connect-src 'self' https://challenges.cloudflare.com ${BLOB_HOST}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self' https://checkout.stripe.com",
];

/** The assembled `Content-Security-Policy` header value. */
export const CSP_VALUE: string = CSP_DIRECTIVES.join("; ");
