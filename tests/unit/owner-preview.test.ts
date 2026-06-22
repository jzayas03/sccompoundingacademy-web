import { describe, expect, it } from "vitest";
import { resolveEffectiveTier, findModule } from "@/lib/curriculum";

describe("resolveEffectiveTier", () => {
  it("lets an owner override to the student portal via preview", () => {
    expect(resolveEffectiveTier({ isOwner: true, userTier: null, preview: "student" })).toBe("student");
  });
  it("lets an owner override to the professional portal via preview", () => {
    expect(resolveEffectiveTier({ isOwner: true, userTier: null, preview: "profesional" })).toBe("profesional");
  });
  it("falls back to the real tier when owner gives no/invalid preview", () => {
    expect(resolveEffectiveTier({ isOwner: true, userTier: null, preview: undefined })).toBeNull();
    expect(resolveEffectiveTier({ isOwner: true, userTier: "profesional", preview: "bogus" })).toBe("profesional");
  });
  it("IGNORES preview for non-owners (security)", () => {
    expect(resolveEffectiveTier({ isOwner: false, userTier: "student", preview: "profesional" })).toBe("student");
    expect(resolveEffectiveTier({ isOwner: false, userTier: "profesional", preview: "student" })).toBe("profesional");
  });
});

describe("findModule", () => {
  it("finds a professional module and reports its owning tier", () => {
    const f = findModule("modulo-2");
    expect(f?.module.ordinal).toBe(2);
    expect(f?.tier).toBe("profesional");
  });
  it("finds a student module and reports its owning tier", () => {
    const f = findModule("usp-800");
    expect(f?.module.ordinal).toBe(2);
    expect(f?.tier).toBe("student");
  });
  it("returns null for an unknown id", () => {
    expect(findModule("nope")).toBeNull();
  });
});
