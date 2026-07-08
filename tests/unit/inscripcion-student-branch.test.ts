/**
 * Route-handler tests for POST /api/inscripcion — student tier branch.
 *
 * Covers:
 *   1. Student with no existing paid row → { pending: true }, Stripe NOT called, notify called.
 *   2. Student with an already-paid row  → HTTP 409, upsert NOT called, notify NOT called.
 *
 * Mock pattern mirrors inscripcion-idempotency.test.ts (same mock list, same style).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── hoisted mock handles ───────────────────────────────────────────────────────
// vi.hoisted runs before vi.mock factories, so these refs are available when
// the factory closures capture them.
const mocks = vi.hoisted(() => ({
  notifyFn: vi.fn(),
  stripeCreateFn: vi.fn(),
  /** Resolves the db.select chain — swap per test. */
  selectLimitFn: vi.fn(),
  /** The outer db.insert call — lets us assert "not called". */
  insertFn: vi.fn(),
  /** Resolves .returning() at the end of the upsert chain. */
  insertReturningFn: vi.fn(),
  /** @vercel/blob del() — asserts orphaned-blob cleanup on rejection paths. */
  blobDelFn: vi.fn(),
}));

// ── module mocks ───────────────────────────────────────────────────────────────
vi.mock("server-only", () => ({}));

vi.mock("@vercel/blob", () => ({ del: mocks.blobDelFn }));

vi.mock("@/lib/db", () => ({
  db: {
    // Hardcode the chain — only the terminal `.limit()` needs to be swappable.
    select: () => ({
      from: () => ({
        where: () => ({ limit: mocks.selectLimitFn }),
      }),
    }),
    insert: mocks.insertFn,
  },
}));

vi.mock("@/lib/portal/notify-matricula-review", () => ({
  notifyMatriculaReview: mocks.notifyFn,
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

vi.mock("@/lib/courses", () => ({
  getCourseById: vi.fn().mockReturnValue({ id: "basic-compounding" }),
  getPricingByTier: vi.fn().mockReturnValue({ stripePriceEnvKey: "STRIPE_PRICE_ID_STUDENT" }),
}));

vi.mock("@/lib/cohorts", () => ({
  getCohort: vi.fn().mockResolvedValue({
    id: "cohort-2026-q1",
    courseId: "basic-compounding",
    openForEnrollment: true,
    audience: "estudiante",
    capacity: 10,
    // Well past the 14-day enrollment cutoff relative to "now" — this
    // fixture exercises the manual-flag/duplicate-payment gates, not the
    // date cutoff, so pin startDate comfortably in the future (+90 days)
    // rather than a static date that would eventually rot and flip closed.
    startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  }),
  enrollmentCountByCohort: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock("@/lib/cohorts/audience", () => ({
  audienceMatches: vi.fn().mockReturnValue(true),
  audienceMismatchMessage: vi.fn().mockReturnValue("Audiencia inválida."),
}));

vi.mock("@/lib/siteUrl", () => ({
  getSiteUrl: vi.fn().mockReturnValue("https://sccompoundingacademy.com"),
}));

import { POST } from "@/app/api/inscripcion/route";
import { inscripcionApiError } from "@/lib/inscripcion/api-errors";

// ── fixtures ───────────────────────────────────────────────────────────────────
const STUDENT_PAYLOAD = {
  nombre: "Ana García",
  email: "ana@example.com",
  telefono: "787-555-0100",
  curso_id: "basic-compounding",
  cohorte_id: "cohort-2026-q1",
  tier: "student",
  matricula_doc_url: "https://abc123.private.blob.vercel-storage.com/mat.jpg",
  acepto_terminos: true as const,
  acepto_version_docs: "v2026-06-01",
  locale: "es" as const,
};

const PROFESIONAL_PAYLOAD = {
  nombre: "Carlos Ruiz",
  email: "carlos@example.com",
  telefono: "787-555-0199",
  curso_id: "basic-compounding",
  cohorte_id: "cohort-2026-q1",
  tier: "profesional",
  tipo_profesional: "farmaceutico",
  acepto_terminos: true as const,
  acepto_version_docs: "v2026-06-01",
  locale: "es" as const,
};

function makeRequest(payload: unknown): Request {
  return new Request("http://localhost/api/inscripcion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ── tests ──────────────────────────────────────────────────────────────────────
describe("POST /api/inscripcion — student branch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.notifyFn.mockResolvedValue(undefined);
    mocks.blobDelFn.mockResolvedValue(undefined);
    // Wire insertFn to return the upsert chain by default.
    mocks.insertFn.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: mocks.insertReturningFn,
        }),
      }),
    });
    mocks.insertReturningFn.mockResolvedValue([
      { id: "user-1", studentVerification: "pending" },
    ]);
  });

  it("no existing paid row → { pending: true }, Stripe not called, notify called once", async () => {
    // Pre-check finds no row → proceed to upsert + notify.
    mocks.selectLimitFn.mockResolvedValue([]);

    const res = await POST(makeRequest(STUDENT_PAYLOAD));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ pending: true });
    expect(mocks.stripeCreateFn).not.toHaveBeenCalled();
    expect(mocks.notifyFn).toHaveBeenCalledOnce();
  });

  it("existing paid row → HTTP 409, upsert not called, notify not called", async () => {
    // Pre-check finds a paid row → return 409 immediately, skip upsert.
    mocks.selectLimitFn.mockResolvedValue([
      { id: "user-1", paidAt: new Date("2026-01-15T00:00:00Z") },
    ]);

    const res = await POST(makeRequest(STUDENT_PAYLOAD));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json).toMatchObject({ error: expect.stringContaining("inscripción registrada") });
    expect(json).toEqual({ error: inscripcionApiError("already-enrolled", "es") });
    expect(mocks.insertFn).not.toHaveBeenCalled();
    expect(mocks.notifyFn).not.toHaveBeenCalled();
  });

  it("rejected submission with a store-matching matricula URL → orphaned blob discarded", async () => {
    mocks.selectLimitFn.mockResolvedValue([
      { id: "user-1", paidAt: new Date("2026-01-15T00:00:00Z") },
    ]);

    const res = await POST(makeRequest(STUDENT_PAYLOAD));

    expect(res.status).toBe(409);
    expect(mocks.blobDelFn).toHaveBeenCalledExactlyOnceWith(STUDENT_PAYLOAD.matricula_doc_url);
  });

  it("rejected submission with a foreign (non-store) matricula URL → blob NOT discarded", async () => {
    // A foreign URL fails the matricula-required accept-check (400) before
    // the submission ever reaches the duplicate-payment 409 above — both are
    // post-parse rejection paths that wire the same cleanup call, and
    // `discardMatriculaBlob` is a no-op for a URL outside our own store.
    mocks.selectLimitFn.mockResolvedValue([
      { id: "user-1", paidAt: new Date("2026-01-15T00:00:00Z") },
    ]);
    const foreignPayload = {
      ...STUDENT_PAYLOAD,
      matricula_doc_url: "https://evil.example.com/not-ours.jpg",
    };

    const res = await POST(makeRequest(foreignPayload));

    expect(res.status).toBe(400);
    expect(mocks.blobDelFn).not.toHaveBeenCalled();
  });
});

describe("POST /api/inscripcion — profesional branch duplicate-payment guard (I1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // getPricingByTier is mocked to always return STRIPE_PRICE_ID_STUDENT's
    // env key regardless of tier (see the @/lib/courses mock above).
    process.env.STRIPE_PRICE_ID_STUDENT = "price_test";
    mocks.stripeCreateFn.mockResolvedValue({ url: "https://stripe.test/sess" });
  });

  it("no existing paid row → proceeds to create a Stripe Checkout Session", async () => {
    mocks.selectLimitFn.mockResolvedValue([]);

    const res = await POST(makeRequest(PROFESIONAL_PAYLOAD));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ url: "https://stripe.test/sess" });
    expect(mocks.stripeCreateFn).toHaveBeenCalledOnce();
  });

  it("existing paid row → HTTP 409 with the same message as the student branch, Stripe NOT called", async () => {
    mocks.selectLimitFn.mockResolvedValue([
      { id: "user-2", paidAt: new Date("2026-01-15T00:00:00Z") },
    ]);

    const res = await POST(makeRequest(PROFESIONAL_PAYLOAD));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json).toMatchObject({
      error: inscripcionApiError("already-enrolled", "es"),
    });
    expect(mocks.stripeCreateFn).not.toHaveBeenCalled();
  });
});
