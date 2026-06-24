import { describe, expect, it } from "vitest";
import { certPrefix, evaluateEligibility } from "@/lib/certificates";

describe("certPrefix", () => {
  it("uses the bare prefix for the professional program", () => {
    expect(certPrefix("profesional", 2026)).toBe("SCCA-2026-");
  });
  it("uses the EST prefix for the student program", () => {
    expect(certPrefix("student", 2026)).toBe("SCCA-EST-2026-");
  });
  it("keeps the two prefixes disjoint so LIKE numbering never crosses", () => {
    expect("SCCA-EST-2026-001".startsWith("SCCA-2026-")).toBe(false);
  });
});

describe("evaluateEligibility", () => {
  it("requires all three ordinals for the professional tier", () => {
    expect(evaluateEligibility(new Set([1, 2]), "profesional").eligible).toBe(false);
    expect(evaluateEligibility(new Set([1, 2, 3]), "profesional").eligible).toBe(true);
  });
  it("requires only two ordinals for the student tier", () => {
    expect(evaluateEligibility(new Set([1]), "student").eligible).toBe(false);
    expect(evaluateEligibility(new Set([1, 2]), "student").eligible).toBe(true);
  });
  it("reports per-ordinal pass map for the tier's required modules", () => {
    expect(evaluateEligibility(new Set([2]), "student").passedModules).toEqual({
      1: false,
      2: true,
    });
  });
});
