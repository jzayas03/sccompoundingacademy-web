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
 *   - Vercel Blob   → images come from the store host `*.blob.vercel-storage.com`
 *                     (img-src). The matrícula CLIENT upload is different: the
 *                     @vercel/blob SDK PUTs the file to its API base
 *                     `https://vercel.com/api/blob` (`defaultVercelBlobApiUrl`),
 *                     which may then redirect to the store host. So connect-src
 *                     needs BOTH `https://vercel.com` (the write endpoint) and
 *                     the store host (redirect target + multipart part PUTs).
 *                     Missing `vercel.com` is what broke student enrollment: the
 *                     same-origin token mint returned 200 but the upload PUT was
 *                     CSP-blocked → "No pudimos subir tu matrícula" / a hang.
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
const BLOB_STORE_HOST = "https://*.blob.vercel-storage.com";
// The @vercel/blob client SDK's upload endpoint (defaultVercelBlobApiUrl).
// Verified empirically: `upload()` PUTs to `${this}/api/blob/?pathname=…`.
const BLOB_API_HOST = "https://vercel.com";

export const CSP_DIRECTIVES: readonly string[] = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${BLOB_STORE_HOST}`,
  "font-src 'self' data:",
  "frame-src 'self' https://challenges.cloudflare.com https://www.instagram.com https://www.google.com https://maps.google.com",
  "worker-src 'self' blob:",
  // connect-src governs fetch/XHR/beacon — including the matrícula client
  // upload. The SDK PUTs to https://vercel.com/api/blob (BLOB_API_HOST), which
  // can redirect to the store host, and multipart parts go direct to the store.
  // BOTH must be listed or the browser blocks the upload and enrollment fails.
  `connect-src 'self' https://challenges.cloudflare.com ${BLOB_API_HOST} ${BLOB_STORE_HOST}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self' https://checkout.stripe.com",
];

/** The assembled `Content-Security-Policy` header value. */
export const CSP_VALUE: string = CSP_DIRECTIVES.join("; ");
