import { describe, it, expect } from "vitest";
import { inscripcionSchema } from "@/lib/inscripcion/schema";

const base = {
  nombre: "Ana Ruiz",
  email: "ana@example.com",
  telefono: "7871234567",
  curso_id: "basic-compounding",
  cohorte_id: "c1",
  acepto_terminos: true as const,
  acepto_version_docs: "2026-01-01",
  locale: "es" as const,
};

describe("inscripcion profession requirement", () => {
  it("rejects a professional enrollment with no profession", () => {
    const r = inscripcionSchema.safeParse({ ...base, tier: "profesional", tipo_profesional: "" });
    expect(r.success).toBe(false);
  });
  it("accepts a professional enrollment with a profession", () => {
    const r = inscripcionSchema.safeParse({ ...base, tier: "profesional", tipo_profesional: "farmaceutico" });
    expect(r.success).toBe(true);
  });
  it("accepts a student enrollment with no profession", () => {
    const r = inscripcionSchema.safeParse({ ...base, tier: "student", tipo_profesional: "" });
    expect(r.success).toBe(true);
  });
});
