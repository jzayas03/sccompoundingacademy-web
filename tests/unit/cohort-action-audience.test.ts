// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/admin", () => ({
  isAdminEmail: vi.fn(),
}));

vi.mock("@/lib/courses", () => ({
  getCourseById: vi.fn(() => true),
}));

vi.mock("@/lib/cohorts", () => ({
  createCohort: vi.fn(),
  updateCohort: vi.fn(),
  deleteCohort: vi.fn(),
  enrollmentCountByCohort: vi.fn(),
}));

import { CohortFields } from "@/app/[locale]/(portal)/portal/admin/cohortes/actions";

const base = {
  courseId: "basic-compounding",
  name: "",
  startDate: "2026-08-12",
  endDate: "2026-08-14",
  capacity: "12",
  openForEnrollment: true,
};

describe("CohortFields audience", () => {
  it("accepts a valid audience", () => {
    expect(CohortFields.safeParse({ ...base, audience: "estudiante" }).success).toBe(true);
  });
  it("rejects an invalid audience", () => {
    expect(CohortFields.safeParse({ ...base, audience: "nope" }).success).toBe(false);
  });
  it("rejects a missing audience", () => {
    expect(CohortFields.safeParse({ ...base }).success).toBe(false);
  });
});
