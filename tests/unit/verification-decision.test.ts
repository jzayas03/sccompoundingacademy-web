import { describe, it, expect } from "vitest";
import { verificationDecisionPatch } from "@/lib/portal/verification-decision";

describe("verificationDecisionPatch", () => {
  it("approves: status approved, verifiedAt set, doc cleared", () => {
    const now = new Date("2026-06-02T12:00:00Z");
    expect(verificationDecisionPatch("approved", now)).toEqual({
      studentVerification: "approved",
      verifiedAt: now,
      rejectedAt: null,
      verificationDocUrl: null,
    });
  });

  it("rejects: status rejected, rejectedAt set, doc cleared", () => {
    const now = new Date("2026-06-02T12:00:00Z");
    expect(verificationDecisionPatch("rejected", now)).toEqual({
      studentVerification: "rejected",
      verifiedAt: null,
      rejectedAt: now,
      verificationDocUrl: null,
    });
  });
});
