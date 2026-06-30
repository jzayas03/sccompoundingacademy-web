/**
 * Route-handler tests for POST /api/webhooks/stripe — student stamp wiring.
 *
 * Closes the review finding on Task 7: the pure helper unit tests
 * (`webhook-user.test.ts`) verified the strategy + set-object logic, but
 * nothing exercised the actual HTTP handler wiring. These tests drive the
 * real POST handler with a fully-mocked dependency surface to prove:
 *
 *   1. Student + user_id → stamp-by-id path: db.update(users).set(paidAt…)
 *      is called, db.insert(users) is NOT called, notifyMatriculaReview
 *      is NOT called, response is 200.
 *
 *   2. Profesional (no user_id) → upsert-by-email path: db.insert(users)
 *      IS called, db.update is NOT called, response is 200.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── hoisted mock handles ───────────────────────────────────────────────────────
// vi.hoisted executes before vi.mock factories so these refs are captured in
// the mock factory closures and are writable from test bodies.
const mocks = vi.hoisted(() => ({
  /** stripe().webhooks.constructEvent — returns a crafted Stripe event. */
  constructEventFn: vi.fn(),

  /** db.insert — handles BOTH processedStripeEvents and users tables. */
  dbInsertFn: vi.fn(),
  /** db.update — handles users stamp-by-id path. */
  dbUpdateFn: vi.fn(),
  /** db.delete — used in idempotency-claim release on error (not tested here). */
  dbDeleteFn: vi.fn(),

  /** Captures the argument to db.update(users).set(…) so we can inspect it. */
  updateSetCapture: vi.fn(),

  /** notifyMatriculaReview — must NOT fire on stamp-by-id path. */
  notifyFn: vi.fn(),
  /** recordInscripcion — graceful no-op in all tests. */
  recordInscripcionFn: vi.fn(),
  /** sendOpsAlert — should stay silent on the happy path. */
  sendOpsAlertFn: vi.fn(),
}));

// ── module mocks ───────────────────────────────────────────────────────────────
// Order matches the route's import list for readability.

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

vi.mock("@/lib/airtable", () => ({
  recordInscripcion: mocks.recordInscripcionFn,
}));

vi.mock("@/lib/portal/notify-matricula-review", () => ({
  notifyMatriculaReview: mocks.notifyFn,
}));

vi.mock("@/lib/alerts", () => ({
  sendOpsAlert: mocks.sendOpsAlertFn,
}));

vi.mock("@/lib/courses", () => ({
  getCourseById: vi.fn().mockReturnValue({ id: "basic-compounding" }),
  formatPrice: vi.fn().mockReturnValue("$495.00"),
}));

vi.mock("@/lib/cohorts", () => ({
  getCohort: vi.fn().mockResolvedValue({
    id: "cohort-2026-q1",
    courseId: "basic-compounding",
    startDate: new Date("2026-09-01"),
    endDate: new Date("2026-11-30"),
    openForEnrollment: true,
  }),
  formatCohortLabel: vi.fn().mockReturnValue("Otoño 2026"),
  formatCohortDate: vi.fn().mockReturnValue("1 de septiembre de 2026"),
}));

vi.mock("@/lib/portal/initial-verification", () => ({
  initialVerificationFor: vi.fn().mockReturnValue("pending"),
}));

vi.mock("@/lib/emails/inscripcion-confirmacion", () => ({
  buildConfirmationEmail: vi.fn().mockReturnValue({
    subject: "Confirmación — SCCA",
    html: "<p>ok</p>",
    text: "ok",
  }),
}));

vi.mock("@/lib/emails/inscripcion-interna", () => ({
  buildInternalEmail: vi.fn().mockReturnValue({
    subject: "Nueva inscripción",
    html: "<p>ok</p>",
    text: "ok",
  }),
}));

// RESEND_API_KEY is intentionally NOT set so getResend() returns null and the
// email block is skipped — keeps the test surface focused on the DB wiring.

import { POST } from "@/app/api/webhooks/stripe/route";

// ── fixtures ───────────────────────────────────────────────────────────────────

/**
 * Build a minimal Stripe checkout.session.completed event.
 * Spread `metadataOverrides` to change tier, user_id, etc.
 *
 * IMPORTANT — fixture mirrors createStudentCheckoutSession output (C-1 fix):
 * The metadata keys here (curso_id, cohorte_id, nombre, telefono, acepto_*)
 * are exactly what createStudentCheckoutSession now emits. If you change the
 * helper's metadata shape, update this fixture to match — the tests below
 * exercise the real webhook DB-path routing which requires curso_id/cohorte_id
 * to pass the course-resolution guard before the stamp-by-id branch runs.
 */
function makeStripeEvent(
  metadataOverrides: Record<string, string> = {},
) {
  return {
    id: "evt_test_123",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_abc",
        customer_email: "student@example.com",
        customer: "cus_test_abc",
        amount_total: 49500,
        total_details: { amount_discount: 0 },
        payment_intent: "pi_test_abc",
        metadata: {
          tier: "student",
          user_id: "u1",
          // These two keys mirror createStudentCheckoutSession (C-1 fix):
          // the webhook's getCourseById / getCohort guard runs BEFORE the
          // tier/stamp-by-id branching — without them the event bails with
          // "bad metadata" and paidAt is never stamped.
          curso_id: "basic-compounding",
          cohorte_id: "cohort-2026-q1",
          nombre: "Ana Test",
          telefono: "787-555-0100",
          locale: "es",
          acepto_terminos: "true",
          acepto_timestamp: "2026-06-01T12:00:00.000Z",
          acepto_ip: "127.0.0.1",
          acepto_user_agent: "Vitest/1.0",
          acepto_version_docs: "v2026-06-01",
          ...metadataOverrides,
        },
      },
    },
  };
}

/** POST request with the mandatory stripe-signature header. */
function makeWebhookRequest(): Request {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": "t=1234,v1=abc123",
    },
    body: JSON.stringify({}), // raw body; constructEvent is mocked so content is irrelevant
  });
}

/**
 * Returns the insert chain expected for db.insert(processedStripeEvents).
 * Resolves .returning() to a non-empty array so the idempotency claim is
 * "acquired" and processing continues.
 */
function idempotencyInsertChain() {
  return {
    values: vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ eventId: "evt_test_123" }]),
      }),
    }),
  };
}

// ── tests ──────────────────────────────────────────────────────────────────────
describe("POST /api/webhooks/stripe — DB path routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Handler reads STRIPE_WEBHOOK_SECRET at request time.
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    // Graceful no-ops for side-effect calls.
    mocks.recordInscripcionFn.mockResolvedValue(null);
    mocks.notifyFn.mockResolvedValue(undefined);
    mocks.sendOpsAlertFn.mockResolvedValue(undefined);
  });

  // ── Test 1: student + user_id → stamp-by-id ────────────────────────────────
  it("student + user_id → db.update called with paidAt only; db.insert(users) NOT called; notifyMatriculaReview NOT called; status 200", async () => {
    mocks.constructEventFn.mockReturnValue(makeStripeEvent());

    // First (and only) db.insert call: idempotency claim on processedStripeEvents.
    mocks.dbInsertFn.mockReturnValueOnce(idempotencyInsertChain());

    // Wire db.update so we can capture the .set() argument.
    mocks.updateSetCapture.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "u1" }]),
      }),
    });
    mocks.dbUpdateFn.mockReturnValue({ set: mocks.updateSetCapture });

    const res = await POST(makeWebhookRequest());

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ received: true });

    // db.update.set() must have been called exactly once.
    expect(mocks.updateSetCapture).toHaveBeenCalledOnce();

    const setArg = mocks.updateSetCapture.mock.calls[0]![0] as Record<
      string,
      unknown
    >;

    // Payment stamp fields must be present.
    expect(setArg).toHaveProperty("paidAt");
    expect(setArg.paidAt).toBeInstanceOf(Date);
    expect(setArg).toHaveProperty("stripeCustomerId");
    expect(setArg).toHaveProperty("cohortId");

    // Verification fields must NOT appear — the admin already approved this row.
    expect(setArg).not.toHaveProperty("studentVerification");
    expect(setArg).not.toHaveProperty("verifiedAt");
    expect(setArg).not.toHaveProperty("verificationDocUrl");
    expect(setArg).not.toHaveProperty("verificationSubmittedAt");

    // db.insert should have been called ONLY once (processedStripeEvents),
    // NOT a second time for the users upsert.
    expect(mocks.dbInsertFn).toHaveBeenCalledOnce();

    // Review notification must NOT fire — it already went out at approval time.
    expect(mocks.notifyFn).not.toHaveBeenCalled();
  });

  // ── Test 2: profesional (no user_id) → upsert-by-email ────────────────────
  it("profesional tier → db.insert(users) called; db.update NOT called; status 200", async () => {
    mocks.constructEventFn.mockReturnValue(
      makeStripeEvent({ tier: "profesional", user_id: "" }),
    );

    // First db.insert call: idempotency claim.
    mocks.dbInsertFn.mockReturnValueOnce(idempotencyInsertChain());

    // Second db.insert call: users upsert (Path B).
    mocks.dbInsertFn.mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            { id: "u-prof-1", verification: null },
          ]),
        }),
      }),
    });

    const res = await POST(makeWebhookRequest());

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ received: true });

    // db.insert must have been called twice: processedStripeEvents + users.
    expect(mocks.dbInsertFn).toHaveBeenCalledTimes(2);

    // db.update (stamp-by-id path) must NOT have been taken.
    expect(mocks.dbUpdateFn).not.toHaveBeenCalled();
  });
});
