import { describe, expect, it, vi } from "vitest";

// The route now imports notifyMatriculaReview (server-only) and db; mock
// those transitive dependencies so the pure checkoutIdempotencyKey function
// can be exercised without a server-side or DB context.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/portal/notify-matricula-review", () => ({
  notifyMatriculaReview: vi.fn(),
}));
vi.mock("@/lib/stripe", () => ({
  stripe: () => ({ checkout: { sessions: { create: vi.fn() } } }),
}));

import { checkoutIdempotencyKey } from "@/app/api/inscripcion/route";

/**
 * Regression test for the intermittent "No se pudo iniciar el cobro" bug.
 *
 * Root cause: the Stripe idempotency key was stable across submissions
 * (email+course+cohort+tier+locale only) while the request body it was used
 * with varied per request (acepto_timestamp = new Date(), plus ip / user
 * agent). Stripe rejects a reused key with differing parameters, so the
 * FIRST enrollment for a given combo succeeded and every RETRY within 24h
 * failed. The key must therefore incorporate the volatile `acceptedAt`.
 */

const base = {
  email: "Student@Example.com",
  cursoId: "basic-compounding",
  cohorteId: "cohort_123",
  tier: "profesional",
  locale: "es",
  acceptedAt: "2026-06-09T16:00:00.000Z",
};

describe("checkoutIdempotencyKey", () => {
  it("produces an identical key for an identical request (safe network-retry dedup)", () => {
    expect(checkoutIdempotencyKey(base)).toBe(checkoutIdempotencyKey({ ...base }));
  });

  it("produces a DIFFERENT key when only acceptedAt differs (the bug)", () => {
    const first = checkoutIdempotencyKey(base);
    const retry = checkoutIdempotencyKey({
      ...base,
      acceptedAt: "2026-06-09T16:05:00.000Z",
    });
    // If these collided, Stripe would reject the retry — the original bug.
    expect(retry).not.toBe(first);
  });

  it("normalizes email case and whitespace so it isn't a hidden key axis", () => {
    expect(checkoutIdempotencyKey(base)).toBe(
      checkoutIdempotencyKey({ ...base, email: "  student@example.com  " }),
    );
  });

  it("varies by tier so profesional and student attempts never collide", () => {
    expect(checkoutIdempotencyKey(base)).not.toBe(
      checkoutIdempotencyKey({ ...base, tier: "student" }),
    );
  });
});
