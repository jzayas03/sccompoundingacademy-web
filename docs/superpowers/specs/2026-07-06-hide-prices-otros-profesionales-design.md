# Hide public prices + add "Otros Profesionales" track

**Date:** 2026-07-06
**Status:** Approved design — pending implementation plan

## Goal

Two owner-requested changes to the SCCA marketing site:

1. **Hide prices from the pages.** Dollar amounts should no longer appear on
   any public marketing surface. The price is revealed only at Stripe-hosted
   checkout.
2. **Add a third enrollment track — "Otros Profesionales"** — priced the same
   as the pharmacist (professional) track.

## Constraints & decisions (owner-confirmed)

- The third track is a **presentation split only**: no DB migration, no new
  Stripe Price. "Otros Profesionales" resolves to the existing `profesional`
  tier and the existing `STRIPE_PRICE_ID_PROFESIONAL` price. In the DB the row
  still stores `tier = 'profesional'`; `professionalType` captures the
  pharmacist-vs-other distinction, exactly as the current "otro" profession
  path already does.
- Price display is **removed entirely** on the cards (not replaced with a
  placeholder). The CTA stays.
- The third card appears on **both** the homepage (`CursosHome`) and the
  `/cursos` catalogue (`CursosGrid`).
- Card label: **"Otros Profesionales"** (card 1 becomes "Farmacéuticos y
  Técnicos", card 3 stays "Estudiantes").

## Background — current state (verified)

- The **only** file that renders a dollar figure to visitors is
  `src/components/marketing/CursosHome.tsx` (homepage). `/cursos`
  (`CursosGrid`), the seat meter (`CohortWaitlist`), and the enrollment form
  (`InscripcionForm`) already render **no** price.
- Prices come from config (`src/lib/courses.ts` → `priceUsdCents`), formatted
  by `formatPrice`. Stripe is authoritative at checkout regardless of the UI.
- Tiers: `Tier = "profesional" | "student"` (`courses.ts:39`). Two Stripe
  price env vars: `STRIPE_PRICE_ID_PROFESIONAL`, `STRIPE_PRICE_ID_STUDENT`.
- The `profesional` tier already covers pharmacists **and** other professions:
  `InscripcionForm` has a profession selector (`farmaceutico | tecnico | otro`)
  and the "otro" branch keeps the row on the $2,395 professional price
  (`InscripcionForm.tsx:86-92`). This is the mechanism the new track surfaces.
- Both card components read localized copy from `messages/{es,en}.json` under
  `cursosGrid.items[]`; `CursosHome` also reads `professionalHighlights` /
  `studentHighlights`.
- `CursosGrid` resolves per-course facts (ACPE block, next-cohort date, USP
  label) via `getCourseById(course.id)`. A new item whose `id` is not a real
  `CourseId` would silently lose its ACPE + cohort block — the new item must be
  able to point back at `basic-compounding`.

## Design

### Part A — Hide prices (homepage)

`src/components/marketing/CursosHome.tsx`:

- Remove the rendered price block (the `{price && (…)}` group,
  ~lines 157-176): drop the dollar amount and the `perLabel` ("/ participante").
- **Keep** the `priceNote` line ("Materiales, almuerzo y certificado CE
  incluidos" / "Acceso al portal, quizzes…") as a small card footnote — it is a
  what's-included benefit, not a price. Restructure so it renders independent of
  the removed price value.
- Remove now-dead code: the `getPricingByTier` / `formatPrice` imports and the
  `proCents` / `studentCents` derivations, and the `price` / `perLabel` props on
  `CourseCard`.
- **Do not** touch `courses.ts` price values — checkout still needs the Stripe
  Price IDs, and the `priceUsdCents` constants are harmless config truth.

No other file needs a price-hiding edit (confirmed by full-repo search).

### Part B — Third track "Otros Profesionales"

No changes to `Tier`, the DB schema, or Stripe. The track is a new i18n card
entry that routes to the professional checkout with the profession preselected.

**i18n (`messages/es.json` + `messages/en.json`, mirrored):**

- Add a new `cursosGrid.items[]` entry, `id: "otros-profesionales"`:
  - `title`: "Otros Profesionales" (EN mirror)
  - `description`: audience-tailored copy (same 18h course, non-pharmacist
    licensed professionals)
  - `courseRef: "basic-compounding"` — resolves ACPE/cohort/USP facts.
  - `enrollCourseId: "basic-compounding"`, `enrollTier: "profesional"`,
    `enrollProf: "otro"` — routes to the pro price with profession preset.
  - `modules`: reuse the `basic-compounding` module copy (same course).
- Relabel the `basic-compounding` item title/description to
  "Farmacéuticos y Técnicos" framing (pharmacist-specific audience).
- Add `otrosProfesionalesHighlights[]` for the homepage card highlight list
  (parallel to `professionalHighlights` / `studentHighlights`).

**`src/components/marketing/CursosGrid.tsx`:**

- Extend `CourseItem` type with `courseRef?: string`, `enrollProf?: string`.
- Resolve facts via `getCourseById(course.courseRef ?? course.id)` and
  `nextCohortLabel(course.courseRef ?? course.id)`.
- Add `prof` to the enroll `Link` query:
  `...(course.enrollProf ? { prof: course.enrollProf } : {})`.
- Rendering the 3rd item is automatic (component maps over all `items`).

**`src/components/marketing/CursosHome.tsx`:**

- Select a third card item: `items.find(c => c.id === "otros-profesionales")`.
- Render 3 cards; change grid `md:grid-cols-2` → `md:grid-cols-3`. Card order:
  Farmacéuticos y Técnicos (dark, emphasized) · Otros Profesionales (light) ·
  Estudiantes (light). The pharmacist card keeps the dark tone so it stays the
  visual anchor; the two light cards read as the alternate audiences.
- Thread `enrollProf` into the card's enroll `Link` query (same pattern as
  CursosGrid). Optionally set the pharmacist card's `enrollProf: "farmaceutico"`
  so its form arrives pre-tailored too.

**`src/components/marketing/inscripcion/InscripcionForm.tsx` +
`src/app/[locale]/(marketing)/inscripcion/page.tsx`:**

- `page.tsx`: accept a `prof` search param and pass `preselectedProf` to the
  form (alongside the existing `preselectedTier`).
- `InscripcionForm`: initialize `tipoProfesional` from `preselectedProf` when
  the tier is `profesional` (`"otro"` → profession selector opens on "Otro";
  `"farmaceutico"` → pharmacist preselected). Server-side Zod validation is
  unchanged and remains the source of truth.

### Data flow (unchanged at the money layer)

```
Homepage / /cursos card "Otros Profesionales"
  -> /inscripcion?course=basic-compounding&tier=profesional&prof=otro
  -> InscripcionForm (tier=profesional, tipoProfesional=otro)
  -> POST /api/inscripcion (tier=profesional)
  -> Stripe Checkout with STRIPE_PRICE_ID_PROFESIONAL  ($2,395)
  -> webhook stamps users.tier='profesional', professional_type='otro'/<code>
```

## Testing

- **Regression:** run the existing vitest suite (incl. the student-vs-
  profesional differential pricing test) — nothing at the payment layer changes,
  so it must stay green.
- **New — price hidden:** assert `CursosHome` renders no `$` / no `formatPrice`
  output.
- **New — third track routing:** assert the "Otros Profesionales" CTA links to
  `/inscripcion` with `course=basic-compounding`, `tier=profesional`,
  `prof=otro`; and that `InscripcionForm` with `preselectedProf="otro"`
  preselects the "Otro" profession while keeping tier `profesional`.
- **i18n integrity:** es.json and en.json must both parse and expose the new
  keys (missing-key mismatches break the build/tests).
- Do **not** run `pnpm db:generate` — there is no schema change here.

## Risks & out of scope

- **ACPE CE for non-pharmacists (out of scope).** Riding `tier=profesional`
  means the "Otros Profesionales" track inherits the professional curriculum and
  the ACPE CE disclosure — identical to today's "otro" profession path. ACPE CE
  (Provider 0151, Colegio de Farmacéuticos) is pharmacist-specific; whether
  non-pharmacists should receive CE vs a completion certificate is a separate
  decision and is **not** changed here. Flagged as a follow-up.
- **Two same-price pro cards.** Because prices are hidden, the pharmacist and
  "Otros Profesionales" cards won't display an identical dollar figure side by
  side — avoids the "why are these the same price?" confusion.
- **Snapshot/count assertions.** If any test asserts exactly two catalogue
  items or snapshots the cards, it must be updated for the third item.

## Files touched

- `src/components/marketing/CursosHome.tsx` (hide price + 3rd card)
- `src/components/marketing/CursosGrid.tsx` (courseRef/enrollProf + 3rd card)
- `src/components/marketing/inscripcion/InscripcionForm.tsx` (preselectedProf)
- `src/app/[locale]/(marketing)/inscripcion/page.tsx` (read `prof` param)
- `src/messages/es.json`, `src/messages/en.json` (new item + highlights + labels)
- Tests under `tests/` / `*.test.tsx` (price-hidden + routing + i18n)

No changes to: `src/lib/courses.ts` (price values), DB schema/migrations, Stripe
config, webhook handler.
