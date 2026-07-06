import { describe, expect, it } from "vitest";
import {
  getCurriculum,
  requiredOrdinals,
  resolveModule,
  showAcpeDisclosure,
  type UserTier,
} from "@/lib/curriculum";

describe("getCurriculum", () => {
  it("returns the three professional days for the profesional tier", () => {
    const mods = getCurriculum("profesional");
    expect(mods.map((m) => m.id)).toEqual(["modulo-1", "modulo-2", "modulo-3"]);
    expect(mods.map((m) => m.ordinal)).toEqual([1, 2, 3]);
    expect(mods.map((m) => m.pdfBasename)).toEqual(["dia-1", "dia-2", "dia-3"]);
  });

  it("returns the two USP modules for the student tier", () => {
    const mods = getCurriculum("student");
    expect(mods.map((m) => m.id)).toEqual(["usp-795", "usp-800"]);
    expect(mods.map((m) => m.ordinal)).toEqual([1, 2]);
    expect(mods.map((m) => m.pdfBasename)).toEqual(["est-795", "est-800"]);
  });

  it.each<[UserTier]>([["pharmacist"], [null]])(
    "defaults legacy/owner tier %s to the professional curriculum",
    (tier) => {
      expect(getCurriculum(tier).map((m) => m.id)).toEqual([
        "modulo-1",
        "modulo-2",
        "modulo-3",
      ]);
    },
  );
});

describe("resolveModule", () => {
  it("resolves an id that belongs to the tier", () => {
    expect(resolveModule("student", "usp-800")?.ordinal).toBe(2);
  });

  it("returns null for an id from the OTHER tier (cross-tier 404)", () => {
    expect(resolveModule("student", "modulo-1")).toBeNull();
    expect(resolveModule("profesional", "usp-795")).toBeNull();
  });

  it("returns null for an unknown id", () => {
    expect(resolveModule("profesional", "modulo-9")).toBeNull();
  });
});

describe("requiredOrdinals", () => {
  it("returns the curriculum ordinals for each tier", () => {
    expect(requiredOrdinals("profesional")).toEqual([1, 2, 3]);
    expect(requiredOrdinals("student")).toEqual([1, 2]);
  });
});

describe("showAcpeDisclosure", () => {
  it("shows only for professional-tier pharmacists/techs", () => {
    expect(showAcpeDisclosure("profesional", "farmaceutico")).toBe(true);
    expect(showAcpeDisclosure("profesional", "tecnico")).toBe(true);
  });
  it("shows unconditionally for the legacy pharmacist tier", () => {
    expect(showAcpeDisclosure("pharmacist", null)).toBe(true);
  });
  it("is hidden for students and non-pharmacy professionals", () => {
    expect(showAcpeDisclosure("student", null)).toBe(false);
    expect(showAcpeDisclosure("profesional", "medico")).toBe(false);
    expect(showAcpeDisclosure("profesional", null)).toBe(false);
  });
});
