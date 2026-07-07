# Featured Cohort on Landing + Public Audience Label — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the admin mark a cohort "featured on the landing" (per-cohort checkbox), and show that featured cohort on the landing "next cohort" band with its audience label ("Para Farmacéuticos y Técnicos" / "Para Estudiantes" / "Para Otros Profesionales").

**Architecture:** A `featured` boolean column on `cohorts`; a pure `pickFeaturedCohort` helper the landing uses to choose the earliest-open-featured cohort (fallback earliest open); the admin form gains a checkbox; the `CohortWaitlist` band renders the shown cohort's audience label using the existing `AUDIENCE_LABELS` map.

**Tech Stack:** Next.js (App Router, RSC + server actions), Drizzle ORM (Postgres/Neon), Zod, next-intl (es/en), Vitest + @testing-library/react.

## Global Constraints

- New column: `featured boolean NOT NULL DEFAULT false` on `cohorts`.
- Migration is HAND-AUTHORED + idempotent (`ADD COLUMN IF NOT EXISTS`). Do **NOT** run `pnpm db:generate`.
- Featured selection: **earliest OPEN featured cohort, else earliest open** (multiple featured allowed; no single-featured enforcement). `listOpenCohorts` returns cohorts ordered earliest-first.
- Audience labels come from `AUDIENCE_LABELS` in `@/lib/cohorts/audience` (pure, DB-free — safe to import into the `CohortWaitlist` client component). Audience enum values: `farmaceutico_tecnico`, `otros_profesionales`, `estudiante`.
- The admin Zod schema lives in `src/app/[locale]/(portal)/portal/admin/cohortes/fields.ts` (NOT in the `"use server"` `actions.ts` — a `"use server"` file may only export async functions).
- i18n mirrored: `cohort.audienceLine` in both `messages/es.json` and `messages/en.json`.
- Migration is a runtime gate — apply `0012` to Neon prod-main before deploy (Task 5).
- Branch `feat/cohort-featured-landing` (not `main`). Test cmd `pnpm vitest run <path>`; full `pnpm vitest run`; `pnpm exec tsc --noEmit`; `pnpm lint`; and `pnpm build` in Task 5.

---

### Task 1: Pure `pickFeaturedCohort` helper

**Files:**
- Create: `src/lib/cohorts/featured.ts`
- Test: `tests/unit/pick-featured-cohort.test.ts`

**Interfaces:**
- Produces: `pickFeaturedCohort<T extends { featured: boolean }>(openCohorts: readonly T[]): T | undefined`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/pick-featured-cohort.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { pickFeaturedCohort } from "@/lib/cohorts/featured";

const c = (id: string, featured: boolean) => ({ id, featured });

describe("pickFeaturedCohort", () => {
  it("returns the earliest featured cohort when one is featured", () => {
    expect(pickFeaturedCohort([c("a", false), c("b", true), c("c", false)])?.id).toBe("b");
  });
  it("returns the earliest featured when several are featured (list is earliest-first)", () => {
    expect(pickFeaturedCohort([c("a", false), c("b", true), c("c", true)])?.id).toBe("b");
  });
  it("falls back to the earliest open cohort when none is featured", () => {
    expect(pickFeaturedCohort([c("a", false), c("b", false)])?.id).toBe("a");
  });
  it("returns undefined for an empty list", () => {
    expect(pickFeaturedCohort([])).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/pick-featured-cohort.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/cohorts/featured.ts`:

```ts
/**
 * Which cohort the public landing highlights: the earliest OPEN featured cohort,
 * else the earliest open one. `openCohorts` is already ordered earliest-first
 * (listOpenCohorts orders by startDate). Pure + DB-free so it is unit-testable.
 */
export function pickFeaturedCohort<T extends { featured: boolean }>(
  openCohorts: readonly T[],
): T | undefined {
  return openCohorts.find((cohort) => cohort.featured) ?? openCohorts[0];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/pick-featured-cohort.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cohorts/featured.ts tests/unit/pick-featured-cohort.test.ts
git commit -m "feat(cohorts): pickFeaturedCohort helper (landing highlight selection)"
```

---

### Task 2: Schema column + migration + CohortInput

**Files:**
- Modify: `src/lib/db/schema.ts` (cohorts table, after `openForEnrollment`, ~line 156)
- Create: `drizzle/0012_cohort_featured.sql`
- Modify: `src/lib/cohorts.ts` (`CohortInput`, ~lines 26-33)

**Interfaces:**
- Produces: `cohorts.featured` column; `Cohort.featured: boolean` (via `$inferSelect`); `CohortInput.featured: boolean`.

- [ ] **Step 1: Add the column to the schema**

In `src/lib/db/schema.ts`, inside the `cohorts` table object, after the `openForEnrollment` line, add:

```ts
  /** Highlighted on the public landing "next cohort" band. See lib/cohorts/featured.ts. */
  featured: boolean("featured").notNull().default(false),
```

(`boolean` is already imported from `drizzle-orm/pg-core` — used by `openForEnrollment`.)

- [ ] **Step 2: Create the idempotent migration**

Create `drizzle/0012_cohort_featured.sql`:

```sql
-- Featured cohort: the one highlighted on the public landing "next cohort"
-- band. Idempotent — safe to re-run.
ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false;
```

- [ ] **Step 3: Add `featured` to `CohortInput`**

In `src/lib/cohorts.ts`, add to `CohortInput` (after `openForEnrollment`):

```ts
  featured: boolean;
```

(`CohortInput` already uses `boolean` for `openForEnrollment` — the TS `boolean` type, no import needed.)

- [ ] **Step 4: Verify typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: type errors ONLY in `src/app/[locale]/(portal)/portal/admin/cohortes/actions.ts` — its `parseCohort` returns a `CohortInput` now missing `featured`. That is EXPECTED and fixed in Task 3. If any OTHER file errors, investigate. Then `pnpm lint`, and `pnpm vitest run` (stays green — no test touches the column yet).

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/schema.ts drizzle/0012_cohort_featured.sql src/lib/cohorts.ts
git commit -m "feat(cohorts): featured boolean column + migration + CohortInput field"
```

---

### Task 3: Admin — validate + collect `featured`

**Files:**
- Modify: `src/app/[locale]/(portal)/portal/admin/cohortes/fields.ts`
- Modify: `src/app/[locale]/(portal)/portal/admin/cohortes/actions.ts` (`parseCohort`)
- Modify: `src/app/[locale]/(portal)/portal/admin/cohortes/page.tsx` (`CohortFieldset`)
- Test: `tests/unit/cohort-action-audience.test.ts` (extend)

**Interfaces:**
- Consumes: `CohortInput.featured` (Task 2).
- Produces: `CohortFields` validates `featured: boolean`; `parseCohort` returns it; the admin form submits it.

- [ ] **Step 1: Extend the failing test**

Add to `tests/unit/cohort-action-audience.test.ts` (the `base` object there already exists; add a describe):

```ts
describe("CohortFields featured", () => {
  const base = {
    courseId: "basic-compounding",
    name: "",
    startDate: "2026-08-12",
    endDate: "2026-08-14",
    capacity: "12",
    openForEnrollment: true,
    audience: "estudiante",
  };
  it("accepts featured true/false", () => {
    expect(CohortFields.safeParse({ ...base, featured: true }).success).toBe(true);
    expect(CohortFields.safeParse({ ...base, featured: false }).success).toBe(true);
  });
  it("rejects a missing featured", () => {
    expect(CohortFields.safeParse({ ...base }).success).toBe(false);
  });
});
```

(If `CohortFields` isn't imported at the top of this test file, add `import { CohortFields } from "@/app/[locale]/(portal)/portal/admin/cohortes/fields";`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/cohort-action-audience.test.ts`
Expected: FAIL — `CohortFields` has no `featured`.

- [ ] **Step 3: Add `featured` to the schema, parse, and form**

In `fields.ts`, add to `CohortFields` (after `audience`):

```ts
  featured: z.boolean(),
```

In `actions.ts` `parseCohort`, add to the parsed object (checkbox → boolean, mirroring `openForEnrollment`):

```ts
    featured: formData.get("featured") === "on",
```

and to the returned `CohortInput`:

```ts
    featured: f.featured,
```

In `page.tsx` `CohortFieldset`, after the "Abierto para inscripción" checkbox label, add:

```tsx
      <label className="flex items-center gap-2 text-sm text-gray-900">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={cohort?.featured ?? false}
          className="h-4 w-4 accent-teal-deep"
        />
        Destacar en el landing
      </label>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/cohort-action-audience.test.ts && pnpm exec tsc --noEmit && pnpm lint`
Expected: PASS; tsc now clean (Task 2's gap closed).

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(portal)/portal/admin/cohortes/fields.ts" "src/app/[locale]/(portal)/portal/admin/cohortes/actions.ts" "src/app/[locale]/(portal)/portal/admin/cohortes/page.tsx" tests/unit/cohort-action-audience.test.ts
git commit -m "feat(admin): 'Destacar en el landing' checkbox + validation"
```

---

### Task 4: Landing highlight + public audience label

**Files:**
- Modify: `src/app/[locale]/(marketing)/page.tsx` (cohort selection + prop)
- Modify: `src/components/marketing/CohortWaitlist.tsx` (audience prop + label)
- Modify: `src/messages/es.json`, `src/messages/en.json` (`cohort.audienceLine`)
- Test: `tests/components/CohortWaitlistAudience.test.tsx` (create)

**Interfaces:**
- Consumes: `pickFeaturedCohort` (Task 1); `Cohort.audience`/`.featured` (Task 2); `AUDIENCE_LABELS`, `CohortAudience` (existing `@/lib/cohorts/audience`).
- Produces: `CohortWaitlist` prop `audience: CohortAudience | null`.

- [ ] **Step 1: Add the i18n key (es + en)**

In `src/messages/es.json`, under the `cohort` object (alongside `eyebrow`/`headingFallback`/`description`), add:

```json
"audienceLine": "Para {label}",
```

In `src/messages/en.json`, under `cohort`:

```json
"audienceLine": "For {label}",
```

- [ ] **Step 2: Write the failing test**

Create `tests/components/CohortWaitlistAudience.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { CohortWaitlist } from "@/components/marketing/CohortWaitlist";

function renderBand(audience: "farmaceutico_tecnico" | "otros_profesionales" | "estudiante" | null) {
  return render(
    <NextIntlClientProvider locale="es" messages={esMessages}>
      <CohortWaitlist total={12} remaining={5} cohortLabel="12–14 de agosto de 2026" audience={audience} />
    </NextIntlClientProvider>,
  );
}

describe("CohortWaitlist audience label", () => {
  it("shows the student audience line", () => {
    renderBand("estudiante");
    expect(screen.getByText("Para Estudiantes")).toBeTruthy();
  });
  it("shows the pharmacist/tech audience line", () => {
    renderBand("farmaceutico_tecnico");
    expect(screen.getByText("Para Farmacéuticos y Técnicos")).toBeTruthy();
  });
  it("shows no audience line when audience is null", () => {
    const { container } = renderBand(null);
    expect(container.textContent).not.toContain("Para ");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run tests/components/CohortWaitlistAudience.test.tsx`
Expected: FAIL — `CohortWaitlist` has no `audience` prop (type error) / no label rendered.

- [ ] **Step 4: Add the audience prop + label to `CohortWaitlist`**

In `src/components/marketing/CohortWaitlist.tsx`:

Add the import (after the existing imports):

```ts
import { AUDIENCE_LABELS, type CohortAudience } from "@/lib/cohorts/audience";
```

Add `audience` to the props type and destructuring (the component signature is `export function CohortWaitlist({ total, remaining, cohortLabel }: { total: number | null; remaining: number | null; cohortLabel: string | null })`):

```ts
export function CohortWaitlist({
  total,
  remaining,
  cohortLabel,
  audience,
}: {
  total: number | null;
  remaining: number | null;
  cohortLabel: string | null;
  audience: CohortAudience | null;
}) {
```

Immediately AFTER the `<h2>…{cohortLabel ?? t("headingFallback")}…</h2>` block (before the description `<p>`), add:

```tsx
            {audience && (
              <p className="font-heading mt-2 text-sm font-semibold" style={{ color: "rgba(230,234,130,0.85)" }}>
                {t("audienceLine", { label: AUDIENCE_LABELS[audience][locale === "en" ? "en" : "es"] })}
              </p>
            )}
```

(The component already has `locale` from `useLocale()` and `t` from `useTranslations("cohort")`.)

- [ ] **Step 5: Wire the landing page**

In `src/app/[locale]/(marketing)/page.tsx`:

Add the import:

```ts
import { pickFeaturedCohort } from "@/lib/cohorts/featured";
```

Replace `const next = openCohorts[0];` with:

```ts
  const next = pickFeaturedCohort(openCohorts);
```

Add the `audience` prop to the `<CohortWaitlist>` usage:

```tsx
      <CohortWaitlist
        total={seatTotal}
        remaining={seatRemaining}
        cohortLabel={cohortLabel}
        audience={next?.audience ?? null}
      />
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run tests/components/CohortWaitlistAudience.test.tsx && pnpm exec tsc --noEmit && pnpm lint`
Expected: PASS/clean.

- [ ] **Step 7: Commit**

```bash
git add "src/app/[locale]/(marketing)/page.tsx" src/components/marketing/CohortWaitlist.tsx src/messages/es.json src/messages/en.json tests/components/CohortWaitlistAudience.test.tsx
git commit -m "feat(landing): highlight featured cohort + show its audience label"
```

---

### Task 5: Full verification + migration application gate

**Files:** none (verification + operational).

- [ ] **Step 1: Full suite + typecheck + lint**

Run: `pnpm vitest run`
Then: `pnpm exec tsc --noEmit`
Then: `pnpm lint`
Expected: all green/clean.

- [ ] **Step 2: Production build (catches App Router build-only errors)**

Run: `pnpm build`
Expected: build completes (exit 0, route table printed). A later `NeonDbError: fetch failed` from `listOpenCohortsSafe`'s fallback is fine locally (no DATABASE_URL); the build must NOT fail with an `invalid-use-server-value` or "Failed to collect page data" error. If it does, fix before proceeding.

- [ ] **Step 3: Apply the migration to Neon (OWNER gate — before preview/prod use)**

The new code SELECTs the `featured` column, so the DB must have it. Backward-compatible (defaulted column the old code ignores) — apply to the prod-main Neon branch first; preview branches inherit it. Owner runs (idempotent):

```sql
ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false;
```

Verify: `SELECT id, name, featured FROM cohorts;` — existing cohorts show `featured = false`. Record in the PR.

- [ ] **Step 4: Manual QA on the Vercel preview** (after Step 3)

1. `/portal/admin/cohortes` — the create + edit forms show the **"Destacar en el landing"** checkbox. Mark one open cohort featured.
2. Landing (`/es`) `#cohort` band — shows the featured cohort's date + its audience line ("Para …"). Unmark it → the band falls back to the earliest open cohort.

- [ ] **Step 5: Push the branch**

```bash
git push -u origin feat/cohort-featured-landing
```

---

## Notes for the implementer

- Keep `src/lib/cohorts/featured.ts` DB-free (no imports) — it is generic over `{ featured: boolean }` and used by both the RSC page and its unit test.
- `CohortWaitlist` is a client component; `@/lib/cohorts/audience` is pure (imports only `@/lib/professions`), so importing `AUDIENCE_LABELS` there pulls no server-only/DB code.
- Enum string literals (`farmaceutico_tecnico`, `otros_profesionales`, `estudiante`) must stay byte-identical to the existing audience module and schema.
