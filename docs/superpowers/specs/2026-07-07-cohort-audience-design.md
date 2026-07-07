# Cohort audience — restrict enrollment by cohort type

**Date:** 2026-07-07
**Status:** Approved design — pending implementation plan

## Goal

Let the admin assign an **audience** to each cohort so a given cohort only
enrolls people of that audience. Owner example: an active cohort for
farmacéuticos/técnicos should accept only farmacéuticos/técnicos; a student
cohort should say so explicitly. Today a cohort has no audience — the tier is
chosen freely at enrollment with no cohort↔tier restriction (`route.ts:149-156`
checks only course match + `openForEnrollment`).

## Owner decisions

- **Three audiences** (not two): `farmaceutico_tecnico` (CE), `otros_profesionales`
  (no CE), `estudiante`. "Otros Profesionales" ride `tier=profesional` but are a
  distinct audience from pharmacists/technicians, so enrollment must consider
  `professional_type`, not tier alone.
- **Filter behavior:** the enroll form shows only cohorts matching the user's
  profile; the server independently rejects a mismatch (defense in depth).
- **Existing cohorts default to `farmaceutico_tecnico`** (the active cohort is the
  pharmacist course); the owner reviews/edits them in the admin afterward.

## Audience model

Enum `cohort_audience` = `farmaceutico_tecnico | otros_profesionales | estudiante`.

The map from an enrollee to their audience (pure, shared server + client) —
`src/lib/cohorts/audience.ts` (DB-free leaf, imports only `isPharmacyRole` from
`@/lib/professions`):

```ts
export type CohortAudience =
  | "farmaceutico_tecnico"
  | "otros_profesionales"
  | "estudiante";

/** Definitive audience for an enrollee, or null when undetermined (a
 *  professional who has not chosen a profession yet). */
export function enrolleeAudience(
  tier: string,
  professionalType: string | null | undefined,
): CohortAudience | null {
  if (tier === "student") return "estudiante";
  if (tier === "profesional") {
    if (!professionalType?.trim()) return null;
    return isPharmacyRole(professionalType)
      ? "farmaceutico_tecnico"
      : "otros_profesionales";
  }
  return null;
}

/** Which cohort audiences a (possibly still-incomplete) form selection may
 *  enroll into — used to filter the cohort dropdown client-side. A
 *  professional who has not picked a profession sees both professional
 *  audiences until they narrow it. */
export function visibleAudiences(
  tier: string,
  professionalType: string | null | undefined,
): CohortAudience[] {
  const a = enrolleeAudience(tier, professionalType);
  if (a) return [a];
  if (tier === "profesional") return ["farmaceutico_tecnico", "otros_profesionales"];
  return [];
}

/** Localized display label per audience (es/en). */
export const AUDIENCE_LABELS: Record<CohortAudience, { es: string; en: string }> = {
  farmaceutico_tecnico: { es: "Farmacéuticos y Técnicos", en: "Pharmacists & Technicians" },
  otros_profesionales: { es: "Otros Profesionales", en: "Other Professionals" },
  estudiante: { es: "Estudiantes", en: "Students" },
};
```

Note: `enrolleeAudience` uses the same `isPharmacyRole` predicate that drives CE
eligibility, so cohort audience and CE stay consistent (a `farmaceutico_tecnico`
cohort ⇔ exactly the CE-eligible enrollees).

## 1. Schema + migration

- `src/lib/db/schema.ts`: add
  `export const cohortAudienceEnum = pgEnum("cohort_audience", ["farmaceutico_tecnico", "otros_profesionales", "estudiante"]);`
  and on `cohorts`:
  `audience: cohortAudienceEnum("audience").notNull().default("farmaceutico_tecnico"),`
- Hand-authored idempotent migration `drizzle/0011_cohort_audience.sql` (matches
  the `0006` enum precedent; do **not** run `pnpm db:generate`):

```sql
-- Cohort audience: restrict who can enroll into a cohort. Idempotent.
DO $$ BEGIN
  CREATE TYPE "cohort_audience" AS ENUM ('farmaceutico_tecnico', 'otros_profesionales', 'estudiante');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "audience" "cohort_audience" NOT NULL DEFAULT 'farmaceutico_tecnico';
```

- `src/lib/cohorts.ts`: add `audience: CohortAudience` to `CohortInput`
  (`:26-33`); `Cohort` gains it automatically via `$inferSelect`. `createCohort`
  / `updateCohort` pass it through unchanged (they spread `CohortInput`).

## 2. Admin (`/portal/admin/cohortes`)

- `actions.ts`: add `audience: z.enum([...])` to `CohortFields` (`:31-38`) and
  include it in `parseCohort`'s `CohortInput` (`:40-65`).
- `page.tsx` `CohortFieldset` (`:45-113`): add a required `<select name="audience">`
  with the three options (labels from i18n). Create + edit forms both render it;
  the edit form preselects the cohort's current `audience`.
- The admin cohort list (`:187-193`) shows the audience label beside
  date/capacity/open.

## 3. Enrollment restriction (server — defense in depth)

- `src/app/api/inscripcion/route.ts`: after resolving `cohort` (~`:149-153`),
  add an audience gate:

```ts
const wanted = enrolleeAudience(data.tier, data.tipo_profesional);
if (!wanted || cohort.audience !== wanted) {
  const label = AUDIENCE_LABELS[cohort.audience][data.locale === "en" ? "en" : "es"];
  return NextResponse.json(
    { error: data.locale === "en"
        ? `This cohort is for ${label} only.`
        : `Esta cohorte es solo para ${label}.` },
    { status: 400 },
  );
}
```

- `src/lib/inscripcion/checkout.ts` (student post-approval pay,
  `createStudentCheckoutSession`): the row is always student tier, so assert
  `cohort.audience === "estudiante"` before creating the session; if not, return
  a new `CheckoutOutcome` reason (`"audience-mismatch"`) the caller surfaces.
  (Belt-and-suspenders: a student row should only ever hold a student cohort,
  but the pay path re-checks DB state independently.)

## 4. Cohort filtering (client)

- `InscripcionForm.tsx`: extend `CohortOption` (`:22-26`) with
  `audience: CohortAudience`. Compute the visible set from the current tier +
  profession and filter the cohort list:

```ts
const audiences = visibleAudiences(tier, profesion); // profesion = resolveProfesion(...)
const availableCohorts = useMemo(
  () => cohorts.filter((c) => c.courseId === courseId && audiences.includes(c.audience)),
  [courseId, cohorts, audiences],
);
```

  Reset `cohorteId` (via a `useEffect`) whenever it falls out of
  `availableCohorts`, to `availableCohorts[0]?.id ?? ""`.
- When `availableCohorts` is empty, the cohort field renders the existing
  `noCohortsAvailable` message ("No hay cohortes abiertas para tu perfil —
  escríbenos") and submit is blocked (empty `cohorte_id` fails the existing
  `min(1)` schema rule, now surfaced by the field-aware message from PR #132).
- `src/app/[locale]/(marketing)/inscripcion/page.tsx` (`:45-50`): include
  `audience` in the mapped `CohortOption`.

## 5. Public / i18n display

- i18n `messages/{es,en}.json`: add the three audience labels (mirror
  `AUDIENCE_LABELS`, or read from it — single source; the JSON is for any
  surface that uses `t()`).
- Enroll form: a small heading above the cohort dropdown — "Cohortes para
  {audiencia}" — makes the audience explicit (the owner's "que lo diga
  explícitamente"). Uses the label of the user's own audience (or a neutral
  "Cohortes disponibles" while still undetermined).
- Public "next cohort" surfaces (`CohortWaitlist` band, `CursosGrid` next-cohort):
  append the audience label to the displayed cohort so a visitor sees who it is
  for. This requires threading `audience` into `CohortBrief` (`CursosGrid`) and
  the `(marketing)/page.tsx` → `CohortWaitlist` props.

## Testing

- **Unit — `audience.ts`:** truth table for `enrolleeAudience` and
  `visibleAudiences` (student, profesional+farmaceutico/tecnico, profesional+otro,
  profesional+medico, profesional+null → both, unknown tier).
- **Unit — server gate:** a mismatched (tier/professional_type, cohort.audience)
  pair returns the 400 audience message; a match passes the gate. (Test the pure
  decision; the route just wires it.)
- **Unit — admin action:** `parseCohort` requires a valid `audience`; an invalid
  value is rejected.
- **Unit — migration idempotency:** the SQL re-runs without error (or assert the
  `IF NOT EXISTS` / DO-block shape, matching how `0006` is treated).
- **Component — cohort filter:** with cohorts of mixed audiences, a student-tier
  selection lists only estudiante cohorts; a profesional+otro selection lists only
  otros_profesionales; profesional with no profession lists both professional
  cohorts; and selecting a profession narrows the list + resets a now-invalid
  cohort.
- Do **not** run `pnpm db:generate` (stale journal). Full suite green before each
  commit.

## Risks / out of scope

- **Existing-cohort default** flips the active cohort to `farmaceutico_tecnico`;
  since the pilot has essentially no professional/student enrollees yet
  (confirmed 2026-07-06 audit), blast radius is minimal. Owner reviews audiences
  post-deploy.
- **Landing "next cohort" with multiple open audiences:** v1 labels whichever
  cohort is shown (earliest open); a per-audience "next cohort" selector on the
  landing is a follow-up, not in this spec.
- No change to pricing, Stripe, CE logic, or the certificate pipeline.

## Files touched

Schema/data: `src/lib/db/schema.ts`, `drizzle/0011_cohort_audience.sql`,
`src/lib/cohorts.ts`, `src/lib/cohorts/audience.ts` (new).
Admin: `portal/admin/cohortes/page.tsx`, `portal/admin/cohortes/actions.ts`.
Enrollment: `api/inscripcion/route.ts`, `lib/inscripcion/checkout.ts`,
`marketing/inscripcion/InscripcionForm.tsx`,
`[locale]/(marketing)/inscripcion/page.tsx`.
Display/i18n: `messages/es.json`, `messages/en.json`,
`marketing/CohortWaitlist.tsx`, `marketing/CursosGrid.tsx`,
`[locale]/(marketing)/page.tsx`.
Tests under `tests/`.
