# Cohort date-based auto-close (2 weeks before start)

**Date:** 2026-07-08
**Status:** Approved design — pending implementation plan

## Goal

Enforce what the landing copy already promises but the code never implemented:
*"La inscripción cierra cuando la cohorte se llena o **dos semanas antes** de la
fecha de inicio."* A cohort stops appearing on public surfaces and stops
accepting NEW enrollments 14 days before its `startDate`, automatically —
without the admin having to flip `openForEnrollment` manually. This also fixes
the audit's noted bug of a past, never-manually-closed cohort still being
"featured"/"next" on the landing.

## Owner decisions

- **Cutoff = 14 days before `startDate`** (matches the published `closesNote`
  copy in both locales).
- **Admin is exempt**: the date cutoff is a PUBLIC-enrollment rule. The admin
  "cambiar cohorte" destinations keep filtering on the manual flag only
  (`change.ts` untouched), so late-joiners can still be moved into an upcoming
  or started cohort.
- **Payments are exempt** (design ruling): `createStudentCheckoutSession` and
  `reenviar-pago` keep the manual-flag check only. A student who enrolled in
  time but was approved inside the 2-week window must still be able to pay —
  the cutoff governs NEW enrollments, not pending payments.

## Mechanism: read-time pure predicate (no cron, no DB write, no migration)

Rejected alternatives: a cron flipping `openForEnrollment` (the silent-drift
failure class — a dead cron leaves stale state with no error); filtering only
in the SQL query (the enrollment gate reads via `getCohort`, so it would stay
uncovered).

### 1. New pure leaf — `src/lib/cohorts/enrollable.ts`

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

### 2. `listOpenCohorts` filters through it — every public consumer inherits

`src/lib/cohorts.ts`:

```ts
export async function listOpenCohorts(courseId?: string): Promise<Cohort[]> {
  const open = eq(cohorts.openForEnrollment, true);
  const rows = await db
    .select()
    .from(cohorts)
    .where(courseId ? and(open, eq(cohorts.courseId, courseId)) : open)
    .orderBy(asc(cohorts.startDate));
  // Date-based auto-close: what the landing copy promises ("cierra dos
  // semanas antes de la fecha de inicio"), enforced at read time.
  const now = new Date();
  return rows.filter((c) => isEnrollable(c, now));
}
```

Inheritors (no changes needed): landing band (`cohortBlocks` via
`listOpenCohortsSafe`), `pickFeaturedCohort`, JSON-LD `next`, `/cursos`
next-cohort labels, the enrollment form's cohort dropdown.

### 3. Enrollment POST gate — defense in depth

`src/app/api/inscripcion/route.ts` (~line 175), which reads via `getCohort`
(not `listOpenCohorts`), swaps its check:

```ts
  if (!isEnrollable(cohort, new Date())) {
    await discardMatriculaBlob(data.matricula_doc_url);
    return NextResponse.json(
      { error: inscripcionApiError("cohort-closed", loc) },
      { status: 400 },
    );
  }
```

(Same `cohort-closed` message/status; only the predicate widens.)

### 4. Admin "Cupos disponibles" stat — stays mirrored to the landing

`src/app/[locale]/(portal)/portal/admin/page.tsx` (~line 169) currently
filters `cohortList.filter((c) => c.openForEnrollment)`; its own comment says
it "mirrors the public landing". Change to
`cohortList.filter((c) => isEnrollable(c, now))` (the page already has a
`now`).

### 5. Admin cohort list — anti-confusion label

`src/app/[locale]/(portal)/portal/admin/cohortes/page.tsx` (~line 220)
renders `{c.openForEnrollment ? "Abierto" : "Cerrado"}`. A cohort that is
manually open but past its cutoff would read "Abierto" while invisible on the
landing — confusing. Render instead:

```tsx
{c.openForEnrollment
  ? isEnrollable(c, now) ? "Abierto" : "Abierto · cierre por fecha"
  : "Cerrado"}
```

(add a single `const now = new Date()` in the page body if not present).

## Explicitly NOT touched

- `src/lib/inscripcion/checkout.ts` (student pay-link) — manual flag only.
- `src/app/api/inscripcion/reenviar-pago/route.ts` — manual flag only.
- `src/lib/cohorts/change.ts` + `changeCohort` action — manual flag only.
- `closesNote` copy — already correct; the code now matches it.
- No migration, no cron, no new admin control.

## Testing

- **Unit — `enrollable.ts`** (`tests/unit/cohort-enrollable.test.ts`):
  - `enrollmentCutoff`: startDate 2026-08-12 → cutoff 2026-07-29T00:00Z;
    month-boundary case (startDate 2026-08-05 → 2026-07-22).
  - `isEnrollable`: now well before cutoff → true; now = cutoff instant
    (exactly 00:00Z of cutoff day) → false (strict `<`); now after → false;
    `openForEnrollment=false` → false even far before cutoff.
- **Existing suites:** any test fixture whose cohort feeds `listOpenCohorts`
  mocks the DB, so results pass through the new filter — fixtures with
  near-past `startDate` may start filtering out; adjust fixture dates to be
  clearly future (or clearly past where the test wants exclusion). The
  implementer must run the full suite and fix any date-sensitive fixture by
  making its intent explicit, never by weakening assertions.
- `tsc` + `lint` + full suite green; **`pnpm build`** (App Router change).

## Deploy notes

- Prod cohorts today (Aug 12–14 and Aug 19–21, 2026; today is 2026-07-08) are
  both **outside** the 2-week window (cutoffs Jul 29 / Aug 5) — nothing
  disappears at deploy; they will auto-hide on their cutoff dates, as the
  published copy promises.
- No migration → normal deploy, no Neon gate.

## Files touched

- `src/lib/cohorts/enrollable.ts` (new).
- `src/lib/cohorts.ts` (`listOpenCohorts` filter + import).
- `src/app/api/inscripcion/route.ts` (gate predicate swap).
- `src/app/[locale]/(portal)/portal/admin/page.tsx` (stat filter).
- `src/app/[locale]/(portal)/portal/admin/cohortes/page.tsx` (status label).
- `tests/unit/cohort-enrollable.test.ts` (new) + any date-sensitive fixture
  adjustments.
