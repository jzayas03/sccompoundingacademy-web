import { describe, it, expect } from "vitest";
import {
  COURSE_ACCESS_GRACE_DAYS,
  courseAccessExpiresAt,
  isCourseAccessActive,
} from "@/lib/portal/course-access";

const end = new Date("2026-06-01T00:00:00Z");
// 30 days after 2026-06-01 = 2026-07-01.
const withinWindow = new Date("2026-06-20T12:00:00Z");
const lastDay = new Date("2026-07-01T00:00:00Z");
const afterWindow = new Date("2026-07-02T00:00:00Z");

describe("course-access window", () => {
  it("expires COURSE_ACCESS_GRACE_DAYS after the cohort end date", () => {
    expect(COURSE_ACCESS_GRACE_DAYS).toBe(30);
    expect(courseAccessExpiresAt(end)?.toISOString()).toBe(
      "2026-07-01T00:00:00.000Z",
    );
  });

  it("returns null (never expires) with no cohort end date", () => {
    expect(courseAccessExpiresAt(null)).toBeNull();
    expect(courseAccessExpiresAt(undefined)).toBeNull();
  });

  it("allows access inside the window and on the last day", () => {
    expect(
      isCourseAccessActive({ isOwner: false, cohortEndDate: end, now: withinWindow }),
    ).toBe(true);
    expect(
      isCourseAccessActive({ isOwner: false, cohortEndDate: end, now: lastDay }),
    ).toBe(true);
  });

  it("blocks access after the window closes", () => {
    expect(
      isCourseAccessActive({ isOwner: false, cohortEndDate: end, now: afterWindow }),
    ).toBe(false);
  });

  it("never gates an owner, even past the window", () => {
    expect(
      isCourseAccessActive({ isOwner: true, cohortEndDate: end, now: afterWindow }),
    ).toBe(true);
  });

  it("fails open (allows) when the cohort can't be dated", () => {
    expect(
      isCourseAccessActive({ isOwner: false, cohortEndDate: null, now: afterWindow }),
    ).toBe(true);
  });
});
