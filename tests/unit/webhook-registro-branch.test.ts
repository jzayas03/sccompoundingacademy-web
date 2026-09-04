/**
 * Route-handler tests para POST /api/webhooks/stripe — branch registro
 * liviano (metadata `registration_only: "1"`, spec 2026-09-04).
 *
 * Prueba con el handler real y superficie de dependencias mockeada:
 *   1. registration_only=1 → insertRegistration con los valores de la
 *      sesión; users NUNCA se toca (ni insert ni update); 200.
 *   2. Replay (inserted:false) → 200 sin reprocesar.
 *   3. Insert que lanza → claim liberado (db.delete) y 500 (Stripe reintenta).
 *
 * Mock pattern mirrors webhook-stripe-route.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEventFn: vi.fn(),
  dbInsertFn: vi.fn(),
  dbUpdateFn: vi.fn(),
  dbDeleteFn: vi.fn(),
  insertRegistrationFn: vi.fn(),
  recordInscripcionFn: vi.fn(),
  sendOpsAlertFn: vi.fn(),
  notifyFn: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/stripe", () => ({
  stripe: () => ({
    webhooks: { constructEvent: mocks.constructEventFn },
  }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: mocks.dbInsertFn,
    update: mocks.dbUpdateFn,
    delete: mocks.dbDeleteFn,
  },
}));

vi.mock("@/lib/registrations", () => ({
  insertRegistration: mocks.insertRegistrationFn,
}));

vi.mock("@/lib/airtable", () => ({
  recordInscripcion: mocks.recordInscripcionFn,
}));

vi.mock("@/lib/portal/notify-matricula-review", () => ({
  notifyMatriculaReview: mocks.notifyFn,
}));

vi.mock("@/lib/alerts", () => ({
  sendOpsAlert: mocks.sendOpsAlertFn,
}));

vi.mock("@/lib/cohorts", () => ({
  getCohort: vi.fn().mockResolvedValue({
    id: "cohort-parte2",
    courseId: "parte-2",
    startDate: new Date("2026-10-01"),
    endDate: new Date("2026-10-02"),
    openForEnrollment: true,
  }),
  formatCohortLabel: vi.fn().mockReturnValue("1–2 de octubre de 2026"),
  formatCohortDate: vi.fn().mockReturnValue("1 de octubre de 2026"),
}));

// Catálogo real: parte-2 y su displayTitle existen en lib/courses.ts.

import { POST } from "@/app/api/webhooks/stripe/route";

function makeStripeEvent(metadataOverrides: Record<string, string> = {}) {
  return {
    id: "evt_registro_1",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_registro_abc",
        customer_email: "Carlos@Example.com",
        customer: "cus_reg_abc",
        amount_total: 174_500,
        total_details: { amount_discount: 0 },
        payment_intent: "pi_reg_abc",
        metadata: {
          tier: "profesional",
          curso_id: "parte-2",
          cohorte_id: "cohort-parte2",
          nombre: "Carlos Ruiz",
          telefono: "787-555-0199",
          tipo_profesional: "farmaceutico",
          registration_only: "1",
          locale: "es",
          acepto_terminos: "true",
          acepto_timestamp: "2026-09-01T12:00:00.000Z",
          acepto_ip: "127.0.0.1",
          acepto_user_agent: "Vitest/1.0",
          acepto_version_docs: "v2026-06-01",
          ...metadataOverrides,
        },
      },
    },
  };
}

function makeWebhookRequest(): Request {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": "t=1234,v1=abc123",
    },
    body: JSON.stringify({}),
  });
}

function idempotencyInsertChain() {
  return {
    values: vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ eventId: "evt_registro_1" }]),
      }),
    }),
  };
}

function deleteChain() {
  return { where: vi.fn().mockResolvedValue(undefined) };
}

describe("POST /api/webhooks/stripe — branch registro liviano", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    mocks.recordInscripcionFn.mockResolvedValue(null);
    mocks.sendOpsAlertFn.mockResolvedValue(undefined);
    mocks.dbDeleteFn.mockReturnValue(deleteChain());
    mocks.dbInsertFn.mockReturnValueOnce(idempotencyInsertChain());
  });

  it("registration_only=1 → insertRegistration con los datos de la sesión; users intacta; 200", async () => {
    mocks.constructEventFn.mockReturnValue(makeStripeEvent());
    mocks.insertRegistrationFn.mockResolvedValue({ inserted: true });

    const res = await POST(makeWebhookRequest());

    expect(res.status).toBe(200);
    expect(mocks.insertRegistrationFn).toHaveBeenCalledOnce();
    const values = mocks.insertRegistrationFn.mock.calls[0]![0];
    expect(values).toMatchObject({
      cohortId: "cohort-parte2",
      courseId: "parte-2",
      tier: "profesional",
      nombre: "Carlos Ruiz",
      email: "carlos@example.com", // lowercased
      telefono: "787-555-0199",
      profesion: "farmaceutico",
      amountCents: 174_500,
      stripeSessionId: "cs_registro_abc",
    });
    expect(values.paidAt).toBeInstanceOf(Date);

    // users NUNCA se toca: el único db.insert fue el claim de idempotencia.
    expect(mocks.dbInsertFn).toHaveBeenCalledOnce();
    expect(mocks.dbUpdateFn).not.toHaveBeenCalled();
    // Registro liviano no escribe en Airtable.
    expect(mocks.recordInscripcionFn).not.toHaveBeenCalled();
  });

  it("replay (inserted:false) → 200 y sin alertas", async () => {
    mocks.constructEventFn.mockReturnValue(makeStripeEvent());
    mocks.insertRegistrationFn.mockResolvedValue({ inserted: false });

    const res = await POST(makeWebhookRequest());

    expect(res.status).toBe(200);
    expect(mocks.dbUpdateFn).not.toHaveBeenCalled();
    expect(mocks.sendOpsAlertFn).not.toHaveBeenCalled();
  });

  it("insert que lanza → claim liberado y 500 para que Stripe reintente", async () => {
    mocks.constructEventFn.mockReturnValue(makeStripeEvent());
    mocks.insertRegistrationFn.mockRejectedValue(new Error("neon down"));

    const res = await POST(makeWebhookRequest());

    expect(res.status).toBe(500);
    expect(mocks.dbDeleteFn).toHaveBeenCalled();
  });
});
