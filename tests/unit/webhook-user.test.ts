// @vitest-environment node
/**
 * Unit tests for the webhook-user pure helpers (Task 7).
 *
 * webhookUserStrategy — decides which DB path the webhook takes.
 * studentPaidUpdate   — builds the Drizzle `set` object for the student stamp.
 *
 * These are pure functions; no mocks needed.
 */
import { describe, it, expect } from "vitest";
import {
  webhookUserStrategy,
  studentPaidUpdate,
} from "@/lib/inscripcion/webhook-user";

describe("webhookUserStrategy", () => {
  it('returns "stamp-by-id" for student tier with a user_id', () => {
    expect(webhookUserStrategy("student", "u1")).toBe("stamp-by-id");
  });

  it('returns "upsert-by-email" for student tier with null user_id', () => {
    expect(webhookUserStrategy("student", null)).toBe("upsert-by-email");
  });

  it('returns "upsert-by-email" for student tier with undefined user_id', () => {
    expect(webhookUserStrategy("student", undefined)).toBe("upsert-by-email");
  });

  it('returns "upsert-by-email" for student tier with empty string user_id', () => {
    // empty string is falsy → legacy path
    expect(webhookUserStrategy("student", "")).toBe("upsert-by-email");
  });

  it('returns "upsert-by-email" for profesional tier even with a user_id', () => {
    expect(webhookUserStrategy("profesional", "u1")).toBe("upsert-by-email");
  });

  it('returns "upsert-by-email" for profesional tier with no user_id', () => {
    expect(webhookUserStrategy("profesional", null)).toBe("upsert-by-email");
  });
});

describe("studentPaidUpdate", () => {
  const NOW_BEFORE = Date.now();

  const result = studentPaidUpdate({
    stripeCustomerId: "cus_123",
    cohortId: "cohort-2026-q1",
  });

  const NOW_AFTER = Date.now();

  it("includes paidAt as a Date", () => {
    expect(result.paidAt).toBeInstanceOf(Date);
    // Sanity: the date is within the window this test ran
    expect(result.paidAt.getTime()).toBeGreaterThanOrEqual(NOW_BEFORE);
    expect(result.paidAt.getTime()).toBeLessThanOrEqual(NOW_AFTER);
  });

  it("maps stripeCustomerId through", () => {
    expect(result.stripeCustomerId).toBe("cus_123");
  });

  it("maps cohortId through", () => {
    expect(result.cohortId).toBe("cohort-2026-q1");
  });

  it("does NOT include studentVerification", () => {
    expect(result).not.toHaveProperty("studentVerification");
  });

  it("does NOT include verificationDocUrl", () => {
    expect(result).not.toHaveProperty("verificationDocUrl");
  });

  it("does NOT include verificationSubmittedAt", () => {
    expect(result).not.toHaveProperty("verificationSubmittedAt");
  });

  it("does NOT include verifiedAt", () => {
    expect(result).not.toHaveProperty("verifiedAt");
  });

  it("does NOT include rejectedAt", () => {
    expect(result).not.toHaveProperty("rejectedAt");
  });
});
