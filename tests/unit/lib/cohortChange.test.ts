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
const otherCourse = cohort({ id: "otherCourse", audience: "farmaceutico_tecnico", courseId: "advanced-sterile" });
const closedFarm = cohort({ id: "closedFarm", audience: "farmaceutico_tecnico", openForEnrollment: false });

describe("eligibleCohortsForChange", () => {
  it("keeps only audience-matching cohorts, excludes the current one, annotates seats", () => {
    // A pharmacist currently in `farm` → only farm-audience cohorts, minus `farm`.
    const counts = new Map<string, number>([["farmFull", 2]]);
    const opts = eligibleCohortsForChange(all, "pharmacist", null, "farm", "basic-compounding", counts);
    expect(opts.map((o) => o.cohort.id)).toEqual(["farmFull"]);
    expect(opts[0]!.remaining).toBe(0);
    expect(opts[0]!.full).toBe(true);
  });

  it("includes a matching cohort with room, flagged not-full", () => {
    const opts = eligibleCohortsForChange(all, "pharmacist", null, "farmFull", "basic-compounding", new Map());
    const ids = opts.map((o) => o.cohort.id);
    expect(ids).toEqual(["farm"]);
    expect(opts[0]!.remaining).toBe(10);
    expect(opts[0]!.full).toBe(false);
  });

  it("filters by the student's audience (estudiante sees only student cohorts)", () => {
    const opts = eligibleCohortsForChange(all, "student", null, null, "basic-compounding", new Map());
    expect(opts.map((o) => o.cohort.id)).toEqual(["student"]);
  });

  it("excludes closed cohorts (openForEnrollment=false)", () => {
    const opts = eligibleCohortsForChange(
      [farm, closedFarm], "pharmacist", null, "farm", "basic-compounding", new Map(),
    );
    // `farm` is the current cohort (excluded); `closedFarm` is closed → nothing left.
    expect(opts.map((o) => o.cohort.id)).toEqual([]);
  });

  it("excludes cohorts of a different course", () => {
    const opts = eligibleCohortsForChange(
      [farmFull, otherCourse], "pharmacist", null, "farm", "basic-compounding", new Map(),
    );
    // otherCourse matches audience but is a different courseId → excluded.
    expect(opts.map((o) => o.cohort.id)).toEqual(["farmFull"]);
  });

  it("returns [] when the student has no current course (currentCourseId null)", () => {
    const opts = eligibleCohortsForChange(all, "pharmacist", null, "farm", null, new Map());
    expect(opts).toEqual([]);
  });
});

describe("validateCohortChange", () => {
  const base = {
    tier: "pharmacist",
    professionalType: null,
    currentCohortId: "farm",
    currentCourseId: "basic-compounding",
    force: false,
  };

  it("same → 'same'", () => {
    expect(
      validateCohortChange({
        ...base,
        destAudience: "farmaceutico_tecnico",
        destCapacity: 10,
        destPaidCount: 0,
        destCourseId: "basic-compounding",
        destOpen: true,
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
        destCourseId: "basic-compounding",
        destOpen: true,
        destCohortId: "farm",
      }),
    ).toBe("audience-mismatch");
  });

  it("audience mismatch WITH force still → 'audience-mismatch'", () => {
    expect(
      validateCohortChange({
        ...base,
        tier: "student",
        currentCohortId: "student",
        force: true,
        destAudience: "farmaceutico_tecnico",
        destCapacity: 10,
        destPaidCount: 0,
        destCourseId: "basic-compounding",
        destOpen: true,
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
        destCourseId: "basic-compounding",
        destOpen: true,
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
        destCourseId: "basic-compounding",
        destOpen: true,
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
        destCourseId: "basic-compounding",
        destOpen: true,
        destCohortId: "farm2",
      }),
    ).toBe("ok");
  });

  it("different course → 'course-mismatch'", () => {
    expect(
      validateCohortChange({
        ...base,
        destAudience: "farmaceutico_tecnico",
        destCapacity: 10,
        destPaidCount: 0,
        destCourseId: "advanced-sterile",
        destOpen: true,
        destCohortId: "other",
      }),
    ).toBe("course-mismatch");
  });

  it("closed destination → 'closed', even WITH force", () => {
    expect(
      validateCohortChange({
        ...base,
        force: true,
        destAudience: "farmaceutico_tecnico",
        destCapacity: 10,
        destPaidCount: 0,
        destCourseId: "basic-compounding",
        destOpen: false,
        destCohortId: "closed1",
      }),
    ).toBe("closed");
  });

  it("closed AND full → 'closed' (closed checked before full)", () => {
    expect(
      validateCohortChange({
        ...base,
        destAudience: "farmaceutico_tecnico",
        destCapacity: 2,
        destPaidCount: 2,
        destCourseId: "basic-compounding",
        destOpen: false,
        destCohortId: "closedFull",
      }),
    ).toBe("closed");
  });
});
