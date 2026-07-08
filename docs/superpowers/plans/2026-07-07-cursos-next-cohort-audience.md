# Per-audience "next cohort" on /cursos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each `/cursos` course card shows the next OPEN cohort of ITS audience, labeled ("Próxima cohorte: agosto 2026 · para Farmacéuticos y Técnicos").

**Architecture:** Add an `audience` to each `cursosGrid.items[]` (i18n) and to `CohortBrief`; `nextCohortLabel` filters cohorts by course **and** audience, resolving the cohort courseId via `enrollCourseId ?? courseRef ?? id` (all cards → `basic-compounding`); the footer appends the audience label from `AUDIENCE_LABELS`.

**Tech Stack:** Next.js (App Router, RSC), next-intl (es/en), Vitest + @testing-library/react.

## Global Constraints

- Audience values are exactly `farmaceutico_tecnico`, `otros_profesionales`, `estudiante` (from `@/lib/cohorts/audience`).
- Item→audience: `basic-compounding`→`farmaceutico_tecnico`; `otros-profesionales`→`otros_profesionales`; `student-foundations`→`estudiante`.
- The cohort-lookup courseId is `course.enrollCourseId ?? course.courseRef ?? course.id` (all three items resolve to `basic-compounding` — the real cohort courseId). This is SEPARATE from the ACPE/`getCourseById` resolution (`course.courseRef ?? course.id`), which stays unchanged.
- i18n mirrored: the three items' `audience` field and `cursosGrid.cohortAudience` (`"para {label}"` es / `"for {label}"` en) in BOTH `messages/es.json` and `messages/en.json`.
- No DB migration (reuses the deployed `audience` column). Only `/cursos` affected (`CohortBrief` is imported only by `cursos/page.tsx`; the landing uses `CursosHome`, not `CursosGrid`).
- Branch `feat/cursos-cohort-audience` (not `main`). `pnpm vitest run <path>`; full `pnpm vitest run`; `pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm build` in Task 2.

---

### Task 1: Per-audience next cohort + label

**Files:**
- Modify: `src/components/marketing/CursosGrid.tsx` (imports; `CohortBrief`; `CourseItem`; `nextCohortLabel`; the `cohortMonth` call; the footer label)
- Modify: `src/app/[locale]/(marketing)/cursos/page.tsx` (map `audience` into `CohortBrief`)
- Modify: `src/messages/es.json`, `src/messages/en.json` (3 items' `audience` + `cursosGrid.cohortAudience`)
- Test: `tests/components/CursosGridNextCohort.test.tsx` (create)

**Interfaces:**
- Consumes: `AUDIENCE_LABELS`, `CohortAudience` from `@/lib/cohorts/audience`; `Cohort.audience` (existing DB column).
- Produces: `CohortBrief` gains `audience: CohortAudience`; `nextCohortLabel(courseId: string, audience: CohortAudience): string | null`.

- [ ] **Step 1: Add the i18n data (both locales)**

In `src/messages/es.json`, add `"audience": "..."` to each of the three `cursosGrid.items[]` entries:
- the `basic-compounding` item → `"audience": "farmaceutico_tecnico"`
- the `student-foundations` item → `"audience": "estudiante"`
- the `otros-profesionales` item → `"audience": "otros_profesionales"`

And add, under `cursosGrid` (alongside `nextCohortLabel`):

```json
"cohortAudience": "para {label}",
```

Mirror ALL of the above in `src/messages/en.json` — same three `audience` values (non-translatable), and `"cohortAudience": "for {label}"`.

- [ ] **Step 2: Write the failing test**

Create `tests/components/CursosGridNextCohort.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { CursosGrid } from "@/components/marketing/CursosGrid";

const openCohorts = [
  { courseId: "basic-compounding", startDate: "2026-08-12", audience: "farmaceutico_tecnico" as const },
  { courseId: "basic-compounding", startDate: "2026-08-19", audience: "estudiante" as const },
];

function card(title: string): HTMLElement {
  const el = screen.getByText(title).closest("article");
  if (!el) throw new Error(`card not found: ${title}`);
  return el;
}

describe("CursosGrid per-audience next cohort", () => {
  it("shows each card's own audience cohort + label", () => {
    render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <CursosGrid openCohorts={openCohorts} />
      </NextIntlClientProvider>,
    );

    const farm = card("Compounding No Estéril Básico — Farmacéuticos y Técnicos");
    expect(within(farm).getByText(/agosto/)).toBeTruthy();
    expect(farm.textContent).toContain("para Farmacéuticos y Técnicos");

    const student = card("Track de Estudiantes — Compounding No Estéril");
    expect(student.textContent).toContain("agosto");
    expect(student.textContent).toContain("para Estudiantes");

    // Otros Profesionales has no matching open cohort in the fixture →
    // no "Próxima cohorte" line at all.
    const otros = card("Otros Profesionales");
    expect(otros.textContent).not.toContain("Próxima cohorte");
    expect(otros.textContent).not.toContain("para Otros Profesionales");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run tests/components/CursosGridNextCohort.test.tsx`
Expected: FAIL — `CursosGrid` doesn't filter by audience / render the label yet (and `CohortBrief`/`CourseItem` lack `audience`).

- [ ] **Step 4: Implement in `CursosGrid.tsx`**

Add the import (after the existing `getCourseById` import, ~line 5):

```ts
import { AUDIENCE_LABELS, type CohortAudience } from "@/lib/cohorts/audience";
```

Extend `CohortBrief` (~lines 9-13):

```ts
export type CohortBrief = {
  courseId: string;
  /** ISO date (yyyy-mm-dd) of the cohort's first day. */
  startDate: string;
  audience: CohortAudience;
};
```

Extend `CourseItem` (add to the type, ~lines 22-34):

```ts
  audience: CohortAudience;
```

Change `nextCohortLabel` to filter by audience (~lines 62-73):

```ts
  function nextCohortLabel(courseId: string, audience: CohortAudience): string | null {
    // `openCohorts` arrives ordered earliest-first, so the first match is the
    // upcoming cohort for this course + audience.
    const cohort = openCohorts.find(
      (c) => c.courseId === courseId && c.audience === audience,
    );
    if (!cohort) return null;
    return new Intl.DateTimeFormat(locale === "es" ? "es-PR" : "en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(cohort.startDate));
  }
```

Change the `cohortMonth` computation inside `items.map` (currently `const cohortMonth = nextCohortLabel(course.courseRef ?? course.id);`) to resolve the cohort courseId via `enrollCourseId` and pass the audience:

```ts
            const cohortMonth = nextCohortLabel(
              course.enrollCourseId ?? course.courseRef ?? course.id,
              course.audience,
            );
```

In the footer, append the audience label inside the existing `{cohortMonth && (…)}` block — after the month `<span>`, still inside the `<p>`:

```tsx
                          {cohortMonth && (
                            <p className="text-gray-700 font-heading mt-1 text-xs font-medium tracking-wide uppercase">
                              {t("nextCohortLabel")}{" "}
                              <span className="text-gray-900 font-semibold capitalize">
                                {cohortMonth}
                              </span>
                              {" · "}
                              {t("cohortAudience", {
                                label: AUDIENCE_LABELS[course.audience][locale === "es" ? "es" : "en"],
                              })}
                            </p>
                          )}
```

- [ ] **Step 5: Map `audience` in the /cursos page**

In `src/app/[locale]/(marketing)/cursos/page.tsx`, the cohort mapper builds `CohortBrief[]`. Add `audience`:

```ts
  const cohortsForGrid: CohortBrief[] = openCohorts.map((c) => ({
    courseId: c.courseId,
    startDate: c.startDate.toISOString().slice(0, 10),
    audience: c.audience,
  }));
```

- [ ] **Step 6: Fix the existing CursosGrid test fixture**

`tests/components/CursosGrid.test.tsx` (pre-existing) renders `<CursosGrid openCohorts={[{ courseId: "basic-compounding", startDate: "2026-09-01" }]} />`. `CohortBrief` now requires `audience`, so tsc will error on that literal. Add `audience: "farmaceutico_tecnico"` to that cohort fixture:

```tsx
      <CursosGrid openCohorts={[{ courseId: "basic-compounding", startDate: "2026-09-01", audience: "farmaceutico_tecnico" }]} />
```

(This keeps that existing test — which checks the Otros Profesionales card's no-CE note and cohort resolution — green; the exact line may differ slightly, match the real one.)

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm vitest run tests/components/CursosGridNextCohort.test.tsx tests/components/CursosGrid.test.tsx && pnpm exec tsc --noEmit && pnpm lint`
Expected: PASS/clean.

- [ ] **Step 8: Commit**

```bash
git add src/components/marketing/CursosGrid.tsx "src/app/[locale]/(marketing)/cursos/page.tsx" src/messages/es.json src/messages/en.json tests/components/CursosGridNextCohort.test.tsx tests/components/CursosGrid.test.tsx
git commit -m "feat(cursos): per-audience next-cohort date + audience label"
```

---

### Task 2: Full verification

**Files:** none (verification).

- [ ] **Step 1: Full suite + typecheck + lint**

Run: `pnpm vitest run`
Then: `pnpm exec tsc --noEmit`
Then: `pnpm lint`
Expected: all green/clean (the existing `CursosGrid.test.tsx` fixture was updated in Task 1 Step 6).

- [ ] **Step 2: Production build**

Run: `pnpm build`
Expected: build completes (exit 0, route table printed). A later `NeonDbError` from `listOpenCohortsSafe`'s fallback is fine locally; the build must NOT fail with a page-collection error.

- [ ] **Step 3: Manual QA on the Vercel preview**

`/es/cursos` — the Farmacéuticos y Técnicos card shows the next farm/téc cohort's month + "para Farmacéuticos y Técnicos"; the Estudiantes card shows the next student cohort's month + "para Estudiantes"; the Otros Profesionales card shows a next-cohort line only if an otros cohort is open (else none).

- [ ] **Step 4: Push the branch**

```bash
git push -u origin feat/cursos-cohort-audience
```

---

## Notes for the implementer

- The cohort-lookup courseId (`enrollCourseId ?? courseRef ?? id`) intentionally differs from the ACPE/`getCourseById` resolution (`courseRef ?? id`): all three cards enroll into `basic-compounding`, which is the courseId every cohort carries. Do NOT change the `getCourseById(course.courseRef ?? course.id)` line — that governs the ACPE block, not the cohort date.
- This also fixes a latent bug: the student card previously resolved its cohort lookup to `"student-foundations"` (no `courseRef`) and thus never showed a next-cohort date. It now correctly resolves to `basic-compounding` and shows the student cohort.
- `AUDIENCE_LABELS` is pure/DB-free, safe to import into `CursosGrid`.
