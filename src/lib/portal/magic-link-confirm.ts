/**
 * Prefetch-safe magic-link interstitial helpers.
 *
 * Email security scanners (Outlook SafeLinks, corporate mail filters)
 * follow links inside incoming mail. The Auth.js magic link is a
 * single-use token, so a scanner GET consumed it before the student
 * could click — the student then hit a "Verification" error (or found
 * the email in quarantine with a dead link). Production logs show the
 * scanner signature clearly: `HEAD /api/auth/callback/resend 400`
 * followed within the same second by a `GET` that burns the token.
 *
 * The email therefore no longer links to the callback directly. It
 * links to `/{locale}/portal/confirmar`, which renders a button and only
 * navigates to the callback on an explicit click (no `<a href>` for a
 * crawler to follow, no auto-redirect for a headless scanner to trigger).
 *
 * The interstitial URL carries the callback as `target` = path + query
 * only — never a full origin — so the confirm page can navigate
 * relative to its own host. That keeps preview deployments working
 * (each host signs in on itself) and makes off-site redirects
 * impossible by construction.
 */

/** Path prefix every redeemable target must live under. */
const CALLBACK_PREFIX = "/api/auth/callback/";

/**
 * Swap the raw Auth.js magic-link URL for the interstitial confirm-page
 * URL that goes into the email. Same origin as the magic link, locale
 * from the originating page.
 */
export function buildConfirmPageUrl(
  magicLinkUrl: string,
  locale: "es" | "en",
): string {
  const magicLink = new URL(magicLinkUrl);
  const confirm = new URL(`/${locale}/portal/confirmar`, magicLink.origin);
  confirm.searchParams.set("target", magicLink.pathname + magicLink.search);
  return confirm.toString();
}

/**
 * Validate the `target` query param on the confirm page. Returns the
 * target verbatim when it is a same-origin auth-callback path, or null
 * for anything else (absolute URLs, protocol-relative `//host` values,
 * paths outside the callback namespace, traversal attempts).
 */
export function parseConfirmTarget(
  raw: string | null | undefined,
): string | null {
  if (!raw || !raw.startsWith(CALLBACK_PREFIX)) {
    return null;
  }
  // `//host/...` is protocol-relative (off-site); excluded by the prefix
  // check above. Normalize through URL to catch `..` segments that would
  // escape the callback namespace after browser normalization.
  const normalized = new URL(raw, "http://localhost");
  if (!normalized.pathname.startsWith(CALLBACK_PREFIX)) {
    return null;
  }
  return raw;
}
