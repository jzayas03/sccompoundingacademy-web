# Admin: change an enrolled student's cohort

**Date:** 2026-07-08
**Status:** Approved design — pending implementation plan

## Goal

Give the admin a control in the roster to **move an already-enrolled student to
a different cohort**. Today `users.cohortId` is written only at enrollment (the
inscription form and the Stripe webhook); no admin, portal, or script path ever
reassigns it — the only recourse is a raw SQL `UPDATE`. This adds a first-class
"Cambiar cohorte" affordance on each roster row, restricted to cohorts matching
the student's audience, with a capacity guard the admin can override.

## Owner decisions

- **Destination cohorts:** only those whose `audience` matches the student's
  profile (same `audienceMatches` predicate as the enrollment gate). Audience is
  a **hard barrier** — never overridable, because moving e.g. a student into a
  pharmacist cohort would corrupt CE eligibility and audience labels.
- **Capacity:** if the destination cohort is at/over capacity, **block by
  default but offer a "forzar" checkbox** that bypasses the capacity check only
  (never the audience check).
- **Notification:** **no email** to the student. The action only updates the DB;
  the admin coordinates any notice out of band.

## Architecture

Three units, mirroring the existing "editar correo" pattern
(`updateUserEmail` action + `AdminEditEmail` client component).

### 1. Pure logic — `src/lib/cohorts/change.ts` (DB-free, unit-tested)

```ts
import type { Cohort } from "@/lib/db/schema";
import { audienceMatches } from "@/lib/cohorts/audience";

export type ChangeCode = "same" | "audience-mismatch" | "full" | "ok";

/** A destination-cohort option for the roster dropdown: the cohort plus its
 *  current seat state. `full` means paid enrollees ≥ capacity. */
export type CohortOption = {
  cohort: Cohort;
  remaining: number;
  full: boolean;
};

/** Cohorts the admin may move THIS student into: audience matches the
 *  student's profile, excluding the student's current cohort. Full cohorts
 *  are INCLUDED (flagged `full`) so the admin can force. Pure + DB-free.
 *  `counts` is the paid-enrollee map from enrollmentCountByCohort(). */
export function eligibleCohortsForChange(
  cohorts: readonly Cohort[],
  tier: string,
  professionalType: string | null | undefined,
  currentCohortId: string | null,
  counts: Map<string, number>,
): CohortOption[] {
  return cohorts
    .filter(
      (c) =>
        c.id !== currentCohortId &&
        audienceMatches(c.audience, tier, professionalType),
    )
    .map((c) => {
      const remaining = Math.max(0, c.capacity - (counts.get(c.id) ?? 0));
      return { cohort: c, remaining, full: remaining === 0 };
    });
}

/** Decide whether a cohort change is allowed. The single source of truth for
 *  the rules — the client dropdown filter is only UX. `paidCount` is the
 *  destination cohort's current paid enrollees. */
export function validateCohortChange(args: {
  destAudience: Cohort["audience"];
  destCapacity: number;
  destPaidCount: number;
  tier: string;
  professionalType: string | null | undefined;
  currentCohortId: string | null;
  destCohortId: string;
  force: boolean;
}): ChangeCode {
  if (args.destCohortId === args.currentCohortId) return "same";
  if (!audienceMatches(args.destAudience, args.tier, args.professionalType))
    return "audience-mismatch";
  const full = args.destPaidCount >= args.destCapacity;
  if (full && !args.force) return "full";
  return "ok";
}
```

Note: capacity is compared with the student's **current** paid state ignored —
i.e. we compare `destPaidCount >= destCapacity` on the destination as it stands.
Because the student is not yet in the destination, no double-count arises; after
the move the destination gains one seat and the source loses one (both follow
`enrollmentCountByCohort`, which groups live by `cohortId`).

### 2. Server action — `changeCohort` in `admin/actions.ts`

Same file and shape as `updateUserEmail` (returns a `{ ok, message }` state for
`useActionState`):

```ts
export type ChangeCohortState = { ok: boolean; message: string };

export async function changeCohort(
  _prev: ChangeCohortState,
  formData: FormData,
): Promise<ChangeCohortState> {
  await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const destCohortId = String(formData.get("cohortId") ?? "");
  const force = formData.get("force") === "on";
  if (!userId || !destCohortId) return { ok: false, message: "Faltan datos." };

  // Load the student (tier + profession + current cohort).
  const [student] = await db
    .select({
      id: users.id,
      tier: users.tier,
      professionalType: users.professionalType,
      cohortId: users.cohortId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!student) return { ok: false, message: "Usuario no encontrado." };

  const dest = await getCohort(destCohortId);
  if (!dest) return { ok: false, message: "Cohorte no encontrada." };

  const counts = await enrollmentCountByCohort();
  const code = validateCohortChange({
    destAudience: dest.audience,
    destCapacity: dest.capacity,
    destPaidCount: counts.get(dest.id) ?? 0,
    tier: student.tier ?? "",
    professionalType: student.professionalType,
    currentCohortId: student.cohortId,
    destCohortId: dest.id,
    force,
  });

  if (code === "same") return { ok: true, message: "El alumno ya está en esa cohorte." };
  if (code === "audience-mismatch")
    return { ok: false, message: "Esa cohorte no corresponde al perfil del alumno." };
  if (code === "full") {
    const n = counts.get(dest.id) ?? 0;
    return {
      ok: false,
      message: `Cohorte llena (${n}/${dest.capacity}). Marca "forzar" para moverlo de todos modos.`,
    };
  }

  await db.update(users).set({ cohortId: dest.id }).where(eq(users.id, userId));
  revalidatePath("/es/portal/admin");
  revalidatePath("/es");
  revalidatePath("/en");
  revalidatePath("/es/cursos");
  revalidatePath("/en/cursos");
  return { ok: true, message: `Cohorte cambiada a ${formatCohortLabel(dest, "es")}.` };
}
```

New imports the action needs: `getCohort`, `enrollmentCountByCohort`,
`formatCohortLabel` from `@/lib/cohorts`; `validateCohortChange` from
`@/lib/cohorts/change`. `revalidatePath`, `db`, `users`, `eq` are already
imported in the file.

### 3. Client component — `AdminChangeCohort` (`src/components/portal/`)

Mirror of `AdminEditEmail`:

- **Props:** `{ userId: string; currentLabel: string; options: CohortOptionDTO[] }`
  where `CohortOptionDTO = { id: string; label: string; full: boolean; remaining: number }`
  (a plain-serializable projection built in `page.tsx` — do NOT pass the raw
  `Cohort` with `Date` fields down as component props unnecessarily; pass the
  formatted label + seat flags).
- **Collapsed:** the current cohort label + a "cambiar" button. If `options` is
  empty (no other compatible cohort exists), render just the label with no
  button.
- **Expanded:** a `<select name="cohortId">` listing the options — each `<option>`
  text is `label` plus ` · llena` when `full` (else ` · N cupos`); a checkbox
  `<input type="checkbox" name="force">` labeled "Forzar aunque esté llena"; and
  Guardar/Cancelar. Wired to `changeCohort` via `useActionState`; on `ok` success
  it collapses (same seen-state pattern as `AdminEditEmail`). Error/success
  message renders in place.

### 4. Roster wiring — `admin/page.tsx`

The roster already loads `tier`, `professionalType`, `cohortId` per row and
computes `paidByCohort = enrollmentCountByCohort()` and `cohortList`. In the
Cohorte cell (currently `page.tsx:263`, plain `cohortLabel(...)` text), render
`<AdminChangeCohort>` instead:

```tsx
<td className="py-2 pr-4 text-gray-700">
  <AdminChangeCohort
    userId={r.id}
    currentLabel={cohortLabel(r.cohortId, cohortById)}
    options={eligibleCohortsForChange(
      cohortList, r.tier ?? "", r.professionalType, r.cohortId, paidByCohort,
    ).map((o) => ({
      id: o.cohort.id,
      label: formatCohortLabel(o.cohort, "es"),
      full: o.full,
      remaining: o.remaining,
    }))}
  />
</td>
```

`cohortLabel` (existing local helper) still renders the current-cohort text
inside the component's collapsed state via the `currentLabel` prop.

## Error handling

| Code | ok | Message (es) |
|------|-----|--------------|
| `same` | true | "El alumno ya está en esa cohorte." |
| `audience-mismatch` | false | "Esa cohorte no corresponde al perfil del alumno." |
| `full` (no force) | false | "Cohorte llena (N/N). Marca \"forzar\" para moverlo de todos modos." |
| missing user | false | "Usuario no encontrado." |
| missing cohort | false | "Cohorte no encontrada." |
| `ok` | true | "Cohorte cambiada a {label}." |

The audience barrier is enforced server-side even though the dropdown already
filters to compatible cohorts — the client filter is UX; the server is the gate.

## Testing

- **Unit — `validateCohortChange`:** `same` (dest == current); `audience-mismatch`
  (student `estudiante` → `farmaceutico_tecnico` cohort); `full` when
  `paidCount >= capacity` and `!force`; `ok` when the same full cohort is forced;
  `ok` for a normal in-audience, has-room move.
- **Unit — `eligibleCohortsForChange`:** filters out non-matching audiences and
  the current cohort; annotates `remaining = max(0, capacity − paid)` and
  `full` when remaining is 0; a full cohort is still INCLUDED (flagged).
- **Component — `AdminChangeCohort`:** given two options (one full, one with
  room) the `<select>` lists both, the full one shows "· llena", the "forzar"
  checkbox is present; with `options={[]}` only the current label renders (no
  "cambiar" button).
- `tsc` + `lint` + full suite green; **`pnpm build`** once (App Router change).

The server action itself is not unit-tested (neon-http `db` is impractical to
mock faithfully — mocked DB tests have repeatedly passed while prod drifted).
Its logic lives in `validateCohortChange`, which is fully covered; the DB write
is one line and verified on the prod roster after deploy.

## Risks / gates

- **No DB migration** — `users.cohortId` already exists. Normal deploy, **no
  runtime gate** in Neon.
- **Seat counts stay consistent:** `enrollmentCountByCohort` groups live by
  `cohortId`, so after a move the source cohort's count drops and the
  destination's rises with no extra bookkeeping. The landing/`cursos` meters and
  the admin "Cupos disponibles" card follow automatically once the changed
  paths are revalidated.
- **Forcing bypasses capacity, never audience.** A forced move can overfill a
  cohort past `capacity` (accepted — that is the point of the override); it can
  never place a student in a mismatched-audience cohort.
- **Scope:** only the admin roster changes. No change to enrollment, pricing,
  Stripe, CE, the featured-cohort landing, or `/cursos` logic beyond the seat
  meter following the new count.

## Files touched

- `src/lib/cohorts/change.ts` (new — `eligibleCohortsForChange`,
  `validateCohortChange`, `CohortOption`, `ChangeCode`).
- `src/app/[locale]/(portal)/portal/admin/actions.ts` (add `changeCohort` +
  `ChangeCohortState`; new imports).
- `src/components/portal/AdminChangeCohort.tsx` (new client component).
- `src/app/[locale]/(portal)/portal/admin/page.tsx` (render `AdminChangeCohort`
  in the Cohorte cell).
- Tests: `tests/lib/cohortChange.test.ts`,
  `tests/components/AdminChangeCohort.test.tsx`.
