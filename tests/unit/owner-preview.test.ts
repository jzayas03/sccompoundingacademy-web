import { describe, expect, it } from "vitest";
import { resolveEffectiveTier, findModule, resolveViewableModule } from "@/lib/curriculum";

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

describe("resolveViewableModule", () => {
  it("lets an owner open a student module even with null tier", () => {
    const r = resolveViewableModule({ isOwner: true, userTier: null, id: "usp-795" });
    expect(r?.module.ordinal).toBe(1);
    expect(r?.tier).toBe("student");
  });
  it("lets an owner open a professional module", () => {
    const r = resolveViewableModule({ isOwner: true, userTier: null, id: "modulo-3" });
    expect(r?.tier).toBe("profesional");
  });
  it("blocks a real student from a professional module", () => {
    expect(resolveViewableModule({ isOwner: false, userTier: "student", id: "modulo-1" })).toBeNull();
  });
  it("resolves a student's own module with the student owning tier", () => {
    const r = resolveViewableModule({ isOwner: false, userTier: "student", id: "usp-800" });
    expect(r?.tier).toBe("student");
  });
});
