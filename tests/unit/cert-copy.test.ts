// Pure-function tests for the certificate copy selectors. These guard the
// "profesional-completion" (no-CE) cert copy: pdf-lib output isn't
// text-searchable, so `cert-render.test.ts` can only assert a valid PDF
// header/byte-length — it cannot catch a regression that prints CEUs or
// the ACPE line on a completion-only certificate. Testing the pure copy
// selectors directly closes that gap.
import { describe, it, expect } from "vitest";
import {
  certAudienceLine,
  certCreditLine,
  certShowsAcpe,
} from "@/lib/certificates/render";

describe("certShowsAcpe", () => {
  it("is true only for the CE ('profesional') program", () => {
    expect(certShowsAcpe("profesional")).toBe(true);
    expect(certShowsAcpe("profesional-completion")).toBe(false);
    expect(certShowsAcpe("student")).toBe(false);
  });
});

describe("certCreditLine", () => {
  for (const lang of ["en", "es"] as const) {
    it(`(${lang}) mentions CEUs only for the CE program`, () => {
      expect(certCreditLine("profesional", lang)).toContain("CEUs");
      expect(certCreditLine("profesional-completion", lang)).not.toContain("CEUs");
      expect(certCreditLine("profesional-completion", lang)).not.toContain("CEU");
      expect(certCreditLine("student", lang)).not.toContain("CEUs");
    });
  }
});

describe("certAudienceLine", () => {
  it("labels the no-CE completion cert as a Professional Program (en)", () => {
    expect(certAudienceLine("profesional-completion", "en")).toBe("Professional Program");
  });

  it("labels the no-CE completion cert as Programa Profesional (es)", () => {
    expect(certAudienceLine("profesional-completion", "es")).toContain("Programa Profesional");
  });
});
