/**
 * Route-handler tests para POST /api/inscripcion — branch registro liviano
 * (pricing con `registrationOnly`, spec 2026-09-04).
 *
 * Cubre:
 *   1. Registro liviano válido → Checkout de Stripe con metadata
 *      `registration_only: "1"`, SIN consultar ni escribir `users`.
 *   2. Duplicado en la misma cohorte (course_registrations) → 409.
 *   3. Env del price ausente → 503 price-missing (defensa en profundidad).
 *   4. Asientos = usuarios pagados + registros: cohorte llena → 409.
 *   5. Pricing normal (sin flag) → sigue consultando `users` y manda
 *      metadata registration_only vacía.
 *
 * Mock pattern mirrors inscripcion-student-branch.test.ts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  stripeCreateFn: vi.fn(),
  selectLimitFn: vi.fn(),
  insertFn: vi.fn(),
  registrationExistsFn: vi.fn(),
  registrationCountFn: vi.fn(),
  enrollmentCountFn: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@vercel/blob", () => ({ del: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: mocks.selectLimitFn }),
      }),
    }),
    insert: mocks.insertFn,
  },
}));

vi.mock("@/lib/registrations", () => ({
  registrationExists: mocks.registrationExistsFn,
  registrationCountByCohort: mocks.registrationCountFn,
}));

vi.mock("@/lib/portal/notify-matricula-review", () => ({
  notifyMatriculaReview: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: () => ({ checkout: { sessions: { create: mocks.stripeCreateFn } } }),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, retryAfterSeconds: 60 }),
  clientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstile: vi.fn().mockResolvedValue({ success: true }),
}));

// Catálogo real (no mockeado): el branch depende del flag registrationOnly
// que vive en lib/courses.ts, así que probamos contra el catálogo de verdad.

vi.mock("@/lib/cohorts", () => ({
  getCohort: vi.fn().mockImplementation((id: string) =>
    Promise.resolve(
      id === "cohort-parte2"
        ? {
            id: "cohort-parte2",
            courseId: "parte-2",
            openForEnrollment: true,
            audience: "farmaceutico_tecnico",
            capacity: 10,
            startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          }
        : {
            id: "cohort-basico",
            courseId: "basic-compounding",
            openForEnrollment: true,
            audience: "farmaceutico_tecnico",
            capacity: 10,
            startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
    ),
  ),
  enrollmentCountByCohort: mocks.enrollmentCountFn,
}));

vi.mock("@/lib/siteUrl", () => ({
  getSiteUrl: vi.fn().mockReturnValue("https://sccompoundingacademy.com"),
}));

import { POST } from "@/app/api/inscripcion/route";
import { inscripcionApiError } from "@/lib/inscripcion/api-errors";

const PARTE2_PAYLOAD = {
  nombre: "Carlos Ruiz",
  email: "carlos@example.com",
  telefono: "787-555-0199",
  curso_id: "parte-2",
  cohorte_id: "cohort-parte2",
  tier: "profesional",
  tipo_profesional: "farmaceutico",
  acepto_terminos: true as const,
  acepto_version_docs: "v2026-06-01",
  locale: "es" as const,
};

const BASICO_PROFESIONAL_PAYLOAD = {
  ...PARTE2_PAYLOAD,
  curso_id: "basic-compounding",
  cohorte_id: "cohort-basico",
};

function makeRequest(payload: unknown): Request {
  return new Request("http://localhost/api/inscripcion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

const ENV_KEY = "STRIPE_PRICE_ID_PARTE2_PROFESIONAL";

describe("POST /api/inscripcion — branch registro liviano", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env[ENV_KEY] = "price_test_parte2";
    process.env.STRIPE_PRICE_ID_PROFESIONAL = "price_test_prof";
    mocks.registrationExistsFn.mockResolvedValue(false);
    mocks.registrationCountFn.mockResolvedValue(new Map());
    mocks.enrollmentCountFn.mockResolvedValue(new Map());
    mocks.selectLimitFn.mockResolvedValue([]);
    mocks.stripeCreateFn.mockResolvedValue({ url: "https://checkout.stripe.com/x" });
  });

  afterEach(() => {
    delete process.env[ENV_KEY];
    delete process.env.STRIPE_PRICE_ID_PROFESIONAL;
  });

  it("registro válido → checkout con registration_only=1, sin tocar users", async () => {
    const res = await POST(makeRequest(PARTE2_PAYLOAD));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ url: "https://checkout.stripe.com/x" });

    const [args] = mocks.stripeCreateFn.mock.calls[0]!;
    expect(args.metadata.registration_only).toBe("1");
    expect(args.metadata.curso_id).toBe("parte-2");

    // El registro liviano NUNCA consulta ni escribe la tabla users.
    expect(mocks.selectLimitFn).not.toHaveBeenCalled();
    expect(mocks.insertFn).not.toHaveBeenCalled();
    // El duplicado se chequeó contra course_registrations.
    expect(mocks.registrationExistsFn).toHaveBeenCalledExactlyOnceWith(
      "cohort-parte2",
      "carlos@example.com",
    );
  });

  it("registro duplicado en la misma cohorte → 409 already-enrolled", async () => {
    mocks.registrationExistsFn.mockResolvedValue(true);

    const res = await POST(makeRequest(PARTE2_PAYLOAD));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json).toEqual({ error: inscripcionApiError("already-enrolled", "es") });
    expect(mocks.stripeCreateFn).not.toHaveBeenCalled();
  });

  it("env del price ausente → 503 price-missing", async () => {
    delete process.env[ENV_KEY];

    const res = await POST(makeRequest(PARTE2_PAYLOAD));
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json).toEqual({ error: inscripcionApiError("price-missing", "es") });
    expect(mocks.stripeCreateFn).not.toHaveBeenCalled();
  });

  it("cohorte llena (conteo único, ya incluye registros) → 409 cohort-full", async () => {
    // enrollmentCountByCohort pliega course_registrations (lib/cohorts.ts);
    // el route consulta UN solo conteo.
    mocks.enrollmentCountFn.mockResolvedValue(new Map([["cohort-parte2", 10]]));

    const res = await POST(makeRequest(PARTE2_PAYLOAD));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json).toEqual({ error: inscripcionApiError("cohort-full", "es") });
    expect(mocks.stripeCreateFn).not.toHaveBeenCalled();
  });

  it("pricing normal (sin flag) → sigue consultando users y registration_only vacía", async () => {
    const res = await POST(makeRequest(BASICO_PROFESIONAL_PAYLOAD));

    expect(res.status).toBe(200);
    expect(mocks.selectLimitFn).toHaveBeenCalledOnce();
    const [args] = mocks.stripeCreateFn.mock.calls[0]!;
    expect(args.metadata.registration_only).toBe("");
  });
});
