# Featured cohort on the landing + public audience label

**Date:** 2026-07-07
**Status:** Approved design — pending implementation plan

## Goal

Two things, both owner-requested:
1. **Configurable landing cohort:** the admin can mark a cohort as "featured on
   the landing" (a per-cohort checkbox). The landing's "next cohort" band shows
   the featured cohort instead of always auto-picking the earliest open one.
2. **Public audience label:** that band states who the cohort is for — "Para
   Farmacéuticos y Técnicos" / "Para Estudiantes" / "Para Otros Profesionales"
   (the display deferred from the cohort-audience v1).

Today `[locale]/(marketing)/page.tsx` sets `next = openCohorts[0]` (earliest open,
audience-blind) and passes its date label + seat meter to `<CohortWaitlist>`
(`CohortWaitlist.tsx` — heading is `cohortLabel`, no audience shown).

## Owner decisions

- **Featured is a per-cohort checkbox; multiple allowed** — the landing shows the
  **earliest open featured** cohort; if none is featured, it falls back to the
  earliest open (current behavior). No single-featured enforcement.
- **Public surface = the landing `CohortWaitlist` band** (the "next cohort"
  section). `/cursos` and a per-audience meter are out of scope (v1).

## 1. Schema + migration

- `src/lib/db/schema.ts` — on `cohorts`, add:
  `featured: boolean("featured").notNull().default(false),`
  (`boolean` is already imported — used by `openForEnrollment`.)
- Hand-authored idempotent migration `drizzle/0012_cohort_featured.sql` (do NOT
  run `pnpm db:generate`):

```sql
-- Featured cohort: the one highlighted on the public landing "next cohort"
-- band. Idempotent — safe to re-run.
ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false;
```

- `src/lib/cohorts.ts` — `CohortInput` (`:26-33`) gains `featured: boolean;`
  (`createCohort`/`updateCohort` spread `CohortInput`, so no other change).
  `Cohort` gains `featured` via `$inferSelect`.

## 2. Featured-selection helper (pure, testable)

New DB-free module `src/lib/cohorts/featured.ts`:

```ts
/** Which cohort the landing highlights: the earliest OPEN featured cohort,
 *  else the earliest open one. `openCohorts` is already ordered earliest-first
 *  (listOpenCohorts orders by startDate). */
export function pickFeaturedCohort<T extends { featured: boolean }>(
  openCohorts: readonly T[],
): T | undefined {
  return openCohorts.find((c) => c.featured) ?? openCohorts[0];
}
```

## 3. Admin

The Zod schema lives in `src/app/[locale]/(portal)/portal/admin/cohortes/fields.ts`
(extracted there so the `"use server"` actions file exports only async fns).

- `fields.ts`: add `featured: z.boolean()` to `CohortFields`.
- `actions.ts` `parseCohort`: add `featured: formData.get("featured") === "on"`
  to the parsed object and `featured: f.featured` to the returned `CohortInput`.
- `page.tsx` `CohortFieldset`: add a checkbox next to "Abierto para inscripción":

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

  (Unchecked checkboxes submit no value, so `parseCohort`'s `=== "on"` correctly
  yields `false` — matching the existing `openForEnrollment` pattern.)

## 4. Landing wiring

`src/app/[locale]/(marketing)/page.tsx`:

- Replace `const next = openCohorts[0];` with
  `const next = pickFeaturedCohort(openCohorts);`.
- Pass the audience through to the band:
  `<CohortWaitlist total={seatTotal} remaining={seatRemaining} cohortLabel={cohortLabel} audience={next?.audience ?? null} />`.

## 5. Public audience label — `CohortWaitlist`

`src/components/marketing/CohortWaitlist.tsx`:

- Add prop `audience: CohortAudience | null`.
- Import `{ AUDIENCE_LABELS, type CohortAudience } from "@/lib/cohorts/audience"`
  (pure, DB-free — safe in this client component).
- When `audience` is set, render a small line under the `<h2>` heading:
  `{audience && <p className="…">{t("audienceLine", { label: AUDIENCE_LABELS[audience][locale === "en" ? "en" : "es"] })}</p>}`
  (the component already has `useLocale()` and `useTranslations("cohort")`).
- i18n: add `cohort.audienceLine` to `messages/es.json` (`"Para {label}"`) and
  `messages/en.json` (`"For {label}"`).

## Testing

- **Unit — `pickFeaturedCohort`:** earliest-featured wins; falls back to `[0]`
  when none featured; `undefined` for `[]`; with two featured, returns the
  earliest (first in the ordered list).
- **Unit — admin action:** `CohortFields` accepts `featured` boolean;
  `parseCohort` maps checkbox `"on"`→true / absent→false.
- **Component — `CohortWaitlist`:** renders "Para Estudiantes" for
  `audience="estudiante"`, "Para Farmacéuticos y Técnicos" for
  `farmaceutico_tecnico`, and NO audience line when `audience={null}`.
- **i18n integrity:** `cohort.audienceLine` present in both locales.
- Do **not** run `pnpm db:generate`. Full suite + `tsc` + `lint` green before
  each commit, and **`pnpm build`** once (App Router change — build-only errors
  like the recent `"use server"` one are missed by tsc/vitest).

## Risks / operational gates

- **Migration is a runtime gate** (same as `0011`): the new code SELECTs
  `featured` (`db.select().from(cohorts)`), so apply `0012` to Neon prod-main
  **before** deploy. Backward-compatible (defaulted column the old code ignores);
  the landing degrades via `listOpenCohortsSafe`, but admin/enroll pages would
  crash without it. Owner applies the idempotent SQL before merge.
- No change to enrollment logic, pricing, Stripe, CE, or the certificate
  pipeline.

## Files touched

Schema/data: `src/lib/db/schema.ts`, `drizzle/0012_cohort_featured.sql`,
`src/lib/cohorts.ts`, `src/lib/cohorts/featured.ts` (new).
Admin: `admin/cohortes/fields.ts`, `admin/cohortes/actions.ts`,
`admin/cohortes/page.tsx`.
Landing: `[locale]/(marketing)/page.tsx`, `components/marketing/CohortWaitlist.tsx`.
i18n: `messages/es.json`, `messages/en.json`.
Tests under `tests/`.

**Not touched (deferred):** `CursosGrid.tsx`, per-audience meters.
