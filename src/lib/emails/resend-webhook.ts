import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Inbound Resend webhook helpers (delivery-problem visibility).
 *
 * Resend signs webhook deliveries with the Svix scheme: HMAC-SHA256 over
 * `${svix-id}.${svix-timestamp}.${raw body}`, keyed with the
 * base64-decoded portion of the `whsec_…` endpoint secret, sent base64 in
 * the `svix-signature` header as one or more space-separated `v1,<sig>`
 * entries. Verified by hand here (Node runtime only) — ~20 lines beats
 * pulling in the svix package for a single consumer.
 */

/** Reject deliveries whose timestamp strays past this window (replay guard). */
const TOLERANCE_SECONDS = 5 * 60;

export function verifyResendWebhook(params: {
  secret: string;
  svixId: string;
  svixTimestamp: string;
  svixSignature: string;
  payload: string;
  /** Injectable clock for tests; defaults to the real time. */
  nowMs?: number;
}): boolean {
  const { secret, svixId, svixTimestamp, svixSignature, payload } = params;

  if (!secret.startsWith("whsec_")) return false;
  const key = Buffer.from(secret.slice("whsec_".length), "base64");
  if (key.length === 0) return false;

  const timestamp = Number(svixTimestamp);
  if (!Number.isFinite(timestamp)) return false;
  const nowSeconds = (params.nowMs ?? Date.now()) / 1000;
  if (Math.abs(nowSeconds - timestamp) > TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", key)
    .update(`${svixId}.${svixTimestamp}.${payload}`)
    .digest();

  return svixSignature.split(" ").some((entry) => {
    const [version, sig] = entry.split(",", 2);
    if (version !== "v1" || !sig) return false;
    const candidate = Buffer.from(sig, "base64");
    return (
      candidate.length === expected.length &&
      timingSafeEqual(candidate, expected)
    );
  });
}

/**
 * Event types worth persisting: the ones that mean "this address is not
 * receiving mail". Deliveries/opens are noise at our volume, and
 * delivery_delayed is transient greylisting that usually resolves itself.
 */
const PROBLEM_EVENT_TYPES = new Set([
  "email.bounced",
  "email.complained",
  "email.failed",
]);

export type EmailProblemEvent = {
  type: string;
  recipient: string;
  subject: string | null;
};

/** Parse a raw webhook body into a problem event, or null if untracked/malformed. */
export function parseEmailEvent(payload: string): EmailProblemEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const event = parsed as {
    type?: unknown;
    data?: { to?: unknown; subject?: unknown };
  };
  if (typeof event.type !== "string" || !PROBLEM_EVENT_TYPES.has(event.type)) {
    return null;
  }
  const to = Array.isArray(event.data?.to) ? event.data.to[0] : null;
  if (typeof to !== "string" || !to) return null;
  return {
    type: event.type,
    recipient: to,
    subject: typeof event.data?.subject === "string" ? event.data.subject : null,
  };
}
