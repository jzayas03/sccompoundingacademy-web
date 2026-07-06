import { describe, it, expect } from "vitest";
import { resolveProfesion } from "@/lib/inscripcion/profesion";

describe("resolveProfesion", () => {
  it("B2: Otros track with no sub-profession falls back to generic 'otro'", () => {
    expect(resolveProfesion("profesional", "otro", "", "")).toBe("otro");
  });
  it("uses the specific code when picked under Otro", () => {
    expect(resolveProfesion("profesional", "otro", "medico", "")).toBe("medico");
  });
  it("uses the free text when 'otro > otro' is chosen", () => {
    expect(resolveProfesion("profesional", "otro", "otro", "  Químico  ")).toBe("Químico");
  });
  it("free text 'otro > otro' left blank still falls back to 'otro'", () => {
    expect(resolveProfesion("profesional", "otro", "otro", "   ")).toBe("otro");
  });
  it("returns the pharmacy role directly", () => {
    expect(resolveProfesion("profesional", "farmaceutico", "", "")).toBe("farmaceutico");
    expect(resolveProfesion("profesional", "tecnico", "", "")).toBe("tecnico");
  });
  it("empty when no top-level profession chosen (guard still blocks pharmacist card)", () => {
    expect(resolveProfesion("profesional", "", "", "")).toBe("");
  });
  it("empty for the student tier (profession not asked)", () => {
    expect(resolveProfesion("student", "", "", "")).toBe("");
  });
});
