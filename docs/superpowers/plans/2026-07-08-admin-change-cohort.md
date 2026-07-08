# Admin Change-Cohort Roster Control — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Cambiar cohorte" control to each admin roster row that moves an enrolled student to a different cohort, restricted to audience-compatible cohorts, with a capacity guard the admin can override.

**Architecture:** A pure DB-free rules module (`cohorts/change.ts`) is the single source of truth for which moves are allowed; a server action (`changeCohort` in the existing admin `actions.ts`) loads the student + destination cohort, runs the validator, and writes `users.cohortId`; a client component (`AdminChangeCohort`, mirror of `AdminEditEmail`) renders the collapsed/expanded dropdown UI in the roster's Cohorte cell.

**Tech Stack:** Next.js (App Router, RSC + server actions), Drizzle ORM / Neon Postgres, next-intl (portal is ES-only, copy hard-coded), Vitest + @testing-library/react.

## Global Constraints

- **No DB migration** — `users.cohortId` already exists. Normal deploy, no Neon runtime gate.
- **Audience is a hard barrier** — `changeCohort` rejects an audience mismatch even when `force` is set. `force` bypasses **capacity only**, never audience.
- Audience match uses the existing `audienceMatches(cohortAudience, tier, professionalType)` from `@/lib/cohorts/audience` — do NOT reimplement the predicate.
- Seat count is `enrollmentCountByCohort()` (paid enrollees grouped by `cohortId`) — the same map used by the public meter and admin stat card. A full cohort is `paidCount >= capacity`.
- Portal admin copy is Spanish, hard-coded (not routed through next-intl) — match the existing `actions.ts` / `page.tsx` style.
- `"use server"` files may export ONLY async functions. `changeCohort` and its `ChangeCohortState` **type** live in `actions.ts` (a type export is erased at build, allowed); the pure `validateCohortChange`/`eligibleCohortsForChange` and their types live in `cohorts/change.ts` (a plain module, NOT `"use server"`).
- Branch `feat/admin-change-cohort` (already created; the design doc is committed there). `pnpm vitest run <path>`; full `pnpm vitest run`; `pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm build` in Task 2.

---

### Task 1: Pure change-rules module

**Files:**
- Create: `src/lib/cohorts/change.ts`
- Test: `tests/lib/cohortChange.test.ts` (create)

**Interfaces:**
- Consumes: `audienceMatches` and `type CohortAudience` from `@/lib/cohorts/audience`; `type Cohort` from `@/lib/db/schema`.
- Produces:
  - `type ChangeCode = "same" | "audience-mismatch" | "full" | "ok"`
  - `type CohortOption = { cohort: Cohort; remaining: number; full: boolean }`
  - `eligibleCohortsForChange(cohorts: readonly Cohort[], tier: string, professionalType: string | null | undefined, currentCohortId: string | null, counts: Map<string, number>): CohortOption[]`
  - `validateCohortChange(args: { destAudience: CohortAudience; destCapacity: number; destPaidCount: number; tier: string; professionalType: string | null | undefined; currentCohortId: string | null; destCohortId: string; force: boolean }): ChangeCode`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/cohortChange.test.ts`:

```ts
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
    expect(opts[0].remaining).toBe(0);
    expect(opts[0].full).toBe(true);
  });

  it("includes a matching cohort with room, flagged not-full", () => {
    const opts = eligibleCohortsForChange(all, "pharmacist", null, "farmFull", new Map());
    const ids = opts.map((o) => o.cohort.id);
    expect(ids).toEqual(["farm"]);
    expect(opts[0].remaining).toBe(10);
    expect(opts[0].full).toBe(false);
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/lib/cohortChange.test.ts`
Expected: FAIL — `@/lib/cohorts/change` does not exist yet ("Failed to resolve import").

- [ ] **Step 3: Implement `src/lib/cohorts/change.ts`**

```ts
import type { Cohort } from "@/lib/db/schema";
import { audienceMatches, type CohortAudience } from "@/lib/cohorts/audience";

/** Outcome of a proposed cohort change. */
export type ChangeCode = "same" | "audience-mismatch" | "full" | "ok";

/** A destination-cohort option for the roster dropdown: the cohort plus its
 *  current seat state. `full` means paid enrollees ≥ capacity. */
export type CohortOption = {
  cohort: Cohort;
  remaining: number;
  full: boolean;
};

/**
 * Cohorts the admin may move THIS student into: audience matches the student's
 * profile, excluding the student's current cohort. Full cohorts are INCLUDED
 * (flagged `full`) so the admin can still force a move into them. Pure + DB-free.
 * `counts` is the paid-enrollee map from `enrollmentCountByCohort()`.
 */
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

/**
 * Decide whether a cohort change is allowed — the single source of truth for
 * the rules (the client dropdown filter is only UX). Audience mismatch is a
 * hard barrier that `force` never overrides; `force` bypasses capacity only.
 * `destPaidCount` is the destination cohort's current paid enrollees.
 */
export function validateCohortChange(args: {
  destAudience: CohortAudience;
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/lib/cohortChange.test.ts && pnpm exec tsc --noEmit`
Expected: all tests PASS, tsc clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cohorts/change.ts tests/lib/cohortChange.test.ts
git commit -m "feat(cohorts): pure change-cohort rules (eligible + validate)"
```

---

### Task 2: Server action + client component + roster wiring + full verification

**Files:**
- Modify: `src/app/[locale]/(portal)/portal/admin/actions.ts` (add `ChangeCohortState` type + `changeCohort` action; extend imports)
- Create: `src/components/portal/AdminChangeCohort.tsx`
- Modify: `src/app/[locale]/(portal)/portal/admin/page.tsx` (render `AdminChangeCohort` in the Cohorte cell; import it + `eligibleCohortsForChange`)
- Test: `tests/components/AdminChangeCohort.test.tsx` (create)

**Interfaces:**
- Consumes: `validateCohortChange`, `eligibleCohortsForChange` from `@/lib/cohorts/change`; `getCohort`, `enrollmentCountByCohort`, `formatCohortLabel` from `@/lib/cohorts`; existing `db`, `users`, `eq`, `revalidatePath`, `requireAdmin` in `actions.ts`.
- Produces:
  - `type ChangeCohortState = { ok: boolean; message: string }`
  - `changeCohort(_prev: ChangeCohortState, formData: FormData): Promise<ChangeCohortState>` (server action)
  - `AdminChangeCohort` React component, props `{ userId: string; currentLabel: string; options: Array<{ id: string; label: string; full: boolean; remaining: number }> }`

- [ ] **Step 1: Add the `changeCohort` server action**

In `src/app/[locale]/(portal)/portal/admin/actions.ts`:

First extend the imports. The file currently imports (lines 3-8):
```ts
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reviews, users, quizAttempts, certificates } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { applyVerificationDecision } from "@/lib/portal/apply-verification-decision";
```
Add after the `applyVerificationDecision` import:
```ts
import {
  getCohort,
  enrollmentCountByCohort,
  formatCohortLabel,
} from "@/lib/cohorts";
import { validateCohortChange } from "@/lib/cohorts/change";
```

Then append this action at the end of the file (after `updateUserEmail`):

```ts
export type ChangeCohortState = { ok: boolean; message: string };

/**
 * Admin: move an enrolled student to a different cohort.
 *
 * `users.cohortId` is otherwise only ever written at enrollment (the
 * inscription form and the Stripe webhook); this is the one path that
 * reassigns it afterwards. The rules live in `validateCohortChange`
 * (pure, unit-tested): audience must match the student's profile — a hard
 * barrier `force` never overrides — and a full destination cohort
 * (paid ≥ capacity) is blocked unless the admin passes `force`, which
 * bypasses the capacity check only. Seats are counted by
 * `enrollmentCountByCohort` (paid enrollees per cohort), so after the write
 * the source cohort's count drops and the destination's rises with no other
 * bookkeeping; we revalidate the admin page and the public seat-meter pages.
 */
export async function changeCohort(
  _prev: ChangeCohortState,
  formData: FormData,
): Promise<ChangeCohortState> {
  await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const destCohortId = String(formData.get("cohortId") ?? "");
  const force = formData.get("force") === "on";
  if (!userId || !destCohortId) return { ok: false, message: "Faltan datos." };

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

  if (code === "same")
    return { ok: true, message: "El alumno ya está en esa cohorte." };
  if (code === "audience-mismatch")
    return {
      ok: false,
      message: "Esa cohorte no corresponde al perfil del alumno.",
    };
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
  return {
    ok: true,
    message: `Cohorte cambiada a ${formatCohortLabel(dest, "es")}.`,
  };
}
```

- [ ] **Step 2: Verify the action file typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: clean (no unused-import or type errors). This confirms the `"use server"` file still exports only async functions + a type.

- [ ] **Step 3: Write the failing component test**

Create `tests/components/AdminChangeCohort.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminChangeCohort } from "@/components/portal/AdminChangeCohort";

describe("AdminChangeCohort", () => {
  it("collapsed: shows the current label and a 'cambiar' button when options exist", () => {
    render(
      <AdminChangeCohort
        userId="u1"
        currentLabel="12–14 de agosto de 2026"
        options={[
          { id: "a", label: "19–21 de agosto de 2026", full: false, remaining: 5 },
        ]}
      />,
    );
    expect(screen.getByText("12–14 de agosto de 2026")).toBeTruthy();
    expect(screen.getByRole("button", { name: /cambiar/i })).toBeTruthy();
  });

  it("with no options: shows only the label, no 'cambiar' button", () => {
    render(
      <AdminChangeCohort userId="u1" currentLabel="12–14 de agosto de 2026" options={[]} />,
    );
    expect(screen.getByText("12–14 de agosto de 2026")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /cambiar/i })).toBeNull();
  });

  it("expanded: lists options (full flagged) and the force checkbox", async () => {
    const user = userEvent.setup();
    render(
      <AdminChangeCohort
        userId="u1"
        currentLabel="12–14 de agosto de 2026"
        options={[
          { id: "a", label: "19–21 de agosto de 2026", full: false, remaining: 5 },
          { id: "b", label: "26–28 de agosto de 2026", full: true, remaining: 0 },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /cambiar/i }));

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    const optionTexts = Array.from(select.options).map((o) => o.textContent);
    expect(optionTexts.some((t) => t?.includes("19–21 de agosto de 2026"))).toBe(true);
    expect(optionTexts.some((t) => t?.includes("llena"))).toBe(true);
    expect(screen.getByRole("checkbox", { name: /forzar/i })).toBeTruthy();
  });
});
```

- [ ] **Step 4: Run the component test to verify it fails**

Run: `pnpm vitest run tests/components/AdminChangeCohort.test.tsx`
Expected: FAIL — `@/components/portal/AdminChangeCohort` does not exist yet.

- [ ] **Step 5: Implement `src/components/portal/AdminChangeCohort.tsx`**

```tsx
"use client";

import { useActionState, useState } from "react";
import {
  changeCohort,
  type ChangeCohortState,
} from "@/app/[locale]/(portal)/portal/admin/actions";

/**
 * Inline "change cohort" control for one roster row in the admin panel.
 *
 * Collapsed: the student's current cohort label + a "cambiar" button (hidden
 * when there is no other compatible cohort to move into). Expanded: a select
 * of audience-compatible destination cohorts (full ones flagged "· llena"), a
 * "forzar" checkbox that lets the move bypass a full destination's capacity,
 * and Guardar/Cancelar. Wired to the `changeCohort` server action via
 * `useActionState`; on success the server revalidates the admin page (the row
 * re-queries with the new cohort) and we collapse the editor.
 */
type Option = { id: string; label: string; full: boolean; remaining: number };

const INITIAL: ChangeCohortState = { ok: false, message: "" };

export function AdminChangeCohort({
  userId,
  currentLabel,
  options,
}: {
  userId: string;
  currentLabel: string;
  options: Option[];
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(changeCohort, INITIAL);

  // Collapse once a change lands successfully. Adjusting state during render
  // (vs. an effect) is the React-recommended pattern; `useActionState` returns
  // a fresh `state` object per result so the identity check fires once.
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.ok && state.message) setEditing(false);
  }

  if (!editing) {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-gray-700">{currentLabel}</span>
        {options.length > 0 && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-teal-deep hover:text-teal text-xs font-semibold underline underline-offset-2"
          >
            cambiar
          </button>
        )}
        {state.message && (
          <span
            className={`text-xs ${state.ok ? "text-teal-deep" : "text-red-700"}`}
          >
            {state.message}
          </span>
        )}
      </span>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="cohortId"
        defaultValue={options[0]?.id}
        className="border-gray-300 focus-visible:ring-chartreuse rounded-md border bg-white px-2 py-1 text-sm text-gray-900 focus-visible:ring-2 focus-visible:outline-none"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
            {o.full ? " · llena" : ` · ${o.remaining} cupos`}
          </option>
        ))}
      </select>
      <label className="text-gray-700 inline-flex items-center gap-1 text-xs">
        <input type="checkbox" name="force" className="accent-teal-deep" />
        Forzar aunque esté llena
      </label>
      <button
        type="submit"
        disabled={pending}
        className="bg-teal-deep text-off-white hover:bg-teal disabled:opacity-60 rounded-md px-3 py-1 text-xs font-semibold"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-gray-700 hover:text-gray-900 px-2 py-1 text-xs font-semibold"
      >
        Cancelar
      </button>
      {state.message && !state.ok && (
        <span className="text-red-700 w-full text-xs">{state.message}</span>
      )}
    </form>
  );
}
```

- [ ] **Step 6: Run the component test to verify it passes**

Run: `pnpm vitest run tests/components/AdminChangeCohort.test.tsx`
Expected: all 3 tests PASS.

- [ ] **Step 7: Wire `AdminChangeCohort` into the roster**

In `src/app/[locale]/(portal)/portal/admin/page.tsx`:

Add to the imports. After the existing `AdminEditEmail` import (line 30):
```ts
import { AdminChangeCohort } from "@/components/portal/AdminChangeCohort";
import { eligibleCohortsForChange } from "@/lib/cohorts/change";
```

Replace the Cohorte cell (currently line 263):
```tsx
                  <td className="py-2 pr-4 text-gray-700">{cohortLabel(r.cohortId, cohortById)}</td>
```
with:
```tsx
                  <td className="py-2 pr-4 text-gray-700">
                    <AdminChangeCohort
                      userId={r.id}
                      currentLabel={cohortLabel(r.cohortId, cohortById)}
                      options={eligibleCohortsForChange(
                        cohortList,
                        r.tier ?? "",
                        r.professionalType,
                        r.cohortId,
                        paidByCohort,
                      ).map((o) => ({
                        id: o.cohort.id,
                        label: formatCohortLabel(o.cohort, "es"),
                        full: o.full,
                        remaining: o.remaining,
                      }))}
                    />
                  </td>
```

(`cohortList`, `paidByCohort`, `formatCohortLabel`, and `cohortLabel` are already in scope in this file — see `page.tsx:153`, `:166`, the import at `:14`, and the local helper at `:61`.)

- [ ] **Step 8: Full suite + typecheck + lint**

Run: `pnpm vitest run`
Then: `pnpm exec tsc --noEmit`
Then: `pnpm lint`
Expected: all green/clean.

- [ ] **Step 9: Production build**

Run: `pnpm build`
Expected: build completes (exit 0, route table printed). A `NeonDbError` from a marketing page's `listOpenCohortsSafe` fallback during prerender is fine locally; the build must NOT fail with a page-collection / `invalid-use-server-value` error. This is the gate that catches App-Router-only breakage (a `"use server"` file exporting a non-async value) that tsc/vitest miss.

- [ ] **Step 10: Commit + push**

```bash
git add "src/app/[locale]/(portal)/portal/admin/actions.ts" "src/app/[locale]/(portal)/portal/admin/page.tsx" src/components/portal/AdminChangeCohort.tsx tests/components/AdminChangeCohort.test.tsx
git commit -m "feat(admin): change an enrolled student's cohort from the roster"
```

```bash
git push -u origin feat/admin-change-cohort
```

---

## Notes for the implementer

- The roster query at `page.tsx:84-99` already selects `tier`, `professionalType`, and `cohortId` per row — no query change is needed. `paidByCohort` (`page.tsx:166`) and `cohortList` (`page.tsx:153`) are already computed for the stat cards; reuse them.
- Do NOT pass raw `Cohort` objects (which carry `Date` fields) as client-component props — `page.tsx` projects each option to `{ id, label, full, remaining }` with the label pre-formatted server-side. The component is a pure presenter over serializable props.
- `changeCohort` returns `{ ok: true }` for the `same` no-op so the UI shows a benign message rather than an error, matching `updateUserEmail`'s "El correo no cambió." behavior.
- Manual QA after deploy (owner applies nothing to Neon — no migration): on the prod roster, open "cambiar" on a paid student, confirm the dropdown lists only same-audience cohorts, move them to another cohort, and verify (a) the roster row's cohort updates, (b) the admin "Cupos disponibles" card and the landing seat meter reflect the shifted counts.
