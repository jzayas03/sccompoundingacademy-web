import { describe, it, expect } from "vitest";
import { isPharmacyRole, isCeEligible as isCeEligibleCore } from "@/lib/professions";
import { isCeEligible } from "@/lib/certificates";

describe("isPharmacyRole", () => {
  it("is true only for pharmacist and technician codes", () => {
    expect(isPharmacyRole("farmaceutico")).toBe(true);
    expect(isPharmacyRole("tecnico")).toBe(true);
  });
  it("is false for every other value incl. null/empty/free text", () => {
    for (const v of [null, undefined, "", "otro", "medico", "enfermero", "Quimico"]) {
      expect(isPharmacyRole(v)).toBe(false);
    }
  });
});

describe("isCeEligible", () => {
  it("is true only for professional-tier pharmacists/techs", () => {
    expect(isCeEligible("profesional", "farmaceutico")).toBe(true);
    expect(isCeEligible("profesional", "tecnico")).toBe(true);
  });
  it("is true unconditionally for the legacy pharmacist tier", () => {
    expect(isCeEligible("pharmacist", null)).toBe(true);
    expect(isCeEligible("pharmacist", "medico")).toBe(true);
  });
  it("is false for professional non-pharmacy, student, and null tier", () => {
    expect(isCeEligible("profesional", "medico")).toBe(false);
    expect(isCeEligible("profesional", null)).toBe(false);
    expect(isCeEligible("student", "farmaceutico")).toBe(false);
    expect(isCeEligible(null, "farmaceutico")).toBe(false);
  });
});

describe("isCeEligible (professions leaf)", () => {
  it("is true unconditionally for the legacy pharmacist tier", () => {
    expect(isCeEligibleCore("pharmacist", null)).toBe(true);
    expect(isCeEligibleCore("pharmacist", "medico")).toBe(true);
  });
  it("is true only for professional-tier pharmacists/techs otherwise", () => {
    expect(isCeEligibleCore("profesional", "farmaceutico")).toBe(true);
    expect(isCeEligibleCore("profesional", "medico")).toBe(false);
    expect(isCeEligibleCore("student", "farmaceutico")).toBe(false);
    expect(isCeEligibleCore(null, "farmaceutico")).toBe(false);
  });
});
