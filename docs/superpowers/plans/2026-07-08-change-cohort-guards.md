# Change-Cohort Guards (same-course + exclude-closed) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restrict the admin "cambiar cohorte" control so a student can only be moved within the same course and into an open cohort.

**Architecture:** Two new filter conditions in the pure `eligibleCohortsForChange` and two new hard-barrier codes in `validateCohortChange` (both in `src/lib/cohorts/change.ts`), re-asserted in the `changeCohort` server action, with the roster passing the student's current-cohort `courseId`. One cohesive change — the signature change forces the action, the page, and the tests to update in lockstep, so it is a single task.

**Tech Stack:** Next.js (App Router, RSC + server actions), Drizzle ORM / Neon Postgres, Vitest.

## Global Constraints

- **No DB migration** — reuses existing `cohorts` columns (`courseId`, `openForEnrollment`). Normal deploy, no Neon gate.
- **Course match is a HARD barrier** — the destination cohort's `courseId` must equal the student's current cohort's `courseId`; `force` never overrides it.
- **Closed is a HARD barrier** — `force` does NOT open an `openForEnrollment=false` cohort. `force` still means capacity-only ("move even though full").
- **No current cohort → no destinations** — when `currentCourseId` is null (student `cohortId` null), `eligibleCohortsForChange` returns `[]` (the `c.courseId === null` comparison is never true).
- `validateCohortChange` precedence: `same` → `audience-mismatch` → `course-mismatch` → `closed` → `full` (only this one force-gated) → `ok`.
- Admin copy is Spanish, hard-coded, matching the existing action messages.
- Branch `feat/change-cohort-guards` (already created from `origin/main`; the design doc is committed there). `pnpm vitest run <path>`; full `pnpm vitest run`; `pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm build`.

---

### Task 1: Course + open-status guards (module, action, roster, tests)

**Files:**
- Modify: `src/lib/cohorts/change.ts` (new `currentCourseId` param on `eligibleCohortsForChange`; two new codes + three new args on `validateCohortChange`)
- Modify: `src/app/[locale]/(portal)/portal/admin/actions.ts` (`changeCohort`: load current cohort, pass new fields, two new message branches)
- Modify: `src/app/[locale]/(portal)/portal/admin/page.tsx` (pass `currentCourseId` into `eligibleCohortsForChange`)
- Test: `tests/unit/lib/cohortChange.test.ts` (update existing fixtures to the new signatures; add course + closed cases)

**Interfaces:**
- Consumes: `audienceMatches`, `type CohortAudience` from `@/lib/cohorts/audience`; `type Cohort` from `@/lib/db/schema`; `getCohort`, `enrollmentCountByCohort`, `formatCohortLabel` from `@/lib/cohorts` (already imported in `actions.ts`).
- Produces (updated signatures):
  - `eligibleCohortsForChange(cohorts, tier, professionalType, currentCohortId, currentCourseId: string | null, counts): CohortOption[]`
  - `type ChangeCode = "same" | "audience-mismatch" | "course-mismatch" | "closed" | "full" | "ok"`
  - `validateCohortChange(args: { destAudience; destCapacity; destPaidCount; destCourseId: string; destOpen: boolean; tier; professionalType; currentCohortId; currentCourseId: string | null; destCohortId; force })`

- [ ] **Step 1: Update the test file (fixtures + new cases)**

Edit `tests/unit/lib/cohortChange.test.ts`.

1a. The `cohort()` factory already sets `courseId: "basic-compounding"` and `openForEnrollment: true` by default (lines 13, 18) — no change there. Add two fixtures after the existing `student` fixture (after line 26):

```ts
const otherCourse = cohort({ id: "otherCourse", audience: "farmaceutico_tecnico", courseId: "advanced-sterile" });
const closedFarm = cohort({ id: "closedFarm", audience: "farmaceutico_tecnico", openForEnrollment: false });
```

1b. Update the three existing `eligibleCohortsForChange` calls to pass `currentCourseId = "basic-compounding"` as the new 5th argument (before `counts`):
- line 33: `eligibleCohortsForChange(all, "pharmacist", null, "farm", "basic-compounding", counts)`
- line 40: `eligibleCohortsForChange(all, "pharmacist", null, "farmFull", "basic-compounding", new Map())`
- line 48: `eligibleCohortsForChange(all, "student", null, null, "basic-compounding", new Map())`

(All `all` fixtures are `basic-compounding` + open, so these three assertions are unchanged.)

1c. Add these three `eligibleCohortsForChange` cases inside its `describe` block (after line 50):

```ts
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
```

1d. Update the `validateCohortChange` `base` object (lines 54-59) to include the new required args so every spread call type-checks with matching-course + open defaults:

```ts
  const base = {
    tier: "pharmacist",
    professionalType: null,
    currentCohortId: "farm",
    currentCourseId: "basic-compounding",
    force: false,
  };
```

And add `destCourseId: "basic-compounding", destOpen: true,` to EACH of the six existing `validateCohortChange({ ...base, ... })` calls (the `same`, `audience mismatch`, `audience mismatch WITH force`, `full without force`, `full WITH force`, `in-audience with room` tests). Example for the `same` test:

```ts
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
```

Apply the same two-line addition (`destCourseId: "basic-compounding", destOpen: true,`) to the other five existing cases. (Their outcomes are unchanged: audience/full/same/ok all still fire because course matches and dest is open.)

1e. Add these three new `validateCohortChange` cases inside its `describe` block:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run tests/unit/lib/cohortChange.test.ts`
Expected: FAIL — `eligibleCohortsForChange` ignores the new arg / `validateCohortChange` has no `course-mismatch`/`closed` handling and its type rejects the new args. (tsc-level and assertion-level failures both acceptable here.)

- [ ] **Step 3: Update `src/lib/cohorts/change.ts`**

Replace the `ChangeCode` type (line 5):

```ts
/** Outcome of a proposed cohort change. */
export type ChangeCode =
  | "same"
  | "audience-mismatch"
  | "course-mismatch"
  | "closed"
  | "full"
  | "ok";
```

Replace `eligibleCohortsForChange` (lines 21-38) — add the `currentCourseId` param and two filter conditions:

```ts
export function eligibleCohortsForChange(
  cohorts: readonly Cohort[],
  tier: string,
  professionalType: string | null | undefined,
  currentCohortId: string | null,
  currentCourseId: string | null,
  counts: Map<string, number>,
): CohortOption[] {
  return cohorts
    .filter(
      (c) =>
        c.id !== currentCohortId &&
        c.openForEnrollment &&
        c.courseId === currentCourseId &&
        audienceMatches(c.audience, tier, professionalType),
    )
    .map((c) => {
      const remaining = Math.max(0, c.capacity - (counts.get(c.id) ?? 0));
      return { cohort: c, remaining, full: remaining === 0 };
    });
}
```

Update the doc comment above it to mention the new guards (replace lines 15-20):

```ts
/**
 * Cohorts the admin may move THIS student into: same course, open for
 * enrollment, audience matches the student's profile, excluding the student's
 * current cohort. Full cohorts are INCLUDED (flagged `full`) so the admin can
 * still force a move into them. Pure + DB-free. `counts` is the paid-enrollee
 * map from `enrollmentCountByCohort()`; `currentCourseId` is null when the
 * student has no current cohort, which yields no destinations.
 */
```

Replace `validateCohortChange` (lines 46-62) — add the three args and two barrier checks:

```ts
/**
 * Decide whether a cohort change is allowed — the single source of truth for
 * the rules (the client dropdown filter is only UX). Audience, course, and
 * closed status are hard barriers `force` never overrides; `force` bypasses
 * capacity only. `destPaidCount` is the destination cohort's current paid
 * enrollees.
 */
export function validateCohortChange(args: {
  destAudience: CohortAudience;
  destCapacity: number;
  destPaidCount: number;
  destCourseId: string;
  destOpen: boolean;
  tier: string;
  professionalType: string | null | undefined;
  currentCohortId: string | null;
  currentCourseId: string | null;
  destCohortId: string;
  force: boolean;
}): ChangeCode {
  if (args.destCohortId === args.currentCohortId) return "same";
  if (!audienceMatches(args.destAudience, args.tier, args.professionalType))
    return "audience-mismatch";
  if (args.destCourseId !== args.currentCourseId) return "course-mismatch";
  if (!args.destOpen) return "closed";
  const full = args.destPaidCount >= args.destCapacity;
  if (full && !args.force) return "full";
  return "ok";
}
```

- [ ] **Step 4: Run the unit tests to verify they pass**

Run: `pnpm vitest run tests/unit/lib/cohortChange.test.ts`
Expected: PASS (all existing + 6 new cases green).

- [ ] **Step 5: Update the `changeCohort` server action**

In `src/app/[locale]/(portal)/portal/admin/actions.ts`, inside `changeCohort`, after the `dest` existence check (the line `if (!dest) return { ok: false, message: "Cohorte no encontrada." };`) and before `const counts = await enrollmentCountByCohort();`, insert:

```ts
  const currentCohort = student.cohortId
    ? await getCohort(student.cohortId)
    : undefined;
  const currentCourseId = currentCohort?.courseId ?? null;
```

Then update the `validateCohortChange({ ... })` call to add the three new fields:

```ts
  const code = validateCohortChange({
    destAudience: dest.audience,
    destCapacity: dest.capacity,
    destPaidCount: counts.get(dest.id) ?? 0,
    destCourseId: dest.courseId,
    destOpen: dest.openForEnrollment,
    tier: student.tier ?? "",
    professionalType: student.professionalType,
    currentCohortId: student.cohortId,
    currentCourseId,
    destCohortId: dest.id,
    force,
  });
```

And add the two new message branches immediately after the `audience-mismatch` branch (before the `full` branch):

```ts
  if (code === "course-mismatch")
    return { ok: false, message: "Esa cohorte es de otro curso." };
  if (code === "closed")
    return { ok: false, message: "Esa cohorte está cerrada para inscripción." };
```

- [ ] **Step 6: Update the roster wiring in `page.tsx`**

In `src/app/[locale]/(portal)/portal/admin/page.tsx`, the `<AdminChangeCohort>` `options` prop calls `eligibleCohortsForChange(cohortList, r.tier ?? "", r.professionalType, r.cohortId, paidByCohort)`. Insert the `currentCourseId` argument (derived from the current cohort via the existing `cohortById` map) between `r.cohortId` and `paidByCohort`:

```tsx
                      options={eligibleCohortsForChange(
                        cohortList,
                        r.tier ?? "",
                        r.professionalType,
                        r.cohortId,
                        r.cohortId ? (cohortById.get(r.cohortId)?.courseId ?? null) : null,
                        paidByCohort,
                      ).map((o) => ({
                        id: o.cohort.id,
                        label: formatCohortLabel(o.cohort, "es"),
                        full: o.full,
                        remaining: o.remaining,
                      }))}
```

(`cohortById` is already built at `page.tsx:154`; `formatCohortLabel` is already imported.)

- [ ] **Step 7: Full suite + typecheck + lint**

Run: `pnpm vitest run`
Then: `pnpm exec tsc --noEmit`
Then: `pnpm lint`
Expected: all green/clean. tsc is the safety net that every caller of the two changed signatures was updated (only `page.tsx`, `actions.ts`, and the test file call them).

- [ ] **Step 8: Production build**

Run: `pnpm build`
Expected: build completes (exit 0, route table printed). A `NeonDbError` from a marketing page's `listOpenCohortsSafe` fallback during prerender is fine locally; the build must NOT fail with a page-collection / `invalid-use-server-value` error.

- [ ] **Step 9: Commit + push**

```bash
git add src/lib/cohorts/change.ts "src/app/[locale]/(portal)/portal/admin/actions.ts" "src/app/[locale]/(portal)/portal/admin/page.tsx" tests/unit/lib/cohortChange.test.ts
git commit -m "feat(admin): restrict change-cohort to same course + open cohorts"
```

```bash
git push -u origin feat/change-cohort-guards
```

---

## Notes for the implementer

- This is a signature-change refactor: after editing `change.ts`, `pnpm exec tsc --noEmit` will point at every unmigrated caller. There are exactly three (`actions.ts`, `page.tsx`, the test file) — all updated in this task.
- Do NOT change `AdminChangeCohort.tsx` — the component is a pure presenter over `{ id, label, full, remaining }` and is unaffected; the dropdown simply receives fewer options.
- `course-mismatch` and `closed` are checked before the `force`/`full` branch by design — verify the ordering in `validateCohortChange` matches the plan exactly, since the "closed AND full → closed" test pins it.
- Manual QA after deploy: on the prod roster, confirm the "cambiar" dropdown for a student now lists only same-course, open cohorts of their audience (with a single course today, this is the same set minus any closed cohorts).
