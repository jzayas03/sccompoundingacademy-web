# Design — Portal split: Student vs Professional tracks

> **Date**: 2026-06-22
> **Status**: Approved (brainstorming) — pending implementation plan
> **Author**: Jan Zayas + Claude (Opus 4.8)

---

## Problem

The SCCA portal was built as continuing education for licensed
pharmacists (the **profesional** tier — a 3-day on-site cohort, 18 hrs,
ACPE CE under Colegio de Farmacéuticos Provider 0151, certificate
`SCCA-{YYYY}-{NNN}`). The first cohorts, however, are **exclusive to
pre-licensure students**, whose presentations and program differ.

`users.tier` already distinguishes `profesional` / `student`, and a
matrícula-photo verification gate for students already ships. But the
**content is shared**: the dashboard, module pages, quizzes, and
certificate are hard-wired to exactly the three professional days. We
need to divide the portal so students get their own dashboard and
curriculum without disturbing the professional path.

## Goal

Give the **student** tier its own self-paced online curriculum — its own
modules (USP 〈795〉 and USP 〈800〉 to start), per-module quizzes, and a
**non-ACPE completion certificate** — while the **profesional** tier
remains exactly as it is today. The portal content divides by
`users.tier`; enrollment, payments, and the verification gate are
unchanged.

## Scope decisions (from brainstorming)

| Decision | Value |
|---|---|
| Student track model | Own self-paced curriculum (NOT the 3-day cohort) |
| Eval + credential | Quiz per module + **non-ACPE** completion certificate |
| Initial modules | USP 〈795〉 (Nonsterile Compounding) → USP 〈800〉 (Hazardous Drugs); designed to grow |
| Quiz authoring | Claude drafts ~15 MCQ/module from the PDFs (ES/EN), owner reviews |
| Certificate | Same pdf-lib engine, no ACPE elements, numbering `SCCA-EST-{YYYY}-{NNN}` |
| Access / enrollment | Unchanged: $495 Stripe + matrícula gate. This work divides **content** only |

## Chosen approach — Tier-keyed curriculum abstraction (Approach A)

The portal is hard-wired to three professional modules in three places:
(1) the dashboard module list reads `cursosGrid.items[0].modules`;
(2) the module page hardcodes `MODULE_IDS = [modulo-1,2,3]` and resolves
PDFs by `dia-{n}.pdf`; (3) certificate eligibility requires three
post-tests. Approach A centralizes that variability in a single data
module keyed by tier, and reuses every existing engine (PDF viewer, quiz
engine, pre/post-test pages, certificate renderer).

Rejected alternatives: **B** (a parallel `/portal/estudiante/*` route
tree) — heavy duplication, two diverging codepaths. **C** (inline
`if (tier === 'student')` swaps) — scatters tier logic, brittle, does not
scale to "designed to grow."

---

## Architecture

### 1. Data model — no migration

A user has exactly one tier, so the existing schema already supports both
tracks:

- **`quizAttempts.moduleId`** (integer) is reinterpreted as the *ordinal
  within the user's curriculum*. Professional: 1/2/3 (days). Student:
  1 (〈795〉), 2 (〈800〉). No collision because every query filters by
  `userId` and a user is single-tier.
- **`certificates.scoreM1/M2/M3`**: a student fills M1, M2; M3 stays
  `null`. No column change.
- **Program (profesional/estudiante) is derived from the `certNo`
  prefix** — no new column. `SCCA-2026-001` = professional;
  `SCCA-EST-2026-001` = student. Prefixes are disjoint, so the
  sequential `LIKE prefix%` numbering stays separate and correct.

### 2. Curriculum layer — `src/lib/curriculum.ts` (new)

Single source of truth for "which modules each tier sees":

```ts
type CurriculumModule = {
  id: string;          // "modulo-1" | "usp-795" | ... (= quiz key and route param)
  ordinal: number;     // 1..N → quizAttempts.moduleId and certificates.scoreM{n}
  pdfBasename: string; // "dia-1" | "est-795" → public/modulos/{basename}.pdf
  i18nKey: string;     // points to the title/day/summary block
};

getCurriculum(tier: Tier): readonly CurriculumModule[];
resolveModule(tier: Tier, id: string): CurriculumModule | null; // membership check
```

- Professional curriculum = today's three days (no functional change).
- Student curriculum = `[usp-795, usp-800]`.
- **Growing the program = adding one entry here.**

### 3. Quizzes — `src/lib/quizzes/`

- New banks `usp-795.ts` and `usp-800.ts` (~15 MCQ each, existing
  `Question[]` shape with `correctAnswer` + `explanation`, bilingual
  ES/EN). Claude drafts from the PDFs; owner reviews before publish.
- `getQuiz(id)` extended to accept the new keys. Passing threshold reuses
  `QUIZ_PASSING_THRESHOLD` (default 0.70). Pre-test / post-test /
  results pages are unchanged except they resolve the ordinal via the
  curriculum layer instead of `dayNumberFromId`.

### 4. Dashboard and routing — tier-aware, same URLs

- **`/portal`** (dashboard): the module strip is built from
  `getCurriculum(user.tier)` instead of the `cursosGrid.items[0]`
  hardcode. Same layout and cards.
  - **`AcpeDisclosure` is NOT rendered for students** — it is ACPE
    Standard 3 (financial-relationships disclosure) and applies only to
    CE activities. Compliance-relevant.
  - Eyebrow / greeting / banner copy varies by tier via i18n
    ("Programa de Estudiantes" vs the professional copy).
- **`/portal/modulos/[id]`** + **pre-test / post-test**: validate `id`
  against `resolveModule(user.tier, id)` (404 if it does not belong to
  the caller's tier), and resolve the PDF and ordinal from it. The
  `resolveModuleAccess` policy is unchanged.
- The matrícula verification gate and the owner (`ADMIN_EMAILS`) bypass
  are identical.

### 5. Certificate

- `isEligibleForCertificate(userId, tier)`: instead of the fixed
  `[1,2,3]`, require the curriculum ordinals for the tier (professional
  1-2-3, student 1-2). `EligibilityReport.passedModules` becomes a record
  keyed by the curriculum ordinals rather than the literal `{1,2,3}`.
- `getOrCreateCertificate(userId, program)`: selects the prefix
  (`SCCA-` vs `SCCA-EST-`); the retry-on-conflict numbering and
  idempotency are intact.
- **Render** (`lib/certificates/render.ts`): a "Certificado de
  Finalización" layout variant for students — no ACPE ribbon, no CEUs,
  no Provider 0151. The `program` is derived from the `certNo` prefix so
  the public `/verificar/[certNo]` page renders the right variant with no
  auth or extra data.

### 6. i18n and content

- New student-module block (title / day / summary for 〈795〉 and 〈800〉),
  bilingual ES/EN.
- Certificate banner copy variants ("finalización" vs "CE/ACPE").
- `pnpm check:i18n` must stay at parity (identical ES/EN keys).

### 7. Assets

- Copy the two presentations to `public/modulos/est-795.pdf` and
  `public/modulos/est-800.pdf` (currently in `~/Desktop/Presentaciones/`,
  English; the viewer shows the single available language, as the
  professional modules do today).

### 8. Tests

- **Professional regression**: the dashboard, module pages, eligibility,
  and numbering for the professional tier remain identical.
- **Student path**: unit tests for `getCurriculum` / `resolveModule`,
  eligibility with two modules, `SCCA-EST-` numbering, and an e2e of the
  student dashboard (including that the ACPE block does **not** appear).

---

## Out of scope (this phase)

- Enrollment / payments (no change).
- Marketing / landing pages.
- Full portal i18n parity (portal UI stays ES except the PDF toggle).
- A bespoke Canva student certificate template (the programmatic render
  is used; a Canva overlay can be dropped in later, like `dia-{n}.pdf`).

## Risks / notes

- Touching shared files (dashboard, module page, certificate helpers) is
  the main risk; the professional-regression tests are the guardrail.
- Student PDFs are English-only at launch; acceptable (matches current
  professional viewer behavior when only one language file is present).
- Quiz banks ship behind owner review — content correctness is a human
  gate, not an automated one.
