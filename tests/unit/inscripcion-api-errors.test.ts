import { describe, it, expect } from "vitest";
import {
  inscripcionApiError,
  type InscripcionApiErrorCode,
} from "@/lib/inscripcion/api-errors";

const CODES: InscripcionApiErrorCode[] = [
  "rate-limited", "turnstile", "invalid-cohort", "cohort-closed",
  "matricula-required", "already-enrolled", "register-failed", "invalid-tier",
  "price-missing", "cohort-full", "checkout-no-url", "checkout-failed",
];

describe("inscripcionApiError", () => {
  it("returns a non-empty string for every code in both locales", () => {
    for (const code of CODES) {
      expect(inscripcionApiError(code, "es").length).toBeGreaterThan(0);
      expect(inscripcionApiError(code, "en").length).toBeGreaterThan(0);
      expect(inscripcionApiError(code, "es")).not.toBe(inscripcionApiError(code, "en"));
    }
  });

  it("ES strings are verbatim the route's historical literals", () => {
    expect(inscripcionApiError("rate-limited", "es")).toBe(
      "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
    );
    expect(inscripcionApiError("turnstile", "es")).toBe(
      "No pudimos verificar que eres una persona. Recarga la página e inténtalo de nuevo.",
    );
    expect(inscripcionApiError("invalid-cohort", "es")).toBe("Curso o cohorte inválido.");
    expect(inscripcionApiError("cohort-closed", "es")).toBe(
      "Cohorte cerrada para inscripciones.",
    );
    expect(inscripcionApiError("matricula-required", "es")).toBe(
      "Sube una foto de tu matrícula activa para inscribirte como estudiante.",
    );
    expect(inscripcionApiError("already-enrolled", "es")).toBe(
      "Ya tienes una inscripción registrada con este correo. Escríbenos si necesitas ayuda.",
    );
    expect(inscripcionApiError("register-failed", "es")).toBe(
      "No pudimos registrar tu matrícula. Intenta nuevamente o escríbenos.",
    );
    expect(inscripcionApiError("invalid-tier", "es")).toBe("Tier de precio inválido.");
    expect(inscripcionApiError("price-missing", "es")).toBe(
      "Servicio de cobro no configurado. Por favor escríbenos.",
    );
    expect(inscripcionApiError("cohort-full", "es")).toBe(
      "Este cohorte ya está lleno. Escríbenos y te avisamos del próximo cupo disponible.",
    );
    expect(inscripcionApiError("checkout-no-url", "es")).toBe(
      "Stripe no devolvió URL de checkout.",
    );
    expect(inscripcionApiError("checkout-failed", "es")).toBe(
      "No se pudo iniciar el cobro. Intenta nuevamente o escríbenos.",
    );
  });
});
