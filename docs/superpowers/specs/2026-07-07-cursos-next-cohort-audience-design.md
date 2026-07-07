# Per-audience "next cohort" on /cursos

**Date:** 2026-07-07
**Status:** Approved design — pending implementation plan

## Goal

On the `/cursos` catalogue, each course card's "Próxima cohorte" line should show
the next cohort **of that card's audience** and state the audience — e.g.
"Próxima cohorte: agosto 2026 · para Farmacéuticos y Técnicos". Today
`CursosGrid.nextCohortLabel(courseId)` picks the earliest open cohort for the
course **regardless of audience**, and all three cards point at the same course
(`basic-compounding`) — so every card shows the same date. Appending an audience
label to that shared, audience-blind date would be wrong (it would label a
pharmacist cohort's date "para Estudiantes"). The fix is to filter each card's
next cohort by its own audience, then label it.

## Design

**1. Audience per card (i18n).** Add a non-translatable `audience` field to each
`cursosGrid.items[]` entry in BOTH `messages/es.json` and `messages/en.json`
(the items already carry non-copy fields like `enrollTier`/`courseRef`):
- `basic-compounding` → `"farmaceutico_tecnico"`
- `otros-profesionales` → `"otros_profesionales"`
- `student-foundations` → `"estudiante"`

**2. Filter by audience.** `CohortBrief` (in `CursosGrid.tsx`) gains
`audience: CohortAudience`; the `/cursos` page maps it from the DB row
(`listOpenCohortsSafe()` already returns `audience`). `nextCohortLabel` takes an
audience argument and matches on course **and** audience:

```ts
function nextCohortLabel(courseId: string, audience: CohortAudience): string | null {
  const cohort = openCohorts.find((c) => c.courseId === courseId && c.audience === audience);
  if (!cohort) return null;
  return new Intl.DateTimeFormat(locale === "es" ? "es-PR" : "en-US", {
    month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(cohort.startDate));
}
```

The card computes `nextCohortLabel(course.courseRef ?? course.id, course.audience)`.
`CourseItem` gains `audience: CohortAudience`.

**3. Audience label.** When the "próxima cohorte" line renders (i.e. a matching
cohort exists), append "· para {label}" using `AUDIENCE_LABELS` (from
`@/lib/cohorts/audience`, pure) and a new i18n key `cursosGrid.cohortAudience`
(`"para {label}"` es / `"for {label}"` en). Concretely, after the month span:

```tsx
{" · "}{t("cohortAudience", { label: AUDIENCE_LABELS[course.audience][locale === "es" ? "es" : "en"] })}
```

**4. No cohort of that audience.** `nextCohortLabel` returns `null` → the whole
"próxima cohorte" line is hidden for that card (unchanged behavior). So a card
whose audience has no open cohort simply shows no date.

## Testing

- **Component — `CursosGrid`:** with `openCohorts` of mixed audiences (a
  `farmaceutico_tecnico` and an `estudiante` cohort for `basic-compounding`),
  the Farmacéuticos card shows its month + "para Farmacéuticos y Técnicos"; the
  Estudiantes card shows its month + "para Estudiantes"; the Otros Profesionales
  card (no matching cohort in the fixture) shows NO "próxima cohorte" line.
  Scope assertions per card via the card's article/title (same pattern as the
  existing `CursosGrid.test.tsx`).
- **i18n integrity:** `cursosGrid.cohortAudience` + the three items' `audience`
  present in both locales.
- `tsc` + `lint` + full suite green; **`pnpm build`** once (App Router change).

## Risks / gates

- **No DB migration** — reuses the already-deployed `audience`/`featured`
  columns. Normal deploy; no runtime gate.
- Only `/cursos` is affected (`CursosGrid` is not rendered on the landing — the
  landing uses `CursosHome`, which shows no cohort dates). `CohortBrief` is
  imported only by `cursos/page.tsx`.
- No change to enrollment, pricing, Stripe, CE, or the featured-cohort landing.

## Files touched

- `src/components/marketing/CursosGrid.tsx` (`CohortBrief`/`CourseItem` audience,
  `nextCohortLabel` filter, footer label, `AUDIENCE_LABELS` import).
- `src/app/[locale]/(marketing)/cursos/page.tsx` (map `audience` into `CohortBrief`).
- `src/messages/es.json`, `src/messages/en.json` (3 items' `audience` +
  `cursosGrid.cohortAudience`).
- Tests under `tests/`.
