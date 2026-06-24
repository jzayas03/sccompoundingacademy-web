// @vitest-environment node
import { beforeAll, describe, it, expect } from "vitest";
import {
  signVerificationDecision,
  verifyVerificationDecision,
} from "@/lib/portal/verification-token";

// The HMAC key. Set before importing-time calls run (functions read it lazily).
beforeAll(() => {
  process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-secret-rotate-me";
});

const payload = {
  userId: "user_abc123",
  decision: "approved" as const,
  submittedAt: 1_719_000_000_000,
};

describe("verification-token", () => {
  it("round-trips a valid token", () => {
    const token = signVerificationDecision(payload);
    expect(verifyVerificationDecision(token)).toEqual(payload);
  });

  it("rejects a payload tampered after signing", () => {
    const sig = signVerificationDecision(payload).split(".")[1];
    const forgedBody = Buffer.from(
      JSON.stringify({ ...payload, decision: "rejected" }),
    ).toString("base64url");
    expect(verifyVerificationDecision(`${forgedBody}.${sig}`)).toBeNull();
  });

  it("rejects a bad signature", () => {
    const body = signVerificationDecision(payload).split(".")[0];
    expect(verifyVerificationDecision(`${body}.AAAAAAAA`)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyVerificationDecision("garbage")).toBeNull();
    expect(verifyVerificationDecision("")).toBeNull();
    expect(verifyVerificationDecision(".")).toBeNull();
  });
});
