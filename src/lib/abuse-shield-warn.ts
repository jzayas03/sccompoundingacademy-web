// One-time-per-instance alert that an abuse shield (rate limiter, CAPTCHA)
// is UNCONFIGURED in production and therefore silently failing open. In dev
// and preview that's expected (the integrations may not be wired), so the
// warning is gated on VERCEL_ENV=production; the `warned` set bounds it to a
// single log line per serverless instance so it can never spam the logs.
//
// This does NOT change the fail-open behavior (a flaky/absent shield must
// never block a paying enrollment) — it only makes the "shield is OFF"
// state observable in the Vercel logs instead of silent.
const warned = new Set<string>();

export function warnUnconfigured(shield: string, detail: string): void {
  if (process.env.VERCEL_ENV !== "production") return;
  if (warned.has(shield)) return;
  warned.add(shield);
  console.error(
    `[${shield}] MISCONFIGURED IN PRODUCTION — ${detail} (abuse shield failing OPEN)`,
  );
}
