import { describe, it, expect } from "vitest";
import {
  resolveVerificationGate,
  type VerificationGateInput,
} from "@/lib/portal/verification-gate";

const base: VerificationGateInput = {
  isOwner: false,
  tier: "student",
  studentVerification: "approved",
};

describe("resolveVerificationGate", () => {
  it("allows an approved student-tier user", () => {
    expect(resolveVerificationGate(base)).toBe("allow");
  });

  it("blocks a pending student-tier user", () => {
    expect(
      resolveVerificationGate({ ...base, studentVerification: "pending" }),
    ).toBe("redirect-verificacion");
  });

  it("blocks a rejected student-tier user (they may re-upload)", () => {
    expect(
      resolveVerificationGate({ ...base, studentVerification: "rejected" }),
    ).toBe("redirect-verificacion");
  });

  it("blocks a student-tier user whose status is still null", () => {
    expect(
      resolveVerificationGate({ ...base, studentVerification: null }),
    ).toBe("redirect-verificacion");
  });

  it("always allows the profesional tier regardless of status", () => {
    expect(
      resolveVerificationGate({ ...base, tier: "profesional", studentVerification: null }),
    ).toBe("allow");
  });

  it("always allows when tier is null (legacy / pre-tier rows)", () => {
    expect(
      resolveVerificationGate({ ...base, tier: null, studentVerification: null }),
    ).toBe("allow");
  });

  it("always allows an owner, even an unverified student", () => {
    expect(
      resolveVerificationGate({
        isOwner: true,
        tier: "student",
        studentVerification: "pending",
      }),
    ).toBe("allow");
  });
});
