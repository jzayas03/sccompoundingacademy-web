/**
 * Canonical site URL resolver.
 *
 * The `NEXT_PUBLIC_SITE_URL` env var was originally introduced to let us
 * point dev / preview / prod at different hostnames, but a misconfigured
 * production value (set to the auto-generated `sccompoundingacademy-web.vercel.app`
 * Vercel hostname instead of the custom domain) shipped wrong canonical
 * URLs in `<link rel="canonical">`, OpenGraph tags and JSON-LD on the
 * first post-domain deploy.
 *
 * To keep canonical URLs correct regardless of how the env var is set,
 * we accept the env value only when it is a real custom domain. A
 * `.vercel.app` hostname is treated as "unset" and falls back to the
 * canonical production domain. Local development still uses
 * `http://localhost:3000` so links during `pnpm dev` aren't sent to prod.
 */

const CANONICAL_PRODUCTION_URL = "https://sccompoundingacademy.com";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

  if (raw && !/\.vercel\.app$/i.test(new URL(raw).hostname)) {
    return raw;
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return CANONICAL_PRODUCTION_URL;
}
