import { describe, expect, it } from "vitest";
import { certPrefix, evaluateEligibility, programFor, certAwardsCeus } from "@/lib/certificates";

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

describe("programFor", () => {
  it("maps professional pharmacists/techs to the CE program", () => {
    expect(programFor("profesional", "farmaceutico")).toBe("profesional");
    expect(programFor("profesional", "tecnico")).toBe("profesional");
  });
  it("maps professional non-pharmacy to the completion program", () => {
    expect(programFor("profesional", "medico")).toBe("profesional-completion");
    expect(programFor("profesional", null)).toBe("profesional-completion");
  });
  it("maps the student tier to the student program", () => {
    expect(programFor("student", null)).toBe("student");
  });
});

describe("certAwardsCeus", () => {
  it("awards CEUs only for the CE professional program", () => {
    expect(certAwardsCeus("profesional")).toBe(true);
    expect(certAwardsCeus("profesional-completion")).toBe(false);
    expect(certAwardsCeus("student")).toBe(false);
  });
});

describe("certPrefix (completion)", () => {
  it("uses SCCA-COMP- for the professional completion program", () => {
    expect(certPrefix("profesional-completion", 2026)).toBe("SCCA-COMP-2026-");
  });
  it("keeps COMP disjoint from the CE prefix", () => {
    expect("SCCA-COMP-2026-001".startsWith("SCCA-2026-")).toBe(false);
    expect("SCCA-2026-001".startsWith("SCCA-COMP-2026-")).toBe(false);
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
