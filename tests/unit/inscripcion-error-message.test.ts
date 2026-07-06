import { describe, it, expect } from "vitest";
import { inscripcionSchema, inscripcionErrorMessage } from "@/lib/inscripcion/schema";

const base = {
  nombre: "Ana Ruiz",
  email: "ana@example.com",
  telefono: "7871234567",
  curso_id: "basic-compounding",
  cohorte_id: "c1",
  tier: "profesional" as const,
  tipo_profesional: "farmaceutico",
  acepto_terminos: true as const,
  acepto_version_docs: "2026-01-01",
  locale: "es" as const,
};

/** Flatten a schema failure the same way the route does. */
function flattenFail(payload: Record<string, unknown>) {
  const r = inscripcionSchema.safeParse(payload);
  if (r.success) throw new Error("expected the payload to fail validation");
  return r.error.flatten();
}

describe("inscripcionErrorMessage", () => {
  it("names the missing profession (not the generic email sentence)", () => {
    const msg = inscripcionErrorMessage(flattenFail({ ...base, tipo_profesional: "" }), "es");
    expect(msg).toContain("profesión");
    expect(msg).not.toContain("correo electrónico");
  });

  it("names an invalid email", () => {
    const msg = inscripcionErrorMessage(flattenFail({ ...base, email: "a@b" }), "es");
    expect(msg.toLowerCase()).toContain("correo");
  });

  it("names a too-short phone", () => {
    const msg = inscripcionErrorMessage(flattenFail({ ...base, telefono: "123" }), "es");
    expect(msg.toLowerCase()).toContain("teléfono");
  });

  it("localizes to English", () => {
    const msg = inscripcionErrorMessage(flattenFail({ ...base, telefono: "123" }), "en");
    expect(msg.toLowerCase()).toContain("phone");
  });

  it("falls back to the generic message for an unmapped field", () => {
    const msg = inscripcionErrorMessage(flattenFail({ ...base, acepto_version_docs: "" }), "es");
    // acepto_version_docs is programmatic; a user can't fix it — generic is fine.
    expect(msg).toContain("Revisa los datos del formulario");
  });
});
