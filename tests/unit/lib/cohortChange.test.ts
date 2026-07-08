import { describe, it, expect } from "vitest";
import {
  eligibleCohortsForChange,
  validateCohortChange,
} from "@/lib/cohorts/change";
import type { Cohort } from "@/lib/db/schema";

// Minimal Cohort factory — only the fields the module reads matter; the rest
// are filled with valid-shaped placeholders so the object satisfies `Cohort`.
function cohort(over: Partial<Cohort> & Pick<Cohort, "id">): Cohort {
  return {
    id: over.id,
    courseId: over.courseId ?? "basic-compounding",
    name: over.name ?? null,
    startDate: over.startDate ?? new Date("2026-08-12T00:00:00.000Z"),
    endDate: over.endDate ?? new Date("2026-08-14T00:00:00.000Z"),
    capacity: over.capacity ?? 10,
    openForEnrollment: over.openForEnrollment ?? true,
    featured: over.featured ?? false,
    audience: over.audience ?? "farmaceutico_tecnico",
  } as Cohort;
}

const farm = cohort({ id: "farm", audience: "farmaceutico_tecnico", capacity: 10 });
const farmFull = cohort({ id: "farmFull", audience: "farmaceutico_tecnico", capacity: 2 });
const student = cohort({ id: "student", audience: "estudiante", capacity: 12 });
const all = [farm, farmFull, student];

describe("eligibleCohortsForChange", () => {
  it("keeps only audience-matching cohorts, excludes the current one, annotates seats", () => {
    // A pharmacist currently in `farm` → only farm-audience cohorts, minus `farm`.
    const counts = new Map<string, number>([["farmFull", 2]]);
    const opts = eligibleCohortsForChange(all, "pharmacist", null, "farm", counts);
    expect(opts.map((o) => o.cohort.id)).toEqual(["farmFull"]);
    expect(opts[0]!.remaining).toBe(0);
    expect(opts[0]!.full).toBe(true);
  });

  it("includes a matching cohort with room, flagged not-full", () => {
    const opts = eligibleCohortsForChange(all, "pharmacist", null, "farmFull", new Map());
    const ids = opts.map((o) => o.cohort.id);
    expect(ids).toEqual(["farm"]);
    expect(opts[0]!.remaining).toBe(10);
    expect(opts[0]!.full).toBe(false);
  });

  it("filters by the student's audience (estudiante sees only student cohorts)", () => {
    const opts = eligibleCohortsForChange(all, "student", null, null, new Map());
    expect(opts.map((o) => o.cohort.id)).toEqual(["student"]);
  });
});

describe("validateCohortChange", () => {
  const base = {
    tier: "pharmacist",
    professionalType: null,
    currentCohortId: "farm",
    force: false,
  };

  it("same → 'same'", () => {
    expect(
      validateCohortChange({
        ...base,
        destAudience: "farmaceutico_tecnico",
        destCapacity: 10,
        destPaidCount: 0,
        destCohortId: "farm",
      }),
    ).toBe("same");
  });

  it("audience mismatch → 'audience-mismatch'", () => {
    expect(
      validateCohortChange({
        ...base,
        tier: "student",
        currentCohortId: "student",
        destAudience: "farmaceutico_tecnico",
        destCapacity: 10,
        destPaidCount: 0,
        destCohortId: "farm",
      }),
    ).toBe("audience-mismatch");
  });

  it("full without force → 'full'", () => {
    expect(
      validateCohortChange({
        ...base,
        destAudience: "farmaceutico_tecnico",
        destCapacity: 2,
        destPaidCount: 2,
        destCohortId: "farmFull",
      }),
    ).toBe("full");
  });

  it("full WITH force → 'ok'", () => {
    expect(
      validateCohortChange({
        ...base,
        force: true,
        destAudience: "farmaceutico_tecnico",
        destCapacity: 2,
        destPaidCount: 2,
        destCohortId: "farmFull",
      }),
    ).toBe("ok");
  });

  it("in-audience with room → 'ok'", () => {
    expect(
      validateCohortChange({
        ...base,
        destAudience: "farmaceutico_tecnico",
        destCapacity: 10,
        destPaidCount: 3,
        destCohortId: "farm2",
      }),
    ).toBe("ok");
  });
});
