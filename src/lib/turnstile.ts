/**
 * Cloudflare Turnstile — server-side token verification.
 *
 * Turnstile is a free, privacy-friendly CAPTCHA alternative. The browser
 * widget (rendered in the inscription form) produces a one-time token; this
 * function calls Cloudflare's siteverify endpoint to confirm the token is
 * genuine, unexpired, and unused. A bot that POSTs straight to
 * /api/inscripcion without solving the challenge has no valid token and is
 * rejected before any Stripe Checkout Session is created.
 *
 * GRACEFUL DEGRADATION: if TURNSTILE_SECRET_KEY is not set, verification is
 * SKIPPED (returns success). This keeps local dev and the pre-setup
 * production state working — the protection activates the moment the secret
 * is configured (and the public site key is wired into the form). Mirrors
 * the rest of this codebase's "boots without the integration" philosophy.
 *
 * Setup: https://dash.cloudflare.com → Turnstile → add a widget for the
 * apex domain → copy the Site Key (public, NEXT_PUBLIC_TURNSTILE_SITE_KEY)
 * and Secret Key (TURNSTILE_SECRET_KEY, server-only).
 */

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type VerifyResult = {
  /** True when the token is valid OR Turnstile is not configured (skip). */
  success: boolean;
  /** Present only on a real failure — for server-side logging. */
  errorCodes?: string[];
};

export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string,
): Promise<VerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Not configured → skip the gate so enrollment keeps working.
    return { success: true };
  }

  // Configured but the client sent no token → a bot, or the widget failed
  // to load. Reject.
  if (!token) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      // Don't let a slow Cloudflare response hang the enrollment request.
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    return data.success
      ? { success: true }
      : { success: false, errorCodes: data["error-codes"] };
  } catch (err) {
    // If Cloudflare is unreachable, fail OPEN: a Turnstile outage must not
    // block paying students. (The IP rate limit still applies as a backstop.)
    console.error("[turnstile] verification request failed — allowing", err);
    return { success: true };
  }
}
