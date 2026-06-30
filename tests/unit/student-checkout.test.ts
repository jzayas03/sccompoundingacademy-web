// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// server-only throws in Node.js outside of Next.js bundler — mock it away.
vi.mock("server-only", () => ({}));

let mockRows: unknown[] = [];

// Stable handle on Stripe's `sessions.create` so a test can assert WHAT was
// passed to it (the webhook depends on the metadata, so we must verify it).
const { createSessionMock } = vi.hoisted(() => ({
  createSessionMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { select: () => ({ from: () => ({ where: () => ({ limit: () => mockRows }) }) }) },
}));
vi.mock("@/lib/cohorts", () => ({ getCohort: vi.fn() }));
vi.mock("@/lib/stripe", () => ({
  stripe: () => ({ checkout: { sessions: { create: createSessionMock } } }),
}));
vi.mock("@/lib/siteUrl", () => ({ getSiteUrl: () => "https://sccompoundingacademy.com" }));

import { createStudentCheckoutSession } from "@/lib/inscripcion/checkout";
import { getCohort } from "@/lib/cohorts";

beforeEach(() => {
  process.env.STRIPE_PRICE_ID_STUDENT = "price_student_test";
  mockRows = [];
  vi.mocked(getCohort).mockReset();
  createSessionMock.mockReset();
  createSessionMock.mockResolvedValue({ url: "https://stripe.test/sess" });
});

// approvedRow must carry all columns that createStudentCheckoutSession now
// selects — including the acepto* fields forwarded to Stripe metadata.
const approvedRow = {
  id: "u1",
  email: "a@b.com",
  paidAt: null,
  studentVerification: "approved",
  cohortId: "c1",
  name: "Ana Test",
  phone: "787-555-0100",
  aceptoTimestamp: new Date("2026-06-01T12:00:00.000Z"),
  aceptoIp: "127.0.0.1",
  aceptoUserAgent: "Vitest/1.0",
  aceptoVersionDocs: "v2026-06-01",
};

// Cast via unknown so TypeScript doesn't complain about the partial Cohort shape,
// but keep the object typed concretely so test assertions can read .courseId / .id.
const openCohort = {
  id: "c1",
  courseId: "basic-compounding" as const,
  openForEnrollment: true,
} as unknown as import("@/lib/cohorts").Cohort;

describe("createStudentCheckoutSession", () => {
  it("returns not-found when the row is missing", async () => {
    mockRows = [];
    expect(await createStudentCheckoutSession("u1")).toEqual({
      ok: false,
      reason: "not-found",
    });
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it("rejects an unapproved row", async () => {
    mockRows = [{ ...approvedRow, studentVerification: "pending" }];
    const r = await createStudentCheckoutSession("u1");
    expect(r).toEqual({ ok: false, reason: "not-approved" });
  });

  it("rejects an already-paid row", async () => {
    mockRows = [{ ...approvedRow, paidAt: new Date() }];
    const r = await createStudentCheckoutSession("u1");
    expect(r).toEqual({ ok: false, reason: "already-paid" });
  });

  it("rejects a closed cohort", async () => {
    mockRows = [approvedRow];
    vi.mocked(getCohort).mockResolvedValue({
      id: "c1",
      courseId: "basic-compounding",
      openForEnrollment: false,
    } as never);
    const r = await createStudentCheckoutSession("u1");
    expect(r).toEqual({ ok: false, reason: "cohort-closed" });
  });

  it("mints a session for the happy path", async () => {
    mockRows = [approvedRow];
    vi.mocked(getCohort).mockResolvedValue(openCohort);
    const r = await createStudentCheckoutSession("u1");
    expect(r).toEqual({ ok: true, url: "https://stripe.test/sess" });
  });

  it("passes the FULL metadata set the webhook requires (curso_id + cohorte_id must be present)", async () => {
    // This test verifies C-1 fix: the webhook runs getCourseById(md.curso_id)
    // and getCohort(md.cohorte_id) BEFORE the tier/stamp-by-id branching.
    // Without curso_id/cohorte_id the webhook bails with "bad metadata" and
    // paidAt is never stamped, so these keys are load-bearing.
    mockRows = [approvedRow];
    vi.mocked(getCohort).mockResolvedValue(openCohort);
    await createStudentCheckoutSession("u1");
    expect(createSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          user_id: "u1",
          tier: "student",
          // Sourced from the cohort the helper already loads:
          curso_id: openCohort.courseId,
          cohorte_id: openCohort.id,
          // Sourced from the acepto* columns now included in the DB select:
          nombre: approvedRow.name,
          telefono: approvedRow.phone,
          locale: "es",
          acepto_terminos: "true",
          acepto_timestamp: approvedRow.aceptoTimestamp.toISOString(),
          acepto_ip: approvedRow.aceptoIp,
          acepto_user_agent: approvedRow.aceptoUserAgent,
          acepto_version_docs: approvedRow.aceptoVersionDocs,
        }),
      }),
    );
  });
});
