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

const approvedRow = {
  id: "u1",
  email: "a@b.com",
  tier: "student",
  paidAt: null,
  studentVerification: "approved",
  verifiedAt: new Date(),
  cohortId: "c1",
  curso_id: "basic-compounding",
};

const openCohort = {
  id: "c1",
  courseId: "basic-compounding",
  openForEnrollment: true,
} as never;

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

  it("passes the user_id + tier metadata the webhook keys off", async () => {
    mockRows = [approvedRow];
    vi.mocked(getCohort).mockResolvedValue(openCohort);
    await createStudentCheckoutSession("u1");
    expect(createSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { user_id: "u1", tier: "student" } }),
    );
  });
});
