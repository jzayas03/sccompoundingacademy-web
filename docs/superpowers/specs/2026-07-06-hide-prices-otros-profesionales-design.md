# Hide public prices + "Otros Profesionales" track (no CE, completion cert)

**Date:** 2026-07-06
**Status:** Approved design (revised after CE clarification) — pending plan

## Goal

Three owner-requested changes to the SCCA site:

1. **Hide prices from the pages.** No dollar amount on any public marketing
   surface. Price is revealed only at Stripe-hosted checkout.
2. **Add a third enrollment track — "Otros Profesionales"** — same price as the
   pharmacist (professional) track ($2,395).
3. **CE / certificate outcome differs by audience** (owner decision):

   | Track | Curriculum | ACPE CE | Certificate |
   |---|---|---|---|
   | Farmacéuticos y Técnicos (`profesional`, `professional_type` = farmaceutico/tecnico) | professional (3 mods) | **yes** | ACPE CE certificate |
   | **Otros Profesionales** (`profesional`, any other profession) | professional (3 mods) | **no** | completion certificate (no CE) |
   | Estudiantes (`student`) | student (2 mods) | no | completion certificate (unchanged) |

   Only pharmacists **and licensed pharmacy technicians** earn ACPE CE and the CE
   certificate. Every other professional on the professional tier gets a plain
   completion certificate with no CE.

## Under-the-hood model (no migration, no new Stripe price)

- "Otros Profesionales" is **not** a new DB tier. It stays `tier = 'profesional'`
  and reuses `STRIPE_PRICE_ID_PROFESIONAL`. The pharmacist-vs-other distinction
  is carried by the existing `users.professional_type` text column — no enum
  change, no schema migration, no new Stripe Price.
- The CE-vs-completion decision is centralized in **one eligibility predicate**
  and every CE/certificate/disclosure site is routed through it. This is the
  compliance-critical rule of the change: scattered `tier`-only checks are the
  bug that would issue ACPE CE to a non-pharmacist.

### The eligibility predicate (single source of truth)

Add to `src/lib/professions.ts` (a dependency-free leaf module):

```ts
/** Pharmacy roles that feed the ACPE "Registro de Educación Continua". */
export function isPharmacyRole(professionalType: string | null | undefined): boolean {
  return professionalType === "farmaceutico" || professionalType === "tecnico";
}
```

Add to `src/lib/certificates/index.ts`:

```ts
/** True only for professional-tier pharmacists/techs — the ONLY enrollees
 *  who earn ACPE CE. Fail-safe: null / unknown / free-text profession → false
 *  (completion cert). NEVER test `=== "otro"` — that value is discarded before
 *  persistence (InscripcionForm.tsx:109-118); the specific profession or null
 *  is stored instead. */
export function isCeEligible(tier: UserTier, professionalType: string | null): boolean {
  return tier === "profesional" && isPharmacyRole(professionalType);
}
```

## Part A — Hide prices (homepage)

`src/components/marketing/CursosHome.tsx` is the **only** file rendering a dollar
figure to visitors. Remove the price block (`{price && (…)}`, ~lines 157-176);
keep the CTA. Keep the `priceNote` "what's included" line as a footnote (it's a
benefit, not a price). Drop the now-dead `formatPrice` / `getPricingByTier`
imports and `proCents` / `studentCents`. Do **not** change `courses.ts` price
values (checkout still needs the Stripe Price IDs). No other file needs a
price-hiding edit (verified full-repo).

## Part B — Third marketing card "Otros Profesionales"

Presentation + routing only (no money-layer change).

**i18n (`messages/es.json` + `messages/en.json`, mirrored):**

- New `cursosGrid.items[]` entry `id: "otros-profesionales"`:
  - `title`: "Otros Profesionales"
  - `description`: same 18h course, other licensed professionals.
  - `courseRef: "basic-compounding"` (resolves cohort/USP; **no ACPE block** for
    this card — see CursosGrid change).
  - `enrollCourseId: "basic-compounding"`, `enrollTier: "profesional"`,
    `enrollProf: "otro"`.
  - `modules`: reuse the `basic-compounding` module copy.
  - `credentialNote`: "Certificado de finalización — sin créditos CE de ACPE.
    El CE está reservado a farmacéuticos y técnicos licenciados." (mirrors the
    student card's honest no-CE note).
- Relabel the `basic-compounding` item to a pharmacist/tech audience framing.
- Add `otrosProfesionalesHighlights[]` for the homepage card — highlights must
  **not** promise CE; instead state "certificado de finalización (sin CE)".

**`src/components/marketing/CursosGrid.tsx`:**

- Extend `CourseItem` with `courseRef?: string`, `enrollProf?: string`.
- Resolve facts via `getCourseById(course.courseRef ?? course.id)` and
  `nextCohortLabel(course.courseRef ?? course.id)`.
- **Suppress the ACPE CE block for the otros-profesionales card**: the ACPE block
  renders when `courseData?.acpe` exists (`CursosGrid.tsx:190`). Since the new
  item points `courseRef` at `basic-compounding`, `courseData.acpe` would be
  truthy. Gate the ACPE block on the item NOT being the no-CE track (e.g. add an
  item flag `noCe?: true`, show `credentialNote` instead — the existing
  `!courseData?.acpe && course.credentialNote` branch at `:206`). So the card
  shows the completion-cert note, not the CE block.
- Add `prof` to the enroll `Link` query:
  `...(course.enrollProf ? { prof: course.enrollProf } : {})`.
- Third card renders automatically (component maps all `items`).

**`src/components/marketing/CursosHome.tsx`:**

- Select a third item `otros-profesionales`; render 3 cards; grid
  `md:grid-cols-2` → `md:grid-cols-3`. Order: Farmacéuticos y Técnicos (dark,
  emphasized) · Otros Profesionales (light) · Estudiantes (light).
- Thread `enrollProf` into the card enroll `Link` query. Optionally set the
  pharmacist card `enrollProf: "farmaceutico"` for a pre-tailored form.

**`InscripcionForm.tsx` + `inscripcion/page.tsx`:**

- `page.tsx`: accept a `prof` search param, pass `preselectedProf` to the form.
- `InscripcionForm`: when tier is `profesional`, initialize `tipoProfesional`
  from `preselectedProf` (`"otro"` opens the "Otro" branch; `"farmaceutico"`
  preselects pharmacist).

## Part C — Certificate + CE logic (regulated core)

Model the CE axis as a **third certificate program** so the number series stays
clean (CE certs keep their own sequence — an ACPE-audit-friendly property) and
the public verify page keeps inferring program from the cert-number prefix.

### C1. Program model — `src/lib/certificates/index.ts`

- Widen `CertProgram` → `"profesional" | "profesional-completion" | "student"`.
- Add `programFor(tier, professionalType)`; keep `programForTier` as a thin
  wrapper or replace its call sites:
  - `student` → `"student"`
  - `profesional` + pharmacy role → `"profesional"` (CE)
  - `profesional` + anything else → `"profesional-completion"` (no CE)
- `certPrefix`: add third case. **Do NOT change existing prefixes** (`SCCA-` CE,
  `SCCA-EST-` student — already issued). New: `profesional-completion` →
  `SCCA-COMP-${year}-`. The three `LIKE ${prefix}%` numbering queries stay
  disjoint (`SCCA-2026-%`, `SCCA-EST-2026-%`, `SCCA-COMP-2026-%`).
- `requiredOrdinals` / `getCurriculum` stay **tier-based** — otros profesionales
  are `tier='profesional'` → the same 3-module requirement. Correct: they attend
  the full professional course.

### C2. Renderer — `src/lib/certificates/render.ts`

- `CertRenderInput.program` becomes the 3-value union; derive
  `awardsCeus = program === "profesional"` (both `drawOverlay` and
  `drawPlaceholderBody`).
- Three-way branch on the audience/credit/ACPE lines (currently 2-way at
  `:216-249` and `:386-423`):
  - course/audience subtitle: `profesional-completion` → neutral
    "Programa Profesional" / "Professional Program" (today's
    "for Pharmacists & Pharmacy Technicians" is wrong for a non-pharmacist).
  - credit line: `profesional-completion` → "18 contact hours · Knowledge-based,
    Level 1" (no CEUs) — the latent `!awardsCeus` branch, now reachable.
  - ACPE provider line: render **only** when `program === "profesional"`.

### C3. Issuance route — `src/app/api/certificate/route.ts`

- Load `professional_type` on the user row (already loads the user).
- `const program = programFor(effectiveTier, user.professionalType)`.
- Pass `program` to both `getOrCreateCertificate(user.id, program)` and
  `renderCertificatePdf({ program, … })`. Owner-preview branch: allow a
  `?preview=` value to force `profesional-completion` too (for QA).

### C4. Certificate-ready email — `notify-certificate-ready.ts` + `certificado.ts`

- Thread `professionalType` into `notifyCertificateReadyIfEligible` (add to its
  params; the post-test action `modulos/[id]/post-test/actions.ts:95` loads the
  user and passes it).
- Compute `program = programFor(tier, professionalType)` and pass to
  `buildCertificateReadyEmail`.
- `certificado.ts`: condition the CE-specific copy on `program === "profesional"`:
  - body line "…and CE hour documentation are ready" (`:40-41`) → drop the CE
    clause for non-CE programs.
  - badge (`:43-48`) → CE badge only for `"profesional"`; completion badge for
    `"profesional-completion"` and `"student"`.

### C5. Portal disclosure + preview

- `src/lib/curriculum.ts` `showAcpeDisclosure(tier)` →
  `showAcpeDisclosure(tier, professionalType)` delegating to `isCeEligible`
  (import `isPharmacyRole` from `professions.ts` — leaf, no import cycle).
  Update caller `portal/page.tsx:193` to pass the user's `professional_type`
  (loaded there already).
- `portal/certificado/page.tsx`: the preview card hard-shows "1.8 CEUs"
  (`:105-116`, `:139`). Gate the CEU/ACPE display on `isCeEligible`.

### C6. Public verification — `src/app/verificar/[certNo]/page.tsx`

- Prefix inference (`:89`) becomes 3-way: `SCCA-EST-` → student;
  `SCCA-COMP-` → professional-completion (no CE); else → professional. Ensure the
  page shows **no** CE/ACPE language for the completion prefixes.

### C7. Require profession for the professional tier (CE correctness)

Today `tipo_profesional` is `.optional()` (`api/inscripcion/route.ts:52`), so a
pharmacist could pay without recording their role and silently fall to the
completion cert. Make profession **required when tier = profesional** (client
`required` + a Zod refine), so CE eligibility is always explicit. Student tier is
unaffected (profession not asked).

## Data / compliance risks (must clear before deploy)

- **Retroactive re-render.** Certs are re-rendered from current code + current
  user data on every `/api/certificate` download (not frozen PDFs). After deploy,
  an existing `tier='profesional'` graduate whose `professional_type` is null or
  a non-pharmacy value would see their re-downloaded cert change from CE to
  completion. **Pre-deploy audit (required):**
  `SELECT professional_type, count(*) FROM "user" WHERE tier='profesional' GROUP BY professional_type;`
  If any real pharmacist/tech rows have null/other, **backfill** `professional_type`
  to `farmaceutico`/`tecnico` before deploy. Run read-only first; the backfill is
  parameterized and tenant-safe. This is the blast-radius gate — do not deploy
  Part C until the audit is clean.
- **Already-issued cert numbers are stable.** `getOrCreateCertificate` is
  idempotent by `userId`, so a user who already has a `SCCA-2026-NNN` number
  keeps it; only the rendered content follows current eligibility. New otros
  profesionales get `SCCA-COMP-` from first issuance.
- **ACPE registry integrity.** Only `farmaceutico`/`tecnico` feed the CE
  registry — unchanged intent, now enforced end-to-end.

## Testing

Run against real behavior, not just mocks (per repo norms):

- **Unit — eligibility:** `isPharmacyRole` / `isCeEligible` truth table incl.
  null, `"otro"`-that-never-arrives, free text, `medico`, `farmaceutico`,
  `tecnico`, student tier.
- **Unit — program/prefix:** extend `tests/unit/certificate-program.test.ts` for
  `profesional-completion` + `SCCA-COMP-` numbering disjointness.
- **Unit — render:** extend `tests/unit/cert-render.test.ts` with a
  `profesional-completion` variant; assert **no** "CEUs" and **no** "ACPE
  Provider" strings, neutral audience line present. (`@vitest-environment node`.)
- **Actually render a PDF** for the new case and eyeball it (cert render has bit
  us before with font/glyph crashes) — verify a real download, not only asserts.
- **Unit — disclosure:** update `tests/unit/curriculum.test.ts` for the new
  `showAcpeDisclosure(tier, professionalType)` signature.
- **Unit — email:** extend `tests/unit/email-templates.test.ts` — completion
  program omits CE copy/badge.
- **Unit — webhook:** `tests/unit/webhook-stripe-route.test.ts` — assert a
  non-pharmacy `tipo_profesional` code persists to `professional_type`.
- **Pricing invariant:** `student-checkout` / `pagar-route` /
  `inscripcion-student-branch` stay green — otros profesionales still hit the
  $2,395 professional price.
- **Marketing:** homepage renders no `$`; the three CTAs route with correct
  `course` / `tier` / `prof`; `preselectedProf="otro"` opens the "Otro" branch
  while keeping tier `profesional`.
- **i18n integrity:** es.json + en.json both parse and expose the new keys.
- Do **not** run `pnpm db:generate` — no schema change.

## Files touched

Marketing/enroll: `CursosHome.tsx`, `CursosGrid.tsx`,
`inscripcion/InscripcionForm.tsx`, `inscripcion/page.tsx`,
`messages/{es,en}.json`, `api/inscripcion/route.ts` (profession-required refine).

Certificate/CE: `lib/professions.ts`, `lib/certificates/index.ts`,
`lib/certificates/render.ts`, `api/certificate/route.ts`,
`lib/portal/notify-certificate-ready.ts`, `lib/emails/certificado.ts`,
`lib/curriculum.ts` (showAcpeDisclosure), `portal/page.tsx`,
`portal/certificado/page.tsx`, `verificar/[certNo]/page.tsx`,
`portal/modulos/[id]/post-test/actions.ts` (thread professional_type).

Tests: cert-render, certificate-program, curriculum, email-templates,
webhook-stripe-route, plus new eligibility + marketing routing/price-hidden.

No changes to: DB schema/migrations, Stripe config/prices, `courses.ts` price
values, the money-layer checkout branch selection.
