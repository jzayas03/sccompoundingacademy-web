# Cohort Audience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each cohort an audience (farmacéuticos/técnicos, otros profesionales, or estudiantes) so the admin sets it and enrollment is restricted to matching enrollees.

**Architecture:** A new `audience` enum column on `cohorts`. A pure, DB-free module (`lib/cohorts/audience.ts`) maps an enrollee `(tier, professional_type)` to an audience using the same `isPharmacyRole` predicate that drives CE, and is consumed by the admin form, a server-side enrollment gate, and a client-side cohort-dropdown filter.

**Tech Stack:** Next.js (App Router, RSC + server actions), Drizzle ORM (Postgres/Neon), Zod, Vitest, next-intl.

## Global Constraints

- Audience enum values are exactly: `farmaceutico_tecnico`, `otros_profesionales`, `estudiante`.
- Enrollee→audience: `student`→`estudiante`; `profesional`+`isPharmacyRole`(farmaceutico/tecnico)→`farmaceutico_tecnico`; `profesional`+non-pharmacy→`otros_profesionales`. Uses `isPharmacyRole` from `@/lib/professions` (the same CE predicate).
- `lib/cohorts/audience.ts` is a DB-free leaf: it may import ONLY `@/lib/professions`. It must NOT import `@/lib/cohorts` or `@/lib/db`.
- Migration is HAND-AUTHORED and idempotent (`DO $$…$$` enum + `ADD COLUMN IF NOT EXISTS`). Do **NOT** run `pnpm db:generate` (stale journal).
- Existing cohorts default to `farmaceutico_tecnico` (column `NOT NULL DEFAULT 'farmaceutico_tecnico'`).
- The migration is backward-compatible (adds a defaulted column) and MUST be applied to the Neon DB before the code runs against it — see Task 8.
- v1 does NOT touch `CohortWaitlist.tsx`, `CursosGrid.tsx`, or `[locale]/(marketing)/page.tsx` (public display deferred).
- Admin page is ES-only hardcoded copy — use `AUDIENCE_LABELS[a].es` there (no i18n JSON keys added).
- Branch `feat/cohort-audience` (not `main`). Test cmd: `pnpm vitest run <path>`; full suite `pnpm vitest run`; `pnpm exec tsc --noEmit`; `pnpm lint`.

---

### Task 1: Pure audience module

**Files:**
- Create: `src/lib/cohorts/audience.ts`
- Test: `tests/unit/cohort-audience.test.ts`

**Interfaces:**
- Consumes: `isPharmacyRole` from `@/lib/professions`.
- Produces: `type CohortAudience = "farmaceutico_tecnico" | "otros_profesionales" | "estudiante"`; `AUDIENCE_LABELS: Record<CohortAudience, {es:string; en:string}>`; `enrolleeAudience(tier: string, professionalType: string | null | undefined): CohortAudience | null`; `visibleAudiences(tier: string, professionalType: string | null | undefined): CohortAudience[]`; `audienceMatches(cohortAudience: CohortAudience, tier: string, professionalType: string | null | undefined): boolean`; `audienceMismatchMessage(cohortAudience: CohortAudience, locale: "es" | "en"): string`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/cohort-audience.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  enrolleeAudience,
  visibleAudiences,
  audienceMatches,
  audienceMismatchMessage,
  AUDIENCE_LABELS,
} from "@/lib/cohorts/audience";

describe("enrolleeAudience", () => {
  it("maps student to estudiante", () => {
    expect(enrolleeAudience("student", null)).toBe("estudiante");
  });
  it("maps professional pharmacy roles to farmaceutico_tecnico", () => {
    expect(enrolleeAudience("profesional", "farmaceutico")).toBe("farmaceutico_tecnico");
    expect(enrolleeAudience("profesional", "tecnico")).toBe("farmaceutico_tecnico");
  });
  it("maps professional non-pharmacy to otros_profesionales", () => {
    expect(enrolleeAudience("profesional", "medico")).toBe("otros_profesionales");
    expect(enrolleeAudience("profesional", "otro")).toBe("otros_profesionales");
  });
  it("is null (undetermined) for professional with no profession yet", () => {
    expect(enrolleeAudience("profesional", "")).toBeNull();
    expect(enrolleeAudience("profesional", null)).toBeNull();
  });
});

describe("visibleAudiences", () => {
  it("shows the single determined audience", () => {
    expect(visibleAudiences("student", null)).toEqual(["estudiante"]);
    expect(visibleAudiences("profesional", "farmaceutico")).toEqual(["farmaceutico_tecnico"]);
    expect(visibleAudiences("profesional", "otro")).toEqual(["otros_profesionales"]);
  });
  it("shows both professional audiences while the profession is unpicked", () => {
    expect(visibleAudiences("profesional", "")).toEqual([
      "farmaceutico_tecnico",
      "otros_profesionales",
    ]);
  });
});

describe("audienceMatches", () => {
  it("is true only when the enrollee's audience equals the cohort's", () => {
    expect(audienceMatches("farmaceutico_tecnico", "profesional", "farmaceutico")).toBe(true);
    expect(audienceMatches("otros_profesionales", "profesional", "farmaceutico")).toBe(false);
    expect(audienceMatches("estudiante", "student", null)).toBe(true);
    expect(audienceMatches("estudiante", "profesional", "medico")).toBe(false);
  });
});

describe("audienceMismatchMessage", () => {
  it("names the cohort audience, localized", () => {
    expect(audienceMismatchMessage("estudiante", "es")).toContain("Estudiantes");
    expect(audienceMismatchMessage("farmaceutico_tecnico", "en")).toContain("Pharmacists");
  });
});

describe("AUDIENCE_LABELS", () => {
  it("covers all three audiences in both locales", () => {
    for (const a of ["farmaceutico_tecnico", "otros_profesionales", "estudiante"] as const) {
      expect(AUDIENCE_LABELS[a].es.length).toBeGreaterThan(0);
      expect(AUDIENCE_LABELS[a].en.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/cohort-audience.test.ts`
Expected: FAIL — module `@/lib/cohorts/audience` not found.

- [ ] **Step 3: Implement the module**

Create `src/lib/cohorts/audience.ts`:

```ts
import { isPharmacyRole } from "@/lib/professions";

/**
 * Cohort audience — who a cohort enrolls. Pure + DB-free (imports only the
 * professions leaf) so it is shared by the admin form, the server enrollment
 * gate, and the client cohort-dropdown filter, and unit-tested independently.
 */
export type CohortAudience =
  | "farmaceutico_tecnico"
  | "otros_profesionales"
  | "estudiante";

export const AUDIENCE_LABELS: Record<CohortAudience, { es: string; en: string }> = {
  farmaceutico_tecnico: { es: "Farmacéuticos y Técnicos", en: "Pharmacists & Technicians" },
  otros_profesionales: { es: "Otros Profesionales", en: "Other Professionals" },
  estudiante: { es: "Estudiantes", en: "Students" },
};

/** Definitive audience for an enrollee, or null when undetermined (a
 *  professional who has not chosen a profession yet). Uses the same
 *  isPharmacyRole predicate that drives CE eligibility. */
export function enrolleeAudience(
  tier: string,
  professionalType: string | null | undefined,
): CohortAudience | null {
  if (tier === "student") return "estudiante";
  if (tier === "profesional") {
    if (!professionalType?.trim()) return null;
    return isPharmacyRole(professionalType) ? "farmaceutico_tecnico" : "otros_profesionales";
  }
  return null;
}

/** Cohort audiences a (possibly incomplete) form selection may enroll into —
 *  used to filter the cohort dropdown. A professional who has not picked a
 *  profession sees both professional audiences until they narrow it. */
export function visibleAudiences(
  tier: string,
  professionalType: string | null | undefined,
): CohortAudience[] {
  const a = enrolleeAudience(tier, professionalType);
  if (a) return [a];
  if (tier === "profesional") return ["farmaceutico_tecnico", "otros_profesionales"];
  return [];
}

/** True when the enrollee's audience matches the cohort's. */
export function audienceMatches(
  cohortAudience: CohortAudience,
  tier: string,
  professionalType: string | null | undefined,
): boolean {
  return enrolleeAudience(tier, professionalType) === cohortAudience;
}

export function audienceMismatchMessage(
  cohortAudience: CohortAudience,
  locale: "es" | "en",
): string {
  const label = AUDIENCE_LABELS[cohortAudience][locale];
  return locale === "en"
    ? `This cohort is for ${label} only.`
    : `Esta cohorte es solo para ${label}.`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/cohort-audience.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cohorts/audience.ts tests/unit/cohort-audience.test.ts
git commit -m "feat(cohorts): pure audience module (enrollee->audience mapping)"
```

---

### Task 2: Schema column + migration + CohortInput

**Files:**
- Modify: `src/lib/db/schema.ts` (near the `cohorts` table, lines 144-157)
- Create: `drizzle/0011_cohort_audience.sql`
- Modify: `src/lib/cohorts.ts:26-33` (`CohortInput`)

**Interfaces:**
- Consumes: `CohortAudience` (Task 1) is NOT imported into schema (the pgEnum literal list stands alone); `cohorts.$inferSelect` (`Cohort`) gains `audience: "farmaceutico_tecnico" | "otros_profesionales" | "estudiante"`.
- Produces: `cohortAudienceEnum`; `cohorts.audience` column; `CohortInput.audience: CohortAudience`.

- [ ] **Step 1: Add the pgEnum + column to the schema**

In `src/lib/db/schema.ts`, immediately above `export const cohorts = pgTable(...)` (line 144), add:

```ts
export const cohortAudienceEnum = pgEnum("cohort_audience", [
  "farmaceutico_tecnico",
  "otros_profesionales",
  "estudiante",
]);
```

Inside the `cohorts` table object (after the `openForEnrollment` line, `:156`), add:

```ts
  /** Who this cohort enrolls. Enforced at enrollment (see lib/cohorts/audience.ts). */
  audience: cohortAudienceEnum("audience").notNull().default("farmaceutico_tecnico"),
```

(`pgEnum` is already imported in this file — it is used by `tierEnum`. If not, add it to the `drizzle-orm/pg-core` import.)

- [ ] **Step 2: Create the hand-authored idempotent migration**

Create `drizzle/0011_cohort_audience.sql`:

```sql
-- Cohort audience: restrict who can enroll into a cohort
-- (farmacéuticos/técnicos, otros profesionales, or estudiantes). Existing
-- cohorts default to 'farmaceutico_tecnico'. Idempotent — safe to re-run.
DO $$ BEGIN
  CREATE TYPE "cohort_audience" AS ENUM ('farmaceutico_tecnico', 'otros_profesionales', 'estudiante');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "audience" "cohort_audience" NOT NULL DEFAULT 'farmaceutico_tecnico';
```

- [ ] **Step 3: Add `audience` to `CohortInput`**

In `src/lib/cohorts.ts`, add the import and the field:

```ts
import type { CohortAudience } from "@/lib/cohorts/audience";
```

In `CohortInput` (`:26-33`), add:

```ts
  audience: CohortAudience;
```

(`createCohort`/`updateCohort` spread `CohortInput` into the insert/update, so they need no change once the field exists.)

- [ ] **Step 4: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: type errors ONLY where `CohortInput` is now missing `audience` (the admin `parseCohort` in Task 3) — that is expected and fixed in Task 3. If any OTHER file errors, investigate. Also run `pnpm lint`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/schema.ts drizzle/0011_cohort_audience.sql src/lib/cohorts.ts
git commit -m "feat(cohorts): audience enum column + migration + CohortInput field"
```

---

### Task 3: Admin action validates audience

**Files:**
- Modify: `src/app/[locale]/(portal)/portal/admin/cohortes/actions.ts:31-65`
- Test: `tests/unit/cohort-action-audience.test.ts` (create)

**Interfaces:**
- Consumes: `CohortInput.audience` (Task 2).
- Produces: `parseCohort(formData)` returns a `CohortInput` including a validated `audience`; exports `CohortFields` for the test.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/cohort-action-audience.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { CohortFields } from "@/app/[locale]/(portal)/portal/admin/cohortes/actions";

const base = {
  courseId: "basic-compounding",
  name: "",
  startDate: "2026-08-12",
  endDate: "2026-08-14",
  capacity: "12",
  openForEnrollment: true,
};

describe("CohortFields audience", () => {
  it("accepts a valid audience", () => {
    expect(CohortFields.safeParse({ ...base, audience: "estudiante" }).success).toBe(true);
  });
  it("rejects an invalid audience", () => {
    expect(CohortFields.safeParse({ ...base, audience: "nope" }).success).toBe(false);
  });
  it("rejects a missing audience", () => {
    expect(CohortFields.safeParse({ ...base }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/cohort-action-audience.test.ts`
Expected: FAIL — `CohortFields` not exported and/or has no `audience`.

- [ ] **Step 3: Add `audience` to the schema + parse, and export CohortFields**

In `src/app/[locale]/(portal)/portal/admin/cohortes/actions.ts`, change `const CohortFields = z.object({…})` to `export const CohortFields = z.object({…})` and add the field (after `openForEnrollment`, `:37`):

```ts
  audience: z.enum(["farmaceutico_tecnico", "otros_profesionales", "estudiante"]),
```

In `parseCohort`, add to the parsed object (`:41-48`):

```ts
    audience: formData.get("audience"),
```

and to the returned `CohortInput` (`:57-64`):

```ts
    audience: f.audience,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/cohort-action-audience.test.ts && pnpm exec tsc --noEmit`
Expected: PASS; tsc now clean (the Task 2 gap is closed).

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(portal)/portal/admin/cohortes/actions.ts" tests/unit/cohort-action-audience.test.ts
git commit -m "feat(admin): validate cohort audience in the cohort action"
```

---

### Task 4: Admin form audience control + list label

**Files:**
- Modify: `src/app/[locale]/(portal)/portal/admin/cohortes/page.tsx:44-113` (fieldset), `:186-193` (list)

**Interfaces:**
- Consumes: `AUDIENCE_LABELS`, `CohortAudience` (Task 1); `Cohort.audience` (Task 2).

- [ ] **Step 1: Add the import**

In `src/app/[locale]/(portal)/portal/admin/cohortes/page.tsx`, add (import only the map — `Cohort.audience` is already typed as the enum union, so no cast/type import is needed):

```ts
import { AUDIENCE_LABELS } from "@/lib/cohorts/audience";
```

- [ ] **Step 2: Add the audience `<select>` to `CohortFieldset`**

Inside `CohortFieldset` (after the capacity `<label>`, before the name `<label>`, ~line 86), add:

```tsx
      <label className="block">
        <span className={labelCls}>Audiencia</span>
        <select
          name="audience"
          required
          defaultValue={cohort?.audience ?? "farmaceutico_tecnico"}
          className={inputCls}
        >
          {(["farmaceutico_tecnico", "otros_profesionales", "estudiante"] as const).map(
            (a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABELS[a].es}
              </option>
            ),
          )}
        </select>
      </label>
```

- [ ] **Step 3: Show the audience label in the cohort list**

In the existing cohort list, change the meta line (`:190-193`) to include the audience:

```tsx
                  <p className="text-gray-700 text-xs">
                    {AUDIENCE_LABELS[c.audience].es} ·{" "}
                    {enrolled} / {c.capacity} inscrito{enrolled === 1 ? "" : "s"} ·{" "}
                    {c.openForEnrollment ? "Abierto" : "Cerrado"}
                  </p>
```

- [ ] **Step 4: Verify**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm vitest run`
Expected: all clean/green (no new tests here — the RSC form is exercised in Task 8 manual QA).

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(portal)/portal/admin/cohortes/page.tsx"
git commit -m "feat(admin): audience select in cohort form + label in list"
```

---

### Task 5: Server enrollment gate

**Files:**
- Modify: `src/app/api/inscripcion/route.ts` (after cohort resolution, ~`:149-153`)

**Interfaces:**
- Consumes: `enrolleeAudience`, `audienceMismatchMessage` (Task 1); `cohort.audience` (Task 2); `data.tier`, `data.tipo_profesional`, `data.locale` (already parsed).

- [ ] **Step 1: Add the import**

In `src/app/api/inscripcion/route.ts`, add:

```ts
import { enrolleeAudience, audienceMismatchMessage } from "@/lib/cohorts/audience";
```

- [ ] **Step 2: Add the gate after the cohort is resolved**

The block at `:146-153` resolves `course` + `cohort` and checks course match, then `:151-153` checks `openForEnrollment`. Immediately AFTER the `openForEnrollment` check, add:

```ts
  const wanted = enrolleeAudience(data.tier, data.tipo_profesional);
  if (!wanted || cohort.audience !== wanted) {
    return NextResponse.json(
      { error: audienceMismatchMessage(cohort.audience, data.locale === "en" ? "en" : "es") },
      { status: 400 },
    );
  }
```

- [ ] **Step 3: Add a focused test for the gate decision**

The gate reuses `audienceMatches`/`enrolleeAudience` (already unit-tested in Task 1) plus a trivial `!==`. Add one integration-style assertion of the WIRING to `tests/unit/cohort-audience.test.ts` — that a student enrolling into a professional cohort is a mismatch and a matching pair is not:

```ts
import { audienceMatches } from "@/lib/cohorts/audience";

describe("enrollment gate decision", () => {
  it("blocks a student from a farmaceutico_tecnico cohort", () => {
    expect(audienceMatches("farmaceutico_tecnico", "student", null)).toBe(false);
  });
  it("allows a matching professional", () => {
    expect(audienceMatches("otros_profesionales", "profesional", "medico")).toBe(true);
  });
});
```

(If `audienceMatches` is already imported at the top of the file, don't re-import.)

- [ ] **Step 4: Verify**

Run: `pnpm vitest run tests/unit/cohort-audience.test.ts && pnpm exec tsc --noEmit && pnpm lint`
Expected: PASS/clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/inscripcion/route.ts tests/unit/cohort-audience.test.ts
git commit -m "feat(inscripcion): reject enrollment into a mismatched-audience cohort"
```

---

### Task 6: Student pay-path defense (checkout + pagar)

**Files:**
- Modify: `src/lib/inscripcion/checkout.ts` (CheckoutOutcome reason union + the cohort check ~`:61-63`)
- Modify: `src/app/api/inscripcion/pagar/route.ts:31-35`

**Interfaces:**
- Consumes: `cohort.audience` (Task 2).
- Produces: `CheckoutOutcome` gains reason `"audience-mismatch"`.

- [ ] **Step 1: Add the reason + check in checkout.ts**

In `src/lib/inscripcion/checkout.ts`, add `"audience-mismatch"` to the `reason` union of `CheckoutOutcome` (the `{ ok: false; reason: … }` list). Then, right after the existing cohort-open check (`if (!cohort || !cohort.openForEnrollment) return { ok: false, reason: "cohort-closed" };`, ~`:62`), add:

```ts
  if (cohort.audience !== "estudiante") {
    return { ok: false, reason: "audience-mismatch" };
  }
```

- [ ] **Step 2: Map the reason in the pagar route**

In `src/app/api/inscripcion/pagar/route.ts`, extend the reason map (`:31-35`) so the new reason routes to the "cerrada" page:

```ts
    const reason =
      outcome.reason === "already-paid" ? "pagado"
      : outcome.reason === "cohort-closed" ? "cerrada"
      : outcome.reason === "audience-mismatch" ? "cerrada"
      : outcome.reason === "not-approved" ? "invalido"
      : "error";
```

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm vitest run`
Expected: clean/green. (This is a defensive edge; no new unit test — a student row can only hold a student cohort once Task 5 gates enrollment.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/inscripcion/checkout.ts src/app/api/inscripcion/pagar/route.ts
git commit -m "feat(inscripcion): student pay-path rejects a non-student cohort (defense in depth)"
```

---

### Task 7: Client cohort-dropdown filter

**Files:**
- Modify: `src/components/marketing/inscripcion/InscripcionForm.tsx` (`CohortOption` type `:22-26`; `availableCohorts` memo `:71-75`; add a reset effect)
- Modify: `src/app/[locale]/(marketing)/inscripcion/page.tsx:45-50` (map `audience` into `CohortOption`)
- Test: `tests/components/InscripcionCohortFilter.test.tsx` (create)

**Interfaces:**
- Consumes: `visibleAudiences`, `CohortAudience` (Task 1); `Cohort.audience` (Task 2).
- Produces: `CohortOption` gains `audience: CohortAudience`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/InscripcionCohortFilter.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { InscripcionForm } from "@/components/marketing/inscripcion/InscripcionForm";

const cohorts = [
  { id: "pro", courseId: "basic-compounding", label: "Cohorte PRO", audience: "farmaceutico_tecnico" as const },
  { id: "stu", courseId: "basic-compounding", label: "Cohorte EST", audience: "estudiante" as const },
];

function renderForm(tier: "profesional" | "student", prof?: "farmaceutico" | "otro") {
  return render(
    <NextIntlClientProvider locale="es" messages={esMessages}>
      <InscripcionForm
        locale="es"
        preselectedTier={tier}
        preselectedProf={prof}
        cohorts={cohorts}
        docsVersion="2026-01-01"
      />
    </NextIntlClientProvider>,
  );
}

describe("cohort dropdown filters by audience", () => {
  it("student tier lists only the estudiante cohort", () => {
    renderForm("student");
    expect(screen.queryByRole("option", { name: "Cohorte EST" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Cohorte PRO" })).toBeNull();
  });
  it("profesional + otro sees no cohort (only a farmaceutico_tecnico one exists)", () => {
    // An 'otro' professional's audience is otros_profesionales; the fixture has
    // no cohort for it, so neither the PRO (farm/téc) nor EST option shows.
    renderForm("profesional", "otro");
    expect(screen.queryByRole("option", { name: "Cohorte PRO" })).toBeNull();
    expect(screen.queryByRole("option", { name: "Cohorte EST" })).toBeNull();
  });
  it("profesional + farmaceutico lists the farmaceutico_tecnico cohort", () => {
    renderForm("profesional", "farmaceutico");
    expect(screen.queryByRole("option", { name: "Cohorte PRO" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Cohorte EST" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/components/InscripcionCohortFilter.test.tsx`
Expected: FAIL — `CohortOption` has no `audience` (type error) and/or the dropdown lists all cohorts.

- [ ] **Step 3: Extend `CohortOption` + filter + reset**

In `src/components/marketing/inscripcion/InscripcionForm.tsx`:

Add the import:

```ts
import { visibleAudiences, type CohortAudience } from "@/lib/cohorts/audience";
```

Extend `CohortOption` (`:21-26`):

```ts
export type CohortOption = {
  id: string;
  courseId: string;
  label: string;
  audience: CohortAudience;
};
```

Replace the `availableCohorts` memo (`:71-75`) so it also filters by audience (compute the audiences from the current `tier` + `profesion` — note `profesion` is defined lower in the component via `resolveProfesion`, so move the `availableCohorts` memo to AFTER the `profesion` declaration, or inline `visibleAudiences(tier, profesion)`):

```ts
  const availableCohorts = useMemo(
    () =>
      cohorts.filter(
        (c) =>
          c.courseId === courseId &&
          visibleAudiences(tier, profesion).includes(c.audience),
      ),
    [courseId, cohorts, tier, profesion],
  );
```

Add a reset effect so a now-invalid selected cohort clears (add `useEffect` to the React import). Place it after `availableCohorts` and the `cohorteId` state:

```ts
  useEffect(() => {
    if (!availableCohorts.some((c) => c.id === cohorteId)) {
      setCohorteId(availableCohorts[0]?.id ?? "");
    }
  }, [availableCohorts, cohorteId]);
```

Note: ensure `profesion` (the `resolveProfesion(...)` const) is declared BEFORE `availableCohorts`; reorder if necessary. `useEffect` must be added to `import { useState, useMemo, useEffect } from "react";`.

- [ ] **Step 4: Map `audience` into the page's CohortOption**

In `src/app/[locale]/(marketing)/inscripcion/page.tsx`, the cohort mapper (`:45-50`) currently maps `{ id, courseId, label }`. Add `audience`:

```ts
  const cohorts: CohortOption[] = openCohorts.map((c) => ({
    id: c.id,
    courseId: c.courseId,
    label: formatCohortLabel(c, loc),
    audience: c.audience,
  }));
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run tests/components/InscripcionCohortFilter.test.tsx && pnpm exec tsc --noEmit && pnpm lint`
Expected: PASS/clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/marketing/inscripcion/InscripcionForm.tsx "src/app/[locale]/(marketing)/inscripcion/page.tsx" tests/components/InscripcionCohortFilter.test.tsx
git commit -m "feat(inscripcion): filter cohort dropdown by the enrollee's audience"
```

---

### Task 8: Full verification + migration application gate

**Files:** none (verification + operational).

- [ ] **Step 1: Full suite + typecheck + lint**

Run: `pnpm vitest run`
Then: `pnpm exec tsc --noEmit`
Then: `pnpm lint`
Expected: all green/clean; the existing cohort/enrollment tests (`webhook-stripe-route`, `pagar-route`, `inscripcion-*`) stay green.

- [ ] **Step 2: Apply the migration to the Neon DB (OWNER gate — before preview/prod use)**

The new code SELECTs the `audience` column, so the DB must have it. The migration is backward-compatible (adds a defaulted column the old code ignores), so it is safe to apply to the **prod-main Neon branch first** — preview branches fork from it and inherit the column. Owner runs this raw SQL in the Neon console (idempotent — safe to re-run):

```sql
DO $$ BEGIN
  CREATE TYPE "cohort_audience" AS ENUM ('farmaceutico_tecnico', 'otros_profesionales', 'estudiante');
EXCEPTION WHEN duplicate_object THEN null; END $$;
ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "audience" "cohort_audience" NOT NULL DEFAULT 'farmaceutico_tecnico';
```

Verify: `SELECT id, audience FROM cohorts;` — existing cohorts show `farmaceutico_tecnico`. Record in the PR that the migration was applied.

- [ ] **Step 3: Manual QA on the Vercel preview** (after Step 2, so the preview's Neon branch has the column)

1. `/portal/admin/cohortes` (as an ADMIN email) — the create + edit forms show the **Audiencia** select; the cohort list shows the audience label. Create a `estudiante` cohort and set the existing one's audience.
2. Enroll flow — from the **Estudiantes** card, the cohort dropdown lists only estudiante cohorts; from **Farmacéuticos**, only farmaceutico_tecnico cohorts; from **Otros Profesionales**, only otros cohorts (or "no hay cohortes" if none open for that audience).
3. Force a mismatch via direct API (`curl` the preview if reachable, or trust the unit gate) — a student payload into a professional cohort returns "Esta cohorte es solo para …".

- [ ] **Step 4: Push the branch**

```bash
git push -u origin feat/cohort-audience
```

---

## Notes for the implementer

- `lib/cohorts/audience.ts` stays DB-free; never import `@/lib/cohorts` or `@/lib/db` into it (that would pull the DB into the client form). The client form imports the pure helpers directly.
- The audience↔CE consistency is intentional: `farmaceutico_tecnico` cohort ⇔ CE-eligible enrollees (both use `isPharmacyRole`). Don't fork the predicate.
- Enum string literals are exact and appear in five places (schema pgEnum, migration SQL, `CohortAudience` type, admin Zod enum, admin select options) — keep them byte-identical.
