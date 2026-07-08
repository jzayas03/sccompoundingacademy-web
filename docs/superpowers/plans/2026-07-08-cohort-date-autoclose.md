# Cohort Date-Based Auto-Close — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Public enrollment for a cohort auto-closes 14 days before its `startDate` (what the landing's `closesNote` copy already promises), enforced at read time with a pure predicate — no cron, no DB write, no migration.

**Architecture:** New pure leaf `src/lib/cohorts/enrollable.ts` (`ENROLLMENT_CUTOFF_DAYS`, `enrollmentCutoff`, `isEnrollable`); `listOpenCohorts` filters through it so every public consumer (landing band/featured/JSON-LD, /cursos, enrollment dropdown) inherits; the enrollment POST gate swaps its flag check for the predicate (defense in depth); the admin "Cupos disponibles" stat and the admin cohort-list status label follow.

**Tech Stack:** Next.js App Router, Drizzle (`date` columns in `mode:"date"` = UTC midnight), Vitest.

## Global Constraints

- **Cutoff = 14 days before `startDate`**, strict: `isEnrollable` is false the moment `now >= 00:00 UTC of (startDate − 14d)`.
- **Payments and admin are EXEMPT** — do NOT touch `src/lib/inscripcion/checkout.ts`, `src/app/api/inscripcion/reenviar-pago/route.ts`, `src/lib/cohorts/change.ts`, or the `changeCohort` action. They keep the manual `openForEnrollment` check only.
- **No migration, no cron, no copy change** (`closesNote` already says "dos semanas antes").
- All date math UTC-pinned (repo convention; `startDate` arrives as UTC-midnight `Date`).
- If existing test fixtures start failing because their cohort `startDate` now filters out, fix by making the fixture's intent explicit (clearly-future or clearly-past dates) — NEVER by weakening assertions.
- Branch `feat/cohort-date-autoclose` (created; design committed). `pnpm vitest run <path>`; full `pnpm vitest run`; `pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm build` in Task 2.

---

### Task 1: Pure `enrollable` leaf + unit tests

**Files:**
- Create: `src/lib/cohorts/enrollable.ts`
- Test: `tests/unit/cohort-enrollable.test.ts` (create)

**Interfaces:**
- Consumes: `type Cohort` from `@/lib/db/schema` (type-only).
- Produces: `ENROLLMENT_CUTOFF_DAYS: 14`; `enrollmentCutoff(startDate: Date): Date`; `isEnrollable(cohort: Pick<Cohort, "openForEnrollment" | "startDate">, now: Date): boolean`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/cohort-enrollable.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/cohort-enrollable.test.ts`
Expected: FAIL — `@/lib/cohorts/enrollable` unresolved.

- [ ] **Step 3: Implement `src/lib/cohorts/enrollable.ts`**

```ts
import type { Cohort } from "@/lib/db/schema";

/** Public enrollment closes this many days before the cohort starts —
 *  matches the published closesNote copy ("dos semanas antes"). */
export const ENROLLMENT_CUTOFF_DAYS = 14;

/** UTC instant at which public enrollment for this start date closes:
 *  00:00 UTC of (startDate − ENROLLMENT_CUTOFF_DAYS). `startDate` is a
 *  Drizzle date column in mode:"date" (UTC midnight), consistent with the
 *  repo-wide UTC pinning. */
export function enrollmentCutoff(startDate: Date): Date {
  const cutoff = new Date(startDate);
  cutoff.setUTCDate(cutoff.getUTCDate() - ENROLLMENT_CUTOFF_DAYS);
  return cutoff;
}

/** True when the cohort accepts NEW public enrollments right now: manual
 *  flag open AND the date cutoff not yet reached. The rule for every public
 *  surface and the enrollment POST gate. NOT used by payment paths (an
 *  approved student may pay inside the window) or the admin change-cohort
 *  control (admin may move late-joiners). */
export function isEnrollable(
  cohort: Pick<Cohort, "openForEnrollment" | "startDate">,
  now: Date,
): boolean {
  if (!cohort.openForEnrollment) return false;
  return now < enrollmentCutoff(cohort.startDate);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/cohort-enrollable.test.ts && pnpm exec tsc --noEmit`
Expected: PASS / clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cohorts/enrollable.ts tests/unit/cohort-enrollable.test.ts
git commit -m "feat(cohorts): pure date-based enrollability predicate"
```

---

### Task 2: Wire the predicate + fixture adjustments + full verification

**Files:**
- Modify: `src/lib/cohorts.ts` (`listOpenCohorts` filter + import)
- Modify: `src/app/api/inscripcion/route.ts:175` (gate predicate swap + import)
- Modify: `src/app/[locale]/(portal)/portal/admin/page.tsx:169` (stat filter + import)
- Modify: `src/app/[locale]/(portal)/portal/admin/cohortes/page.tsx:220` (status label + import + `now`)
- Test: adjust any date-sensitive fixtures the full suite surfaces (intent-explicit dates only)

**Interfaces:**
- Consumes (Task 1): `isEnrollable(cohort, now)` from `@/lib/cohorts/enrollable`.
- Produces: no new exports.

- [ ] **Step 1: Filter `listOpenCohorts`**

In `src/lib/cohorts.ts`, add the import (near the existing `CohortAudience` import):

```ts
import { isEnrollable } from "@/lib/cohorts/enrollable";
```

Replace the body of `listOpenCohorts` (currently a single `return db.select()...`):

```ts
export async function listOpenCohorts(courseId?: string): Promise<Cohort[]> {
  const open = eq(cohorts.openForEnrollment, true);
  const rows = await db
    .select()
    .from(cohorts)
    .where(courseId ? and(open, eq(cohorts.courseId, courseId)) : open)
    .orderBy(asc(cohorts.startDate));
  // Date-based auto-close: what the landing copy promises ("cierra dos
  // semanas antes de la fecha de inicio"), enforced at read time — no cron
  // to drift. Payment paths and the admin change-cohort control deliberately
  // do NOT use this (see lib/cohorts/enrollable.ts).
  const now = new Date();
  return rows.filter((c) => isEnrollable(c, now));
}
```

- [ ] **Step 2: Swap the enrollment-POST gate**

In `src/app/api/inscripcion/route.ts`, add the import:

```ts
import { isEnrollable } from "@/lib/cohorts/enrollable";
```

Change line ~175 from:

```ts
  if (!cohort.openForEnrollment) {
```

to:

```ts
  // Manual flag AND the 14-day date cutoff (defense in depth: this gate
  // reads via getCohort, not listOpenCohorts, so it must apply the same rule).
  if (!isEnrollable(cohort, new Date())) {
```

(The body — `discardMatriculaBlob` + `inscripcionApiError("cohort-closed", loc)` — is unchanged.)

- [ ] **Step 3: Admin stat filter**

In `src/app/[locale]/(portal)/portal/admin/page.tsx`, add the import:

```ts
import { isEnrollable } from "@/lib/cohorts/enrollable";
```

Change line ~169 from:

```ts
  const openCohorts = cohortList.filter((c) => c.openForEnrollment);
```

to (the page already has `const now = new Date()` at ~line 160):

```ts
  // Mirrors the public landing: date-auto-closed cohorts don't count as open.
  const openCohorts = cohortList.filter((c) => isEnrollable(c, now));
```

- [ ] **Step 4: Admin cohort-list status label**

In `src/app/[locale]/(portal)/portal/admin/cohortes/page.tsx`, add the import:

```ts
import { isEnrollable } from "@/lib/cohorts/enrollable";
```

Add `const now = new Date();` in the page component body (before the cohort list `.map`), then change line ~220 from:

```tsx
                    {c.openForEnrollment ? "Abierto" : "Cerrado"}
```

to:

```tsx
                    {c.openForEnrollment
                      ? isEnrollable(c, now)
                        ? "Abierto"
                        : "Abierto · cierre por fecha"
                      : "Cerrado"}
```

- [ ] **Step 5: Full suite — fix date-sensitive fixtures**

Run: `pnpm vitest run`
Any failure caused by a fixture cohort now filtering out of `listOpenCohorts` (or failing the route gate) gets fixed by making the fixture date intent-explicit — e.g. a "should be enrollable" cohort gets `startDate` ≥ 60 days in the future relative to any mocked/real `now`; a "should be excluded" case gets a clearly-past date. NEVER weaken an assertion to pass. List every fixture touched in the report.

Then: `pnpm exec tsc --noEmit` and `pnpm lint`
Expected: clean.

- [ ] **Step 6: Production build**

Run: `pnpm build`
Expected: exit 0, route table printed; no page-collection / `invalid-use-server-value` errors.

- [ ] **Step 7: Commit + push**

```bash
git add src/lib/cohorts.ts "src/app/api/inscripcion/route.ts" "src/app/[locale]/(portal)/portal/admin/page.tsx" "src/app/[locale]/(portal)/portal/admin/cohortes/page.tsx" tests/
git commit -m "feat(cohorts): auto-close public enrollment 14 days before start"
```

```bash
git push -u origin feat/cohort-date-autoclose
```

---

## Notes for the implementer

- DO NOT touch `checkout.ts`, `reenviar-pago/route.ts`, `change.ts`, or the `changeCohort` action — payments and admin moves deliberately keep the manual flag only (approved students must be able to pay inside the window; admins must be able to move late-joiners).
- `listOpenCohortsSafe` needs no change — it wraps `listOpenCohorts` and inherits the filter.
- The admin ROSTER page's `cohortLabel`/change-cohort options use `listCohorts()` (all cohorts) — untouched.
- Deploy note (for the PR body): prod cohorts (Aug 12–14, Aug 19–21) have cutoffs Jul 29 / Aug 5 — both still enrollable at deploy; they'll auto-hide on their cutoff dates as the published copy promises.
