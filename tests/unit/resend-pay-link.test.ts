import { describe, it, expect } from "vitest";
import { canResendPayLink } from "@/lib/inscripcion/resend-pay-link";

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
