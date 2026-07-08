# Change-cohort guards: same-course + exclude-closed

**Date:** 2026-07-08
**Status:** Approved design — pending implementation plan

## Goal

Tighten the admin "cambiar cohorte" control (shipped in PR #137) so an admin can
only move a student **within the same course** and **into an open cohort**. Two
follow-ups the whole-branch review flagged:

1. **Course match.** `eligibleCohortsForChange`/`validateCohortChange` filter by
   audience but not by `courseId`. Harmless today (the catalogue has one course,
   `basic-compounding`), but a second course would let an admin move a student
   into another course's cohort — changing the course they paid for, with no
   price reconciliation.
2. **Exclude closed cohorts.** Cohorts with `openForEnrollment=false` are offered
   as destinations. A closed cohort is not accepting enrollment and should not be
   a move target.

## Owner decisions

- **Course match is a hard barrier** — an admin can never move a student across
  courses. The destination cohort's `courseId` must equal the student's current
  cohort's `courseId`.
- **Closed is a hard barrier** — `force` does NOT open a closed cohort. `force`
  keeps its single meaning: "move even though the destination is full"
  (capacity only). If you want to move someone into a cohort, open it first.
- **No current cohort → no destinations.** If the student's `cohortId` is null (a
  data anomaly for a paid roster row), `currentCourseId` is null and no cohort
  matches — the collapsed control shows the label with no "cambiar" button.

## Design

Both changes live in the existing pure module `src/lib/cohorts/change.ts` plus a
re-assert in the `changeCohort` server action (the server is the gate; the
dropdown filter is only UX).

### `eligibleCohortsForChange` — new `currentCourseId` param

Signature gains `currentCourseId: string | null` (inserted after
`currentCohortId`):

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

When `currentCourseId` is null, `c.courseId === null` is never true, so the
result is empty — the intended "no destinations" behavior.

### `validateCohortChange` — two new hard-barrier codes

`ChangeCode` gains `"course-mismatch"` and `"closed"`. The args gain
`currentCourseId: string | null`, `destCourseId: string`, and
`destOpen: boolean`. Precedence (all three structural barriers before the
force-gated capacity check):

```ts
export type ChangeCode =
  | "same" | "audience-mismatch" | "course-mismatch" | "closed" | "full" | "ok";

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

`course-mismatch` and `closed` are checked before the `force`/`full` branch, so
`force` can never override them — only `full` is force-gated.

### `changeCohort` server action

The action already loads the student (`tier`, `professionalType`, `cohortId`)
and the destination cohort (`getCohort`). Add a load of the student's **current**
cohort to get its `courseId`, and pass the new fields to the validator:

```ts
  const currentCohort = student.cohortId ? await getCohort(student.cohortId) : undefined;
  const currentCourseId = currentCohort?.courseId ?? null;
  ...
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

New message branches (Spanish, hard-coded, matching the existing ones):

```ts
  if (code === "course-mismatch")
    return { ok: false, message: "Esa cohorte es de otro curso." };
  if (code === "closed")
    return { ok: false, message: "Esa cohorte está cerrada para inscripción." };
```

### Roster wiring — `admin/page.tsx`

Pass `currentCourseId` into `eligibleCohortsForChange`:

```tsx
      options={eligibleCohortsForChange(
        cohortList,
        r.tier ?? "",
        r.professionalType,
        r.cohortId,
        r.cohortId ? (cohortById.get(r.cohortId)?.courseId ?? null) : null,
        paidByCohort,
      ).map(/* unchanged */)}
```

## Error handling

| Code | ok | Message (es) |
|------|-----|--------------|
| `course-mismatch` | false | "Esa cohorte es de otro curso." |
| `closed` | false | "Esa cohorte está cerrada para inscripción." |

Existing codes (`same`, `audience-mismatch`, `full`, `ok`, missing user/cohort)
are unchanged.

## Testing

Extend `tests/unit/lib/cohortChange.test.ts`:

- **`eligibleCohortsForChange`:** a closed cohort (`openForEnrollment=false`) of
  the right audience+course is excluded; a cohort of a **different** `courseId`
  (same audience) is excluded; passing `currentCourseId=null` yields `[]`.
- **`validateCohortChange`:** `course-mismatch` when `destCourseId !==
  currentCourseId`; `closed` when `destOpen=false` (and STILL `closed` with
  `force=true` — force does not open a closed cohort); a cohort that is both
  closed and full returns `closed` (closed is checked first).

Update the existing `eligibleCohortsForChange` tests and the existing
`validateCohortChange` fixtures to supply the new params (matching-course, open
by default) so they keep asserting the same outcomes.

The `changeCohort` action's new branches are covered by the pure validator +
`pnpm build` + manual QA (consistent with the existing action, which has no unit
test — mocked-DB tests are not faithful here).

- `tsc` + `lint` + full suite green; **`pnpm build`** once (App Router change).

## Risks / gates

- **No DB migration** — reuses existing columns. Normal deploy, no Neon gate.
- **No UI change** — the dropdown simply lists fewer cohorts. `AdminChangeCohort`
  is untouched.
- **Callers of `eligibleCohortsForChange`/`validateCohortChange`:** the only
  callers are `admin/page.tsx` and `changeCohort` (both updated here) and the
  test file. The signature change is caught by `tsc` if any caller is missed.

## Files touched

- `src/lib/cohorts/change.ts` (new `currentCourseId` param + two new codes/args).
- `src/app/[locale]/(portal)/portal/admin/actions.ts` (`changeCohort`: load
  current cohort, pass new fields, two new message branches).
- `src/app/[locale]/(portal)/portal/admin/page.tsx` (pass `currentCourseId`).
- `tests/unit/lib/cohortChange.test.ts` (new cases + fixture updates).
