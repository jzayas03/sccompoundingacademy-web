import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { warnUnconfigured } from "@/lib/abuse-shield-warn";

/**
 * Shared, distributed rate limiter backed by Upstash Redis.
 *
 * WHY Upstash (and not the in-memory Map the contact route used to have):
 * Vercel runs each request on an ephemeral, possibly-fresh function
 * instance. An in-memory counter therefore resets on every cold start and
 * is NOT shared across the many instances Vercel spins up under load — so a
 * bot hitting from one IP sails past a per-process limit. A central Redis
 * store gives every instance the same view of "how many times has this IP
 * hit us in the last minute", which is the only way a limit actually holds.
 *
 * WHY a SEPARATE store from our Neon Postgres: one of the goals here is
 * resilience ("evitar futuras caídas"). If rate limiting lived in the same
 * DB the app uses, a DB outage would take the limiter down with it — and it
 * would add write load to the DB on every request. Upstash is an
 * independent service, so the abuse shield stays up even if Postgres is
 * having a bad day.
 *
 * GRACEFUL DEGRADATION: if the Upstash env vars are absent (e.g. local dev,
 * or before the owner provisions the integration), `limit()` returns
 * "allowed" for everything. Deploying this code therefore NEVER blocks a
 * real enrollment — the protection simply switches on the moment the two
 * env vars exist. This mirrors how Stripe/Airtable/Resend already degrade
 * in this codebase.
 *
 * Provision via Vercel → Marketplace → Upstash (Redis). The integration
 * auto-injects UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */

type Decision = {
  /** True when the request is within the allowance and may proceed. */
  success: boolean;
  /** Seconds until the window resets — surfaced as a `Retry-After` header. */
  retryAfterSeconds: number;
};

// One Redis client + a small cache of limiters keyed by their config, built
// lazily on first use. Returns null when Upstash is not configured.
let _redis: Redis | null | undefined;
const _limiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn(
      "[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN missing — rate limiting disabled (requests pass through).",
    );
    _redis = null;
    return null;
  }
  _redis = new Redis({ url, token });
  return _redis;
}

/**
 * Check (and consume) one token for `identifier` under a named limit.
 *
 * @param name    Logical bucket name, e.g. "inscripcion" — keeps the
 *                enrollment limit independent from the contact-form limit.
 * @param identifier  Usually the client IP. Falls back to "unknown" upstream.
 * @param limit   Max requests allowed within `windowSeconds`.
 * @param windowSeconds  Sliding-window length.
 */
export async function rateLimit(
  name: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<Decision> {
  const redis = getRedis();
  if (!redis) {
    // Fail OPEN: no Upstash configured → don't block legitimate users. But
    // in PRODUCTION an absent limiter means the abuse shield is silently
    // OFF, which is a deploy misconfiguration — surface it loudly (once per
    // instance, so it can't spam) instead of failing open in silence.
    warnUnconfigured(
      "ratelimit",
      "Upstash env vars absent — all rate limits are OFF. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.",
    );
    return { success: true, retryAfterSeconds: 0 };
  }

  const key = `${name}:${limit}:${windowSeconds}`;
  let limiter = _limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      // Sliding window is the most accurate of Upstash's algorithms for
      // small limits — no burst at window boundaries the way fixed windows
      // allow. `prefix` namespaces our keys inside the shared Redis.
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `scca:rl:${name}`,
      analytics: false,
    });
    _limiters.set(key, limiter);
  }

  try {
    const res = await limiter.limit(identifier);
    const retryAfterSeconds = Math.max(
      0,
      Math.ceil((res.reset - Date.now()) / 1000),
    );
    return { success: res.success, retryAfterSeconds };
  } catch (err) {
    // If Redis itself errors, fail OPEN — a flaky limiter must never become
    // the reason a paying student can't enroll.
    console.error("[ratelimit] Upstash error — allowing request", err);
    return { success: true, retryAfterSeconds: 0 };
  }
}

/**
 * Extract the best-effort client IP from a request's proxy headers.
 * Vercel sets `x-forwarded-for`; the first entry is the real client.
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
