import { describe, it, expect } from "vitest";
import { initialVerificationFor } from "@/lib/portal/initial-verification";

describe("initialVerificationFor", () => {
  it("makes a student-tier enrollee pending verification", () => {
    expect(initialVerificationFor("student")).toBe("pending");
  });

  it("leaves the profesional tier with no verification requirement", () => {
    expect(initialVerificationFor("profesional")).toBeNull();
  });
});
