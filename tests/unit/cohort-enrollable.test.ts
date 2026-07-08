import { describe, it, expect } from "vitest";
import {
  ENROLLMENT_CUTOFF_DAYS,
  enrollmentCutoff,
  isEnrollable,
} from "@/lib/cohorts/enrollable";

// startDate arrives as a Drizzle date column in mode:"date" — UTC midnight.
const START = new Date("2026-08-12T00:00:00.000Z");

describe("enrollmentCutoff", () => {
  it("is 14 days before start, at UTC midnight", () => {
    expect(ENROLLMENT_CUTOFF_DAYS).toBe(14);
    expect(enrollmentCutoff(START).toISOString()).toBe("2026-07-29T00:00:00.000Z");
  });

  it("crosses month boundaries correctly", () => {
    expect(
      enrollmentCutoff(new Date("2026-08-05T00:00:00.000Z")).toISOString(),
    ).toBe("2026-07-22T00:00:00.000Z");
  });

  it("does not mutate the input date", () => {
    const d = new Date("2026-08-12T00:00:00.000Z");
    enrollmentCutoff(d);
    expect(d.toISOString()).toBe("2026-08-12T00:00:00.000Z");
  });
});

describe("isEnrollable", () => {
  const open = { openForEnrollment: true, startDate: START };

  it("true well before the cutoff", () => {
    expect(isEnrollable(open, new Date("2026-07-08T15:00:00.000Z"))).toBe(true);
  });

  it("true just before the cutoff instant", () => {
    expect(isEnrollable(open, new Date("2026-07-28T23:59:59.999Z"))).toBe(true);
  });

  it("false AT the cutoff instant (strict <)", () => {
    expect(isEnrollable(open, new Date("2026-07-29T00:00:00.000Z"))).toBe(false);
  });

  it("false after the cutoff and after the start", () => {
    expect(isEnrollable(open, new Date("2026-08-01T00:00:00.000Z"))).toBe(false);
    expect(isEnrollable(open, new Date("2026-09-01T00:00:00.000Z"))).toBe(false);
  });

  it("false when manually closed, even far before the cutoff", () => {
    expect(
      isEnrollable(
        { openForEnrollment: false, startDate: START },
        new Date("2026-01-01T00:00:00.000Z"),
      ),
    ).toBe(false);
  });
});
