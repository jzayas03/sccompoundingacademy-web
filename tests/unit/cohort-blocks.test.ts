import { describe, it, expect } from "vitest";
import { cohortBlocks } from "@/lib/cohorts/blocks";

const c = (id: string, audience: "farmaceutico_tecnico" | "otros_profesionales" | "estudiante", day: number, capacity: number) => ({
  id,
  audience,
  startDate: new Date(`2026-08-${String(day).padStart(2, "0")}T00:00:00Z`),
  endDate: new Date(`2026-08-${String(day + 2).padStart(2, "0")}T00:00:00Z`),
  capacity,
});

describe("cohortBlocks", () => {
  it("takes the earliest open cohort per audience", () => {
    const blocks = cohortBlocks(
      [c("f1", "farmaceutico_tecnico", 12, 12), c("f2", "farmaceutico_tecnico", 26, 12), c("s1", "estudiante", 19, 12)],
      new Map(),
      null,
    );
    expect(blocks.map((b) => b.id)).toEqual(["f1", "s1"]); // f2 dropped (later farm/téc)
  });
  it("puts the featured audience first, then the rest by date", () => {
    const blocks = cohortBlocks(
      [c("f1", "farmaceutico_tecnico", 12, 12), c("s1", "estudiante", 19, 12)],
      new Map(),
      "estudiante",
    );
    expect(blocks.map((b) => b.audience)).toEqual(["estudiante", "farmaceutico_tecnico"]);
    expect(blocks[0]!.featured).toBe(true);
    expect(blocks[1]!.featured).toBe(false);
  });
  it("orders purely by date when no audience is featured", () => {
    const blocks = cohortBlocks(
      [c("f1", "farmaceutico_tecnico", 12, 12), c("s1", "estudiante", 19, 12)],
      new Map(),
      null,
    );
    expect(blocks.map((b) => b.id)).toEqual(["f1", "s1"]);
  });
  it("computes remaining = capacity − paid, clamped at 0", () => {
    const blocks = cohortBlocks([c("f1", "farmaceutico_tecnico", 12, 12)], new Map([["f1", 20]]), null);
    expect(blocks[0]!.remaining).toBe(0);
    const b2 = cohortBlocks([c("f1", "farmaceutico_tecnico", 12, 12)], new Map([["f1", 5]]), null);
    expect(b2[0]!.remaining).toBe(7);
  });
  it("returns [] for no open cohorts", () => {
    expect(cohortBlocks([], new Map(), null)).toEqual([]);
  });
});
