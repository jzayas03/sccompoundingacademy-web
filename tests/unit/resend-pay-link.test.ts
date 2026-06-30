// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { canResendPayLink, mintResendCheckoutToken } from "@/lib/inscripcion/resend-pay-link";
import { verifyCheckoutToken } from "@/lib/portal/verification-token";

beforeAll(() => {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret-rotate-me";
});

const APPROVED_AT = new Date("2026-06-28T10:00:00Z");

describe("canResendPayLink", () => {
  it("returns true when all conditions are met", () => {
    expect(
      canResendPayLink({
        paidAt: null,
        studentVerification: "approved",
        verifiedAt: APPROVED_AT,
        cohortOpen: true,
      }),
    ).toBe(true);
  });

  it("returns false when student has already paid", () => {
    expect(
      canResendPayLink({
        paidAt: new Date(),
        studentVerification: "approved",
        verifiedAt: APPROVED_AT,
        cohortOpen: true,
      }),
    ).toBe(false);
  });

  it("returns false when studentVerification is pending", () => {
    expect(
      canResendPayLink({
        paidAt: null,
        studentVerification: "pending",
        verifiedAt: APPROVED_AT,
        cohortOpen: true,
      }),
    ).toBe(false);
  });

  it("returns false when studentVerification is rejected", () => {
    expect(
      canResendPayLink({
        paidAt: null,
        studentVerification: "rejected",
        verifiedAt: APPROVED_AT,
        cohortOpen: true,
      }),
    ).toBe(false);
  });

  it("returns false when studentVerification is null", () => {
    expect(
      canResendPayLink({
        paidAt: null,
        studentVerification: null,
        verifiedAt: APPROVED_AT,
        cohortOpen: true,
      }),
    ).toBe(false);
  });

  it("returns false when verifiedAt is null (approval timestamp missing)", () => {
    expect(
      canResendPayLink({
        paidAt: null,
        studentVerification: "approved",
        verifiedAt: null,
        cohortOpen: true,
      }),
    ).toBe(false);
  });

  it("returns false when cohort is closed for enrollment", () => {
    expect(
      canResendPayLink({
        paidAt: null,
        studentVerification: "approved",
        verifiedAt: APPROVED_AT,
        cohortOpen: false,
      }),
    ).toBe(false);
  });
});

describe("mintResendCheckoutToken (C-2 fix)", () => {
  it("mints a token whose approvedAt is within the last 2 seconds (fresh window)", () => {
    // C-2: the resend route previously signed with row.verifiedAt (already >48h old),
    // causing /pagar to immediately bounce the resent link as expired — a loop.
    // mintResendCheckoutToken must use Date.now() so the new token is fresh.
    const before = Date.now();
    const token = mintResendCheckoutToken("u-resend-1");
    const after = Date.now();

    const payload = verifyCheckoutToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe("u-resend-1");
    // approvedAt must be NOW-ish, not a stale past timestamp.
    expect(payload!.approvedAt).toBeGreaterThanOrEqual(before);
    expect(payload!.approvedAt).toBeLessThanOrEqual(after);
  });

  it("does NOT encode a >48h-old approvedAt (which would immediately expire)", () => {
    // If approvedAt were taken from a 3-day-old verifiedAt the /pagar
    // freshness check (now - approvedAt > 48h) would reject it instantly.
    const staleVerifiedAt = Date.now() - 3 * 24 * 60 * 60 * 1000; // 3 days ago
    const token = mintResendCheckoutToken("u-resend-2");
    const payload = verifyCheckoutToken(token);
    // Fresh token's approvedAt must be far newer than the stale timestamp.
    expect(payload!.approvedAt).toBeGreaterThan(staleVerifiedAt);
  });
});
