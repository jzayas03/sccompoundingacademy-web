/**
 * Regresión: los emails de confirmación e interno del flujo con cuenta
 * mostraban el ID crudo del curso ("basic-compounding") como título —
 * asunto incluido — porque el webhook pasaba `course.id` como cursoTitulo.
 * Deben recibir el `displayTitle` bilingüe del catálogo.
 *
 * Mock pattern mirrors webhook-registro-branch.test.ts (catálogo real).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEventFn: vi.fn(),
  dbInsertFn: vi.fn(),
  dbUpdateFn: vi.fn(),
  dbDeleteFn: vi.fn(),
  resendSendFn: vi.fn(),
  buildConfirmationFn: vi.fn(),
  buildInternalFn: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/stripe", () => ({
  stripe: () => ({ webhooks: { constructEvent: mocks.constructEventFn } }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: mocks.dbInsertFn,
    update: mocks.dbUpdateFn,
    delete: mocks.dbDeleteFn,
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.resendSendFn };
  },
}));

vi.mock("@/lib/airtable", () => ({
  recordInscripcion: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/portal/notify-matricula-review", () => ({
  notifyMatriculaReview: vi.fn(),
}));

vi.mock("@/lib/alerts", () => ({
  sendOpsAlert: vi.fn(),
}));

vi.mock("@/lib/cohorts", () => ({
  getCohort: vi.fn().mockResolvedValue({
    id: "cohort-basico",
    courseId: "basic-compounding",
    startDate: new Date("2026-10-01"),
    endDate: new Date("2026-10-03"),
    openForEnrollment: true,
  }),
  formatCohortLabel: vi.fn().mockReturnValue("1–3 de octubre de 2026"),
  formatCohortDate: vi.fn().mockReturnValue("1 de octubre de 2026"),
}));

vi.mock("@/lib/emails/inscripcion-confirmacion", () => ({
  buildConfirmationEmail: mocks.buildConfirmationFn,
}));

vi.mock("@/lib/emails/inscripcion-interna", () => ({
  buildInternalEmail: mocks.buildInternalFn,
}));

// Catálogo real: displayTitle vive en lib/courses.ts.

import { POST } from "@/app/api/webhooks/stripe/route";

function makeStripeEvent() {
  return {
    id: "evt_titulo_1",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_titulo_abc",
        customer_email: "carlos@example.com",
        customer: "cus_abc",
        amount_total: 239_500,
        total_details: { amount_discount: 0 },
        payment_intent: "pi_abc",
        metadata: {
          tier: "profesional",
          curso_id: "basic-compounding",
          cohorte_id: "cohort-basico",
          nombre: "Carlos Ruiz",
          telefono: "787-555-0199",
          tipo_profesional: "farmaceutico",
          locale: "es",
          acepto_terminos: "true",
          acepto_timestamp: "2026-09-01T12:00:00.000Z",
          acepto_ip: "127.0.0.1",
          acepto_user_agent: "Vitest/1.0",
          acepto_version_docs: "v2026-06-01",
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

describe("POST /api/webhooks/stripe — título display en los emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.RESEND_API_KEY = "re_test_key";

    // db.insert: 1ª llamada = claim de idempotencia; 2ª = upsert de users.
    mocks.dbInsertFn
      .mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ eventId: "evt_titulo_1" }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: "u1", verification: null }]),
          }),
        }),
      });

    mocks.resendSendFn.mockResolvedValue({ id: "email_1" });
    mocks.buildConfirmationFn.mockReturnValue({ subject: "s", html: "<p/>", text: "t" });
    mocks.buildInternalFn.mockReturnValue({ subject: "s", html: "<p/>", text: "t" });
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  it("confirmación e interno reciben el displayTitle ES, no el id crudo", async () => {
    mocks.constructEventFn.mockReturnValue(makeStripeEvent());

    const res = await POST(makeWebhookRequest());
    expect(res.status).toBe(200);

    expect(mocks.buildConfirmationFn).toHaveBeenCalledOnce();
    const confArgs = mocks.buildConfirmationFn.mock.calls[0]![0];
    expect(confArgs.cursoTitulo).toBe("Compounding No Estéril Básico");
    expect(confArgs.cursoTitulo).not.toBe("basic-compounding");

    expect(mocks.buildInternalFn).toHaveBeenCalledOnce();
    const intArgs = mocks.buildInternalFn.mock.calls[0]![0];
    expect(intArgs.cursoTitulo).toBe("Compounding No Estéril Básico");
  });
});
