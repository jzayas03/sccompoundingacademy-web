# Portal Split: Student vs Professional Tracks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the `student` tier its own self-paced curriculum (USP 〈795〉 + 〈800〉) with per-module quizzes and a non-ACPE completion certificate, while the `profesional` tier stays byte-for-byte identical.

**Architecture:** A new tier-keyed curriculum layer (`src/lib/curriculum.ts`) becomes the single source of truth for "which modules each tier has." Every place that was hard-wired to the three professional days (dashboard, module page, pre/post-test, results, their server actions, certificate eligibility/numbering/render, public verification) reads from it. No DB migration: `quizAttempts.moduleId` is reinterpreted as the per-user curriculum ordinal, and the certificate program is encoded in the `certNo` prefix (`SCCA-` vs `SCCA-EST-`).

**Tech Stack:** Next.js 16 (App Router), React 19, next-intl, Drizzle (Neon Postgres), pdf-lib, Vitest (unit/component), Playwright (e2e). Spec: `docs/superpowers/specs/2026-06-22-student-professional-portal-split-design.md`.

---

## File Structure

**New files**
- `src/lib/curriculum.ts` — tier → ordered module list; `resolveModule`, ordinal lookup, ACPE predicate.
- `src/lib/quizzes/usp-795.ts` — student quiz bank (USP 〈795〉).
- `src/lib/quizzes/usp-800.ts` — student quiz bank (USP 〈800〉).
- `tests/unit/curriculum.test.ts` — curriculum layer.
- `tests/unit/certificate-program.test.ts` — eligibility + numbering prefix (pure).
- `public/modulos/est-795.pdf`, `public/modulos/est-800.pdf` — student decks (copied in).

**Modified files**
- `src/lib/quizzes/types.ts:46` — extend `ModuleQuizId`.
- `src/lib/quizzes/index.ts:1-17` — register the two new banks.
- `src/messages/es.json`, `src/messages/en.json` — add `studentCurriculum` block + `verificar` student keys.
- `src/app/[locale]/(portal)/portal/page.tsx` — tier-aware module list + ACPE omission.
- `src/app/[locale]/(portal)/portal/modulos/[id]/page.tsx` — tier-aware resolution + PDF basename.
- `src/app/[locale]/(portal)/portal/modulos/[id]/pre-test/page.tsx` + `actions.ts` — ordinal via curriculum.
- `src/app/[locale]/(portal)/portal/modulos/[id]/post-test/page.tsx` + `actions.ts` — ordinal via curriculum.
- `src/app/[locale]/(portal)/portal/modulos/[id]/post-test/resultados/page.tsx` — ordinal via curriculum.
- `src/lib/certificates/index.ts` — `isEligibleForCertificate(userId, tier)`, `getOrCreateCertificate(userId, program)`, `certPrefix`, `evaluateEligibility`.
- `src/lib/certificates/render.ts` — `program` field, student layout (no ACPE).
- `src/app/api/certificate/route.ts` — pass tier/program.
- `src/app/verificar/[certNo]/page.tsx` — student course copy by prefix.
- `src/components/marketing/CursosGrid.tsx` — second (student) course card.
- `src/components/marketing/inscripcion/InscripcionForm.tsx` — `preselectedTier`.
- `src/app/[locale]/(marketing)/inscripcion/page.tsx` — thread `?tier=`.

**Convention reminders (from STATUS.md):** no hex literals outside `lib/brand.ts`; `pnpm check:i18n` must pass; commit co-author tag `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`; full gauntlet before merge: `pnpm typecheck && pnpm lint && pnpm check:i18n && pnpm test && pnpm test:e2e && pnpm build`.

---

## Task 1: Curriculum layer

**Files:**
- Create: `src/lib/curriculum.ts`
- Test: `tests/unit/curriculum.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/curriculum.test.ts
import { describe, expect, it } from "vitest";
import {
  getCurriculum,
  resolveModule,
  showAcpeDisclosure,
  type UserTier,
} from "@/lib/curriculum";

describe("getCurriculum", () => {
  it("returns the three professional days for the profesional tier", () => {
    const mods = getCurriculum("profesional");
    expect(mods.map((m) => m.id)).toEqual(["modulo-1", "modulo-2", "modulo-3"]);
    expect(mods.map((m) => m.ordinal)).toEqual([1, 2, 3]);
    expect(mods.map((m) => m.pdfBasename)).toEqual(["dia-1", "dia-2", "dia-3"]);
  });

  it("returns the two USP modules for the student tier", () => {
    const mods = getCurriculum("student");
    expect(mods.map((m) => m.id)).toEqual(["usp-795", "usp-800"]);
    expect(mods.map((m) => m.ordinal)).toEqual([1, 2]);
    expect(mods.map((m) => m.pdfBasename)).toEqual(["est-795", "est-800"]);
  });

  it.each<[UserTier]>([["pharmacist"], [null]])(
    "defaults legacy/owner tier %s to the professional curriculum",
    (tier) => {
      expect(getCurriculum(tier).map((m) => m.id)).toEqual([
        "modulo-1",
        "modulo-2",
        "modulo-3",
      ]);
    },
  );
});

describe("resolveModule", () => {
  it("resolves an id that belongs to the tier", () => {
    expect(resolveModule("student", "usp-800")?.ordinal).toBe(2);
  });

  it("returns null for an id from the OTHER tier (cross-tier 404)", () => {
    expect(resolveModule("student", "modulo-1")).toBeNull();
    expect(resolveModule("profesional", "usp-795")).toBeNull();
  });

  it("returns null for an unknown id", () => {
    expect(resolveModule("profesional", "modulo-9")).toBeNull();
  });
});

describe("showAcpeDisclosure", () => {
  it("is hidden for students, shown for everyone else", () => {
    expect(showAcpeDisclosure("student")).toBe(false);
    expect(showAcpeDisclosure("profesional")).toBe(true);
    expect(showAcpeDisclosure(null)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/curriculum.test.ts`
Expected: FAIL — cannot resolve `@/lib/curriculum`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/curriculum.ts
/**
 * Tier-keyed curriculum — the single source of truth for "which modules
 * each portal tier has." Every place that used to hard-wire the three
 * professional days (dashboard, module page, pre/post-test, results,
 * their actions, certificate eligibility) resolves its module list,
 * ordinal, and PDF asset from here.
 *
 * `ordinal` is what lands in `quizAttempts.moduleId` and maps to the
 * `certificates.scoreM{ordinal}` column. It is per-tier (professional
 * 1/2/3, student 1/2); there is no collision because every query filters
 * by `userId` and a user belongs to exactly one tier.
 */

/** Mirror of `users.tier` (Drizzle `tierEnum` + nullable). */
export type UserTier = "pharmacist" | "profesional" | "student" | null;

export type CurriculumModule = {
  /** Route param + quiz-bank key, e.g. "modulo-1" | "usp-795". */
  id: string;
  /** 1..N position; becomes quizAttempts.moduleId and scoreM{ordinal}. */
  ordinal: number;
  /** public/modulos/{pdfBasename}.pdf (and -en.pdf when present). */
  pdfBasename: string;
};

const PROFESIONAL: readonly CurriculumModule[] = [
  { id: "modulo-1", ordinal: 1, pdfBasename: "dia-1" },
  { id: "modulo-2", ordinal: 2, pdfBasename: "dia-2" },
  { id: "modulo-3", ordinal: 3, pdfBasename: "dia-3" },
];

const STUDENT: readonly CurriculumModule[] = [
  { id: "usp-795", ordinal: 1, pdfBasename: "est-795" },
  { id: "usp-800", ordinal: 2, pdfBasename: "est-800" },
];

/** Modules for a tier. Legacy ("pharmacist") and owner/null default to
 *  the professional curriculum — owners preview the professional path,
 *  which matches today's behavior. */
export function getCurriculum(tier: UserTier): readonly CurriculumModule[] {
  return tier === "student" ? STUDENT : PROFESIONAL;
}

/** Resolve a route id within a tier's curriculum, or null if it does not
 *  belong to that tier (callers turn null into a 404). */
export function resolveModule(
  tier: UserTier,
  id: string,
): CurriculumModule | null {
  return getCurriculum(tier).find((m) => m.id === id) ?? null;
}

/** Curriculum ordinals required for a completion certificate. */
export function requiredOrdinals(tier: UserTier): number[] {
  return getCurriculum(tier).map((m) => m.ordinal);
}

/** ACPE Standard 3 disclosure applies only to CE-bearing tiers. The
 *  student track earns no ACPE CE, so its dashboard omits the block. */
export function showAcpeDisclosure(tier: UserTier): boolean {
  return tier !== "student";
}

/** i18n message key holding the student module catalogue (title/day/
 *  summary). Professional modules live at cursosGrid.items[0].modules. */
export const STUDENT_MODULES_I18N_KEY = "studentCurriculum" as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/curriculum.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/curriculum.ts tests/unit/curriculum.test.ts
git commit -m "feat(portal): tier-keyed curriculum layer"
```

---

## Task 2: Register student quiz banks (wiring + empty banks)

Wire the registry first with empty banks so the app type-checks and routes resolve; real questions land in Task 3. An empty bank is a valid state the UI already handles (`isEmpty` → "pending" card).

**Files:**
- Modify: `src/lib/quizzes/types.ts:46`
- Modify: `src/lib/quizzes/index.ts:1-17`
- Create: `src/lib/quizzes/usp-795.ts`
- Create: `src/lib/quizzes/usp-800.ts`

- [ ] **Step 1: Extend the `ModuleQuizId` union**

In `src/lib/quizzes/types.ts`, replace line 46:

```ts
export type ModuleQuizId =
  | "modulo-1"
  | "modulo-2"
  | "modulo-3"
  | "usp-795"
  | "usp-800";
```

- [ ] **Step 2: Create the two banks as empty arrays (placeholder content fills in Task 3)**

```ts
// src/lib/quizzes/usp-795.ts
import type { Question } from "./types";

/**
 * Student module 1 — USP 〈795〉 Pharmaceutical Compounding (Nonsterile).
 * Bank drafted from public/modulos/est-795.pdf; pending owner review.
 */
export const usp795: readonly Question[] = [];
```

```ts
// src/lib/quizzes/usp-800.ts
import type { Question } from "./types";

/**
 * Student module 2 — USP 〈800〉 Hazardous Drugs in Healthcare Settings.
 * Bank drafted from public/modulos/est-800.pdf; pending owner review.
 */
export const usp800: readonly Question[] = [];
```

- [ ] **Step 3: Register both banks in the lookup**

In `src/lib/quizzes/index.ts`, replace lines 1-17:

```ts
import { dia1 } from "./dia-1";
import { dia2 } from "./dia-2";
import { dia3 } from "./dia-3";
import { usp795 } from "./usp-795";
import { usp800 } from "./usp-800";
import type { ModuleQuizId, Question, SanitizedQuestion } from "./types";

export type { ModuleQuizId, Question, SanitizedQuestion } from "./types";

/**
 * Module-id ↔ question-bank lookup. Keep `Question[]` (with
 * `correctAnswer` + `explanation`) server-side only; pass the sanitized
 * version to client components.
 */
const QUIZZES: Record<ModuleQuizId, readonly Question[]> = {
  "modulo-1": dia1,
  "modulo-2": dia2,
  "modulo-3": dia3,
  "usp-795": usp795,
  "usp-800": usp800,
};
```

- [ ] **Step 4: Verify type-check passes**

Run: `pnpm typecheck`
Expected: PASS (no missing-key error on the `Record<ModuleQuizId, …>`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/quizzes/types.ts src/lib/quizzes/index.ts src/lib/quizzes/usp-795.ts src/lib/quizzes/usp-800.ts
git commit -m "feat(quizzes): register student USP 795/800 banks (empty)"
```

---

## Task 3: Author the student quiz banks (content, owner-reviewed)

This is content authoring, not code. Source the questions from the full decks and follow the exact `Question` shape used in `src/lib/quizzes/dia-1.ts`. Ship behind owner review.

**Files:**
- Modify: `src/lib/quizzes/usp-795.ts`
- Modify: `src/lib/quizzes/usp-800.ts`

- [ ] **Step 1: Read the full decks**

Read every page of `~/Desktop/Presentaciones/Pharmaceutical-Compounding-Nonsterile-Preparations.pdf` and `~/Desktop/Presentaciones/Hazardous-Drugs-Handling-in-Healthcare-Settings-2.pdf` (use the Read tool's `pages` param in ≤20-page batches).

- [ ] **Step 2: Author ~15 questions per bank in the existing shape**

Each entry is a `Question` (`id` like `"E795-Q1"` / `"E800-Q1"`, `prompt`, `type`, `options` with `letter`/`text`, `correctAnswer`, `explanation`). Questions are in English to match the decks (the same as the professional `dia-1` bank, which is English). Seed examples derived from the decks (extend to ~15 each from the full content):

```ts
// src/lib/quizzes/usp-795.ts — replace the empty array
export const usp795: readonly Question[] = [
  {
    id: "E795-Q1",
    prompt:
      "Which USP General Chapter describes the minimum standards for compounded nonsterile preparations (CNSPs)?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "<795>" },
      { letter: "B", text: "<797>" },
      { letter: "C", text: "<800>" },
      { letter: "D", text: "<825>" },
    ],
    correctAnswer: "A",
    explanation:
      "<795> sets the minimum standards for nonsterile compounding; <797> covers sterile, <800> hazardous drugs, <825> radiopharmaceuticals.",
  },
  {
    id: "E795-Q2",
    prompt:
      "Preparing a single dose for a single patient when administration begins within 4 hours is:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Compounding under <795>" },
      { letter: "B", text: "Excluded from <795> (administration preparation, 4-hour rule)" },
      { letter: "C", text: "Allowed only for sterile products" },
      { letter: "D", text: "Prohibited" },
    ],
    correctAnswer: "B",
    explanation:
      "Patient-specific, time-limited administration preparation (≤4 h) is outside the scope of <795>.",
  },
  {
    id: "E795-Q3",
    prompt:
      "Beyond-Use Dates for CNSPs under <795> are assigned primarily using:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "The product's expiration date" },
      { letter: "B", text: "Water activity (aw) and Table 4 of <795>" },
      { letter: "C", text: "The compounder's preference" },
      { letter: "D", text: "A fixed 6-month rule for all forms" },
    ],
    correctAnswer: "B",
    explanation:
      "<795> assigns BUDs using water activity (aw) and the dosage-form categories in Table 4.",
  },
  // … extend to ~15 covering: definition of a CNSP; the designated person's
  // responsibilities; dosage forms in scope (solid oral, liquid oral,
  // rectal/vaginal, topical, nasal/sinus, otic); practices outside scope
  // (reconstitution per labeling, repackaging→<1178>, tablet splitting,
  // nonsterile radiopharmaceuticals→<825>); the five risks; HD layering
  // into <800>.
];
```

```ts
// src/lib/quizzes/usp-800.ts — replace the empty array
export const usp800: readonly Question[] = [
  {
    id: "E800-Q1",
    prompt: "The first goal of USP <800> as an occupational safety standard is to protect:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "The patient only" },
      { letter: "B", text: "The worker" },
      { letter: "C", text: "The manufacturer" },
      { letter: "D", text: "The insurer" },
    ],
    correctAnswer: "B",
    explanation:
      "<800> is an occupational safety standard; protecting healthcare personnel (worker safety) is its primary aim, alongside patient and environmental protection.",
  },
  {
    id: "E800-Q2",
    prompt: "An entity's hazardous-drug (HD) list must be reviewed at least every:",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "Month" },
      { letter: "B", text: "6 months" },
      { letter: "C", text: "12 months" },
      { letter: "D", text: "24 months" },
    ],
    correctAnswer: "C",
    explanation:
      "The HD list, drawn from the current NIOSH List, must be reviewed at least every 12 months.",
  },
  {
    id: "E800-Q3",
    prompt: "Which HDs may use an Assessment of Risk (AoR) for alternative containment?",
    type: "multiple-choice",
    options: [
      { letter: "A", text: "HD active pharmaceutical ingredients (APIs)" },
      { letter: "B", text: "Antineoplastics requiring manipulation" },
      { letter: "C", text: "Final dosage forms and other HDs not requiring manipulation beyond counting/repackaging" },
      { letter: "D", text: "No HDs may ever use an AoR" },
    ],
    correctAnswer: "C",
    explanation:
      "APIs and antineoplastics requiring manipulation must follow ALL containment; only eligible dosage forms may use an AoR.",
  },
  // … extend to ~15 covering: NIOSH definition of an HD; the three protected
  // populations; the six occupational-safety-plan elements; engineering
  // controls (C-PEC, C-SEC, supplemental); the two sterile HD configurations;
  // PPE incl. ASTM D6978 chemotherapy gloves; receipt/spill/deactivation/
  // medical-surveillance procedures; "treat as hazardous until proven otherwise".
];
```

- [ ] **Step 3: Type-check + run any quiz tests**

Run: `pnpm typecheck && pnpm vitest run tests/unit`
Expected: PASS.

- [ ] **Step 4: Owner review gate**

Surface the two banks to the owner (Jan) for review/edit before merge. Do not publish unreviewed clinical content.

- [ ] **Step 5: Commit**

```bash
git add src/lib/quizzes/usp-795.ts src/lib/quizzes/usp-800.ts
git commit -m "content(quizzes): student USP 795/800 question banks"
```

---

## Task 4: Student module i18n catalogue

**Files:**
- Modify: `src/messages/es.json`
- Modify: `src/messages/en.json`

- [ ] **Step 1: Add the `studentCurriculum` block to `es.json`**

Add a top-level key (sibling of `cursosGrid`). The `id` values MUST match `getCurriculum("student")` ids.

```json
"studentCurriculum": {
  "modules": [
    {
      "id": "usp-795",
      "day": "Módulo 1",
      "title": "USP 〈795〉 — Compounding No Estéril",
      "summary": "Definición de una preparación no estéril (CNSP) y su alcance, responsabilidades de la persona designada, estándares de instalación y manejo de componentes, asignación de Beyond-Use Dates por actividad de agua (aw) y la distinción frente a 〈797〉 y 〈800〉."
    },
    {
      "id": "usp-800",
      "day": "Módulo 2",
      "title": "USP 〈800〉 — Manejo de Drogas Peligrosas",
      "summary": "Criterios NIOSH para drogas peligrosas, lista de HD y Assessment of Risk, los tres niveles de controles de ingeniería (C-PEC, C-SEC, suplementarios), selección de PPE incluyendo guantes ASTM D6978, y procedimientos de recibo, derrame, desactivación y vigilancia médica."
    }
  ]
}
```

- [ ] **Step 2: Add the parallel block to `en.json`**

```json
"studentCurriculum": {
  "modules": [
    {
      "id": "usp-795",
      "day": "Module 1",
      "title": "USP 〈795〉 — Nonsterile Compounding",
      "summary": "Defining a compounded nonsterile preparation (CNSP) and its scope, the designated person's responsibilities, facility and component-handling standards, assigning Beyond-Use Dates by water activity (aw), and distinguishing 〈795〉 from 〈797〉 and 〈800〉."
    },
    {
      "id": "usp-800",
      "day": "Module 2",
      "title": "USP 〈800〉 — Handling Hazardous Drugs",
      "summary": "NIOSH criteria for hazardous drugs, the HD list and Assessment of Risk, the three levels of engineering controls (C-PEC, C-SEC, supplemental), PPE selection including ASTM D6978 chemotherapy gloves, and receipt, spill, deactivation, and medical-surveillance procedures."
    }
  ]
}
```

- [ ] **Step 3: Verify i18n parity**

Run: `pnpm check:i18n`
Expected: PASS (identical key structure ES/EN).

- [ ] **Step 4: Commit**

```bash
git add src/messages/es.json src/messages/en.json
git commit -m "i18n(portal): student module catalogue (USP 795/800)"
```

---

## Task 5: Copy student PDFs into public

**Files:**
- Create: `public/modulos/est-795.pdf`
- Create: `public/modulos/est-800.pdf`

- [ ] **Step 1: Create the modulos dir and copy the decks**

The `public/modulos/` directory is not tracked when empty; create it.

Run:
```bash
mkdir -p public/modulos
```

- [ ] **Step 2: Copy USP 795 deck**

Run:
```bash
cp ~/Desktop/Presentaciones/Pharmaceutical-Compounding-Nonsterile-Preparations.pdf public/modulos/est-795.pdf
```

- [ ] **Step 3: Copy USP 800 deck**

Run:
```bash
cp ~/Desktop/Presentaciones/Hazardous-Drugs-Handling-in-Healthcare-Settings-2.pdf public/modulos/est-800.pdf
```

- [ ] **Step 4: Verify both files exist**

Run: `ls -la public/modulos/`
Expected: `est-795.pdf` and `est-800.pdf` listed with non-zero size.

- [ ] **Step 5: Commit**

```bash
git add public/modulos/est-795.pdf public/modulos/est-800.pdf
git commit -m "content(portal): add student USP 795/800 module PDFs"
```

> Note: `dia-1.pdf` (professional) is added by the owner per STATUS.md and may be absent locally; the module page renders a "coming soon" card when a PDF is missing. The student decks ship in-repo.

---

## Task 6: Make the module page tier-aware

**Files:**
- Modify: `src/app/[locale]/(portal)/portal/modulos/[id]/page.tsx`

Replace the hard-wired `MODULE_IDS` / `dayNumberFromId` / `dia-{day}` logic with the curriculum layer. Resolve the module AFTER the user row is loaded so the tier is known.

- [ ] **Step 1: Swap the imports and remove the hardcoded id list**

In `src/app/[locale]/(portal)/portal/modulos/[id]/page.tsx`:

Add to the import block (near line 15):
```ts
import { resolveModule } from "@/lib/curriculum";
```

Delete the `MODULE_IDS`, `ModuleId`, and `dayNumberFromId` declarations (lines 45-51).

- [ ] **Step 2: Resolve the module from the user's tier**

Replace the body from `const day = dayNumberFromId(id);` (line 74) and the `if (day === null) notFound();` with a resolution that happens after the `user` row loads. Concretely:

Remove lines 74-75 (the early `day` computation). Then, immediately AFTER the existing `if (!user) redirect(...)` (line 87), insert:

```ts
  const mod = resolveModule(user.tier, id);
  if (!mod) notFound();
  const day = mod.ordinal;
```

- [ ] **Step 3: Resolve the PDF from the curriculum basename**

Replace the PDF discovery block (lines 145-151) with:

```ts
  const modulosDir = join(process.cwd(), "public", "modulos");
  const esPdfHref = existsSync(join(modulosDir, `${mod.pdfBasename}.pdf`))
    ? `/modulos/${mod.pdfBasename}.pdf`
    : null;
  const enPdfHref = existsSync(join(modulosDir, `${mod.pdfBasename}-en.pdf`))
    ? `/modulos/${mod.pdfBasename}-en.pdf`
    : null;
```

- [ ] **Step 4: Fix the i18n module lookup in `ModuleView`**

`ModuleView` reads `messages.cursosGrid.items[0]?.modules`. Make it tier-aware. Pass the tier into `ModuleView`:

In the `return <ModuleView … />` (line 153), add `tier={user.tier}`.

Update the `ModuleView` signature (line 164-176) to accept `tier: import("@/lib/curriculum").UserTier` and select the catalogue:

```ts
  const messages = useMessages() as unknown as CursosGridMessages & {
    studentCurriculum?: { modules: ModuleMessage[] };
  };
  const moduleList =
    tier === "student"
      ? (messages.studentCurriculum?.modules ?? [])
      : (messages.cursosGrid.items[0]?.modules ?? []);
  const moduleData = moduleList.find((m) => m.id === id);
```

(`id` is already passed into `ModuleView`.)

- [ ] **Step 5: Type-check**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(portal)/portal/modulos/[id]/page.tsx"
git commit -m "feat(portal): tier-aware module page (curriculum-resolved PDF + i18n)"
```

---

## Task 7: Make pre-test, post-test, results, and their actions tier-aware

All five files duplicate `MODULE_IDS` + `moduleQuizIdToInt`. Replace with `resolveModule(user.tier, id)` and use `.ordinal` for `quizAttempts.moduleId`.

**Files:**
- Modify: `src/app/[locale]/(portal)/portal/modulos/[id]/pre-test/page.tsx`
- Modify: `src/app/[locale]/(portal)/portal/modulos/[id]/pre-test/actions.ts`
- Modify: `src/app/[locale]/(portal)/portal/modulos/[id]/post-test/page.tsx`
- Modify: `src/app/[locale]/(portal)/portal/modulos/[id]/post-test/actions.ts`
- Modify: `src/app/[locale]/(portal)/portal/modulos/[id]/post-test/resultados/page.tsx`

- [ ] **Step 1: pre-test/page.tsx — resolve via curriculum after user load**

Add import: `import { resolveModule } from "@/lib/curriculum";`
Delete `MODULE_IDS` (line 22) and `moduleQuizIdToInt` (lines 29-33).
Remove the early `if (!MODULE_IDS.includes(...)) notFound(); const moduleId = id as ModuleQuizId;` (lines 52-53) and instead, after the `if (!user) redirect(...)` (line 63), insert:

```ts
  const mod = resolveModule(user.tier, id);
  if (!mod) notFound();
  const moduleId = id as ModuleQuizId;
```

Replace `moduleQuizIdToInt(moduleId)` in the `quizAttempts` query (line 79) with `mod.ordinal`.

Pass `tier={user.tier}` to `<PreTestPanel … />` (line 90) and select the catalogue in `PreTestPanel` the same way as Task 6 Step 4 (replace `messages.cursosGrid.items[0]?.modules.find(...)` at line 109-111):

```ts
  const moduleList =
    tier === "student"
      ? (messages.studentCurriculum?.modules ?? [])
      : (messages.cursosGrid.items[0]?.modules ?? []);
  const moduleData = moduleList.find((m) => m.id === moduleId);
```

Add `tier: import("@/lib/curriculum").UserTier` to the `PreTestPanel` props and widen the `CursosGridMessages` type as in Task 6.

- [ ] **Step 2: pre-test/actions.ts — ordinal from curriculum**

Add imports: `import { resolveModule } from "@/lib/curriculum"; import { notFound } from "next/navigation";`
Delete `moduleQuizIdToInt` (lines 76-81).
After the `if (!user) …` / paid gate (line 47), insert:

```ts
  const mod = resolveModule(user.tier, moduleId);
  if (!mod) notFound();
```

Replace `moduleId: moduleQuizIdToInt(moduleId),` in the insert (line 64) with `moduleId: mod.ordinal,`.

- [ ] **Step 3: post-test/page.tsx — resolve via curriculum**

Add import `resolveModule`. Delete `MODULE_IDS` (line 27). Remove the early membership check (lines 47-48) and, after `if (!user) …` and the paid gate (line 61), insert:

```ts
  const mod = resolveModule(user.tier, id);
  if (!mod) notFound();
  const moduleId = id as ModuleQuizId;
```

Pass `tier={user.tier}` to `<PostTestPanel />` (line 67) and make the catalogue selection tier-aware in `PostTestPanel` exactly as in Step 1 (replace line 92). Add `tier` to props + widen the messages type.

- [ ] **Step 4: post-test/actions.ts — ordinal from curriculum**

Add imports `resolveModule` and `notFound`. Delete `moduleQuizIdToInt` (lines 84-89). After the paid gate (line 55), insert:

```ts
  const mod = resolveModule(user.tier, moduleId);
  if (!mod) notFound();
```

Replace `moduleId: moduleQuizIdToInt(moduleId),` (line 71) with `moduleId: mod.ordinal,`.

- [ ] **Step 5: resultados/page.tsx — ordinal from curriculum**

Add import `resolveModule`. Delete `MODULE_IDS` (line 21) and `moduleQuizIdToInt` (lines 23-27). Remove the early membership check (lines 37-38) and, after the paid gate (line 51), insert:

```ts
  const mod = resolveModule(user.tier, id);
  if (!mod) notFound();
  const moduleId = id as ModuleQuizId;
```

Replace `eq(quizAttempts.moduleId, moduleQuizIdToInt(moduleId))` (line 61) with `eq(quizAttempts.moduleId, mod.ordinal)`.

- [ ] **Step 6: Type-check**

Run: `pnpm typecheck`
Expected: PASS (no remaining `moduleQuizIdToInt` references).

- [ ] **Step 7: Verify no leftover hardcoded helpers**

Run: `grep -rn "moduleQuizIdToInt\|MODULE_IDS" src/app`
Expected: no matches.

- [ ] **Step 8: Commit**

```bash
git add "src/app/[locale]/(portal)/portal/modulos/[id]/pre-test" "src/app/[locale]/(portal)/portal/modulos/[id]/post-test"
git commit -m "feat(portal): tier-aware pre/post-test + results via curriculum ordinal"
```

---

## Task 8: Tier-aware dashboard (module list + ACPE omission)

**Files:**
- Modify: `src/app/[locale]/(portal)/portal/page.tsx`

- [ ] **Step 1: Import the curriculum helpers**

Add to imports (near line 16):
```ts
import { showAcpeDisclosure, type UserTier } from "@/lib/curriculum";
```

- [ ] **Step 2: Select the catalogue by tier in `Dashboard`**

The `PortalDashboardPage` already passes `user` to `Dashboard`, and `Dashboard` has `user`. Replace the module source (line 110):

```ts
  const messages = useMessages() as unknown as CursosGridMessages & {
    studentCurriculum?: { modules: ModuleI18n[] };
  };
  const modules =
    user.tier === "student"
      ? (messages.studentCurriculum?.modules ?? [])
      : (messages.cursosGrid.items[0]?.modules ?? []);
```

- [ ] **Step 3: Omit the ACPE disclosure for students**

Replace the unconditional `<AcpeDisclosure locale={locale} />` (line 139) with:

```ts
      {showAcpeDisclosure(user.tier as UserTier) && (
        <AcpeDisclosure locale={locale} />
      )}
```

- [ ] **Step 4: Type-check**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(portal)/portal/page.tsx"
git commit -m "feat(portal): tier-aware dashboard module list; hide ACPE block for students"
```

---

## Task 9: Generalize certificate eligibility + numbering

**Files:**
- Modify: `src/lib/certificates/index.ts`
- Create: `tests/unit/certificate-program.test.ts`
- Modify (call sites, to keep `pnpm typecheck` green): `src/app/[locale]/(portal)/portal/page.tsx`, `src/app/api/certificate/route.ts`, `src/app/[locale]/(portal)/portal/certificado/page.tsx`

- [ ] **Step 1: Write failing unit tests for the pure helpers**

```ts
// tests/unit/certificate-program.test.ts
import { describe, expect, it } from "vitest";
import { certPrefix, evaluateEligibility } from "@/lib/certificates";

describe("certPrefix", () => {
  it("uses the bare prefix for the professional program", () => {
    expect(certPrefix("profesional", 2026)).toBe("SCCA-2026-");
  });
  it("uses the EST prefix for the student program", () => {
    expect(certPrefix("student", 2026)).toBe("SCCA-EST-2026-");
  });
  it("keeps the two prefixes disjoint so LIKE numbering never crosses", () => {
    expect("SCCA-EST-2026-001".startsWith("SCCA-2026-")).toBe(false);
  });
});

describe("evaluateEligibility", () => {
  it("requires all three ordinals for the professional tier", () => {
    expect(evaluateEligibility(new Set([1, 2]), "profesional").eligible).toBe(false);
    expect(evaluateEligibility(new Set([1, 2, 3]), "profesional").eligible).toBe(true);
  });
  it("requires only two ordinals for the student tier", () => {
    expect(evaluateEligibility(new Set([1]), "student").eligible).toBe(false);
    expect(evaluateEligibility(new Set([1, 2]), "student").eligible).toBe(true);
  });
  it("reports per-ordinal pass map for the tier's required modules", () => {
    expect(evaluateEligibility(new Set([2]), "student").passedModules).toEqual({
      1: false,
      2: true,
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run tests/unit/certificate-program.test.ts`
Expected: FAIL — `certPrefix` / `evaluateEligibility` not exported.

- [ ] **Step 3: Rewrite `src/lib/certificates/index.ts`**

Replace the top imports and the eligibility section (lines 1-64) and the numbering section to thread tier/program:

```ts
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { certificates, quizAttempts } from "@/lib/db/schema";
import { getCurriculum, requiredOrdinals, type UserTier } from "@/lib/curriculum";

/** Which certificate program a row belongs to. Encoded in the certNo
 *  prefix (SCCA- vs SCCA-EST-) so no DB column is needed. */
export type CertProgram = "profesional" | "student";

/** Map a user tier to its certificate program. */
export function programForTier(tier: UserTier): CertProgram {
  return tier === "student" ? "student" : "profesional";
}

/** Sequential-numbering prefix for a program + year. Disjoint between
 *  programs so the `LIKE prefix%` MAX() query never crosses tracks. */
export function certPrefix(program: CertProgram, year: number): string {
  return program === "student" ? `SCCA-EST-${year}-` : `SCCA-${year}-`;
}

export type EligibilityReport = {
  eligible: boolean;
  /** ordinal → passed, for exactly the tier's required modules. */
  passedModules: Record<number, boolean>;
};

/** Pure eligibility evaluation against a set of passed ordinals. */
export function evaluateEligibility(
  passedOrdinals: ReadonlySet<number>,
  tier: UserTier,
): EligibilityReport {
  const required = requiredOrdinals(tier);
  const passedModules: Record<number, boolean> = {};
  for (const ordinal of required) passedModules[ordinal] = passedOrdinals.has(ordinal);
  return {
    eligible: required.every((ordinal) => passedModules[ordinal]),
    passedModules,
  };
}

export async function isEligibleForCertificate(
  userId: string,
  tier: UserTier,
): Promise<EligibilityReport> {
  const required = requiredOrdinals(tier);
  const rows = await db
    .select({ moduleId: quizAttempts.moduleId })
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.userId, userId),
        inArray(quizAttempts.moduleId, required),
        eq(quizAttempts.passed, true),
        // Only the graded post-test counts — a passing diagnostic
        // pre-test must never qualify a student.
        eq(quizAttempts.phase, "post"),
      ),
    );
  return evaluateEligibility(new Set(rows.map((r) => r.moduleId)), tier);
}

// Reference so an unused-import lint never trips while wiring; the value
// is consumed by requiredOrdinals via getCurriculum.
void getCurriculum;
```

Then update `getOrCreateCertificate` (lines 95-128) to take `program` and use `certPrefix`:

```ts
export async function getOrCreateCertificate(
  userId: string,
  program: CertProgram,
): Promise<{ cert: CertRecord; isNew: boolean }> {
  const existing = await findCertificateByUser(userId);
  if (existing) return { cert: existing, isNew: false };

  const year = new Date().getFullYear();
  const prefix = certPrefix(program, year);

  const startSeq = (() => {
    const raw = process.env.CERTIFICATE_YEAR_SEQUENCE_START;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  })();

  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const nextNum = await nextSequenceNumber(prefix, startSeq);
    const certNo = `${prefix}${String(nextNum).padStart(3, "0")}`;
    const issuedAt = new Date();
    try {
      await db.insert(certificates).values({ certNo, userId, issuedAt });
      return { cert: { certNo, userId, issuedAt }, isNew: true };
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) throw err;
    }
  }
  throw new Error("Failed to allocate certificate number after retries.");
}
```

> Numbering safety: `nextSequenceNumber` runs `MAX(certNo) LIKE 'SCCA-EST-2026-%'` for students and `'SCCA-2026-%'` for professionals. Because `SCCA-2026-%` cannot match `SCCA-EST-…` (the char after `SCCA-` differs), the two sequences never collide. (`findCertificateByUser`, `findCertificateByNumber`, `nextSequenceNumber` are unchanged.)

- [ ] **Step 4: Run unit tests to verify they pass**

Run: `pnpm vitest run tests/unit/certificate-program.test.ts`
Expected: PASS.

- [ ] **Step 5: Update every call site of the changed signatures (keep the tree green)**

Changing `isEligibleForCertificate` (now needs `tier`), `EligibilityReport.passedModules` (now `Record<number, boolean>`), and `getOrCreateCertificate` (now needs `program`) breaks three callers. Update all of them in this task:

**(a) `src/app/[locale]/(portal)/portal/page.tsx`** — the dashboard eligibility call (line ~84):
```ts
    (user.paidAt ? (await isEligibleForCertificate(user.id, user.tier)).eligible : false);
```

**(b) `src/app/api/certificate/route.ts`** — eligibility + allocation (do NOT touch the render calls yet; those move in Task 10). Add `import { programForTier } from "@/lib/certificates";`, then:
```ts
  const eligibility = await isEligibleForCertificate(user.id, user.tier);
```
```ts
  const { cert } = await getOrCreateCertificate(user.id, programForTier(user.tier));
```
(The existing `const awardsCeus = user.tier !== "student";` and the `renderCertificatePdf({ …, awardsCeus })` calls stay unchanged in this task.)

**(c) `src/app/[locale]/(portal)/portal/certificado/page.tsx`** — make the eligibility call + checklist curriculum-driven. Concretely:
- Add `import { getCurriculum, requiredOrdinals, type UserTier } from "@/lib/curriculum";` and `STUDENT_MODULES_I18N_KEY` is not needed (read the array directly).
- Delete the page-local `const MODULE_IDS = ["modulo-1","modulo-2","modulo-3"] as const;` (line 20).
- Eligibility call (line 58): `const eligibility = await isEligibleForCertificate(user.id, user.tier);`
- Owner passed-map (lines 60-62): derive from the tier's ordinals instead of the literal `{1,2,3}`:
```ts
  const passedModules = isOwner
    ? Object.fromEntries(requiredOrdinals(user.tier).map((o) => [o, true]))
    : eligibility.passedModules;
```
- Pass the curriculum + tier into `CertPanel`: add props `modules={getCurriculum(user.tier)}` and `tier={user.tier}`.
- In `CertPanel`, change the `passedModules` prop type to `Record<number, boolean>`, add `modules: readonly { id: string; ordinal: number }[]` and `tier: UserTier` props, select the i18n catalogue tier-aware:
```ts
  const messages = useMessages() as unknown as CursosGridMessages & {
    studentCurriculum?: { modules: ModuleI18n[] };
  };
  const moduleList =
    tier === "student"
      ? (messages.studentCurriculum?.modules ?? [])
      : (messages.cursosGrid.items[0]?.modules ?? []);
```
- Replace the checklist `MODULE_IDS.map((moduleId, idx) => { const moduleNum = (idx+1) as 1|2|3; ... })` (lines 151-211) so it iterates the passed `modules` curriculum list: use `mod.id` for the route `id`, `mod.ordinal` for `passedModules[mod.ordinal]`, and `moduleList.find((m) => m.id === mod.id)` for the i18n title/day. The fallback title becomes `` `Módulo ${mod.ordinal}` ``.

- [ ] **Step 6: Type-check + unit tests**

Run: `pnpm typecheck && pnpm vitest run tests/unit`
Expected: PASS (all call sites updated; professional path unchanged — 3 modules, `SCCA-` numbering).

- [ ] **Step 7: Commit**

```bash
git add src/lib/certificates/index.ts tests/unit/certificate-program.test.ts "src/app/[locale]/(portal)/portal/page.tsx" src/app/api/certificate/route.ts "src/app/[locale]/(portal)/portal/certificado/page.tsx"
git commit -m "feat(cert): tier-aware eligibility + per-program numbering"
```

---

## Task 10: Student certificate render + API + public verification

**Files:**
- Modify: `src/lib/certificates/render.ts`
- Modify: `src/app/api/certificate/route.ts`
- Modify: `src/app/verificar/[certNo]/page.tsx`
- Modify: `src/messages/es.json`, `src/messages/en.json`

- [ ] **Step 1: Add a `program` field to `CertRenderInput` and a student body**

In `src/lib/certificates/render.ts`, replace the `awardsCeus` field in `CertRenderInput` (lines 39-45) with:

```ts
  /**
   * Certificate program. "profesional" prints the ACPE CE credit and
   * provider line; "student" prints a completion certificate with no
   * CEUs and no ACPE provider line.
   */
  program: "profesional" | "student";
```

In `renderCertificatePdf`, derive the old flag once after the signature line is set (near line 64):

```ts
  const awardsCeus = input.program !== "student";
```

Then change the two `drawCentered` ACPE lines so they are program-aware. In `drawOverlay` (lines 204-227), replace the audience + credit + provider block with:

```ts
  drawCentered(
    page,
    input.program === "student"
      ? "Student Track — Foundations of Nonsterile Compounding"
      : "for Pharmacists & Pharmacy Technicians",
    { y: 237, size: 10, font: helvetica, color: COLOR.gray900 },
  );
  drawCentered(
    page,
    input.program === "student"
      ? "Certificate of Completion · USP 〈795〉 & 〈800〉"
      : awardsCeus
        ? "18 contact hours · 1.8 CEUs · Knowledge-based, Level 1"
        : "18 contact hours · Knowledge-based, Level 1",
    { y: 221, size: 10, font: helvetica, color: COLOR.gray900 },
  );
  if (input.program !== "student") {
    drawCentered(page, "ACPE Provider 0151 — Puerto Rico College of Pharmacists", {
      y: 205,
      size: 9,
      font: helvetica,
      color: COLOR.gray700,
    });
  }
```

`drawOverlay` needs `awardsCeus` in scope — pass it as a parameter. Update its signature (line 140) to add `awardsCeus: boolean` and update both call sites (`drawWithPdfTemplate` line 121, `drawWithTemplate` line 137) to pass it; thread `awardsCeus` from `renderCertificatePdf` into those two helper calls (lines 83, 85). The course title line at y=254 ("Basic Non-Sterile Compounding") becomes:

```ts
  drawCentered(
    page,
    input.program === "student"
      ? "Nonsterile Compounding — Student Program"
      : "Basic Non-Sterile Compounding",
    { y: 254, size: 14, font: helveticaBold, color: COLOR.tealDeep },
  );
```

Apply the same program-aware logic to `drawPlaceholderBody` (the no-template path, lines 360-391): for students, course line "Compounding No Estéril — Programa de Estudiantes", credit line "Certificado de Finalización · USP 〈795〉 y 〈800〉", and skip the "Acreditado por el Colegio… ACPE Provider 0151" line. Add `awardsCeus`/`program` access — `drawPlaceholderBody` already receives `input`, so use `input.program` directly there.

- [ ] **Step 2: Type-check the render in isolation**

Run: `pnpm typecheck`
Expected: FAIL only in `route.ts` (still passing `awardsCeus`) — fixed next step.

- [ ] **Step 3: Update the certificate API route**

In `src/app/api/certificate/route.ts`:

Add import (near line 12):
```ts
import { programForTier } from "@/lib/certificates";
```

Replace the `awardsCeus` derivation (lines 53-58) with:
```ts
  // Program drives the certificate copy + numbering. Students get a
  // non-ACPE completion certificate (SCCA-EST-…); everyone else the
  // CE-bearing professional certificate.
  const program = programForTier(user.tier);
```

In the owner-preview render (lines 70-76), replace `awardsCeus,` with `program,`.

Replace the eligibility call (line 94) with:
```ts
  const eligibility = await isEligibleForCertificate(user.id, user.tier);
```

Replace the cert allocation (line 105) with:
```ts
  const { cert } = await getOrCreateCertificate(user.id, program);
```

In the final render (lines 110-116), replace `awardsCeus,` with `program,`.

- [ ] **Step 4: (Done in Task 9)** The dashboard and certificado eligibility calls + `getOrCreateCertificate(program)` were already updated in Task 9 Step 5 to keep the tree green. Nothing to do here — just confirm `src/app/[locale]/(portal)/portal/page.tsx` already passes `user.tier`.

- [ ] **Step 5: Make the public verification page program-aware**

In `src/app/verificar/[certNo]/page.tsx`, derive the program from the certNo prefix and pick the course copy keys. After `const valid = Boolean(row);` (line 56), add:

```ts
  const program = certNo.startsWith("SCCA-EST-") ? "student" : "profesional";
```

Pass `program` into `VerifyPanel` (line 63-68) and add it to the props type (line 73-83) as `program: "profesional" | "student"`. Replace the course copy block (lines 153-158) with:

```ts
            <p className="font-heading text-gray-900 mt-2 text-base font-semibold leading-snug sm:text-lg">
              {t(program === "student" ? "courseTitleStudent" : "courseTitle")}
            </p>
            <p className="text-gray-700 mt-2 text-sm leading-relaxed">
              {t(program === "student" ? "courseSubtitleStudent" : "courseSubtitle")}
            </p>
```

- [ ] **Step 6: Add the verificar student copy keys to both message files**

In `src/messages/es.json` under `verificar`, add:
```json
"courseTitleStudent": "Programa de Estudiantes — Fundamentos de Compounding No Estéril",
"courseSubtitleStudent": "USP 〈795〉 y 〈800〉 · Certificado de finalización"
```

In `src/messages/en.json` under `verificar`, add:
```json
"courseTitleStudent": "Student Program — Foundations of Nonsterile Compounding",
"courseSubtitleStudent": "USP 〈795〉 & 〈800〉 · Certificate of completion"
```

- [ ] **Step 7: Full type-check + i18n parity**

Run: `pnpm typecheck && pnpm check:i18n`
Expected: PASS.

- [ ] **Step 8: Verify no leftover `awardsCeus`**

Run: `grep -rn "awardsCeus" src`
Expected: only references inside `render.ts` (the locally-derived `const awardsCeus`), none in `route.ts`.

- [ ] **Step 9: Commit**

```bash
git add src/lib/certificates/render.ts src/app/api/certificate/route.ts "src/app/verificar/[certNo]/page.tsx" "src/app/[locale]/(portal)/portal/page.tsx" src/messages/es.json src/messages/en.json
git commit -m "feat(cert): student completion certificate (no ACPE) + program-aware verification"
```

---

## Task 11: Landing — two-track course presentation

Add a second, informational course card for the student track. It reuses
the existing enrollment path (course `basic-compounding` + tier `student`),
so no new course/cohort/price/webhook is introduced.

**Files:**
- Modify: `src/components/marketing/CursosGrid.tsx`
- Modify: `src/components/marketing/inscripcion/InscripcionForm.tsx`
- Modify: `src/app/[locale]/(marketing)/inscripcion/page.tsx`
- Modify: `src/messages/es.json`, `src/messages/en.json`

- [ ] **Step 1: Extend the `CourseItem` type in `CursosGrid.tsx`**

Replace the `CourseItem` type (lines 22-29) with:

```ts
type CourseItem = {
  id: string;
  level: string;
  title: string;
  description: string;
  duration: string;
  modules: ModuleItem[];
  /** Rendered when there is no catalogue entry (virtual track card). */
  uspLabel?: string;
  /** Per-card inclusions; falls back to the global list when absent. */
  includesItems?: string[];
  /** Non-ACPE credential note, shown when the card has no `acpe`. */
  credentialNote?: string;
  /** Enrollment target — defaults to `id`; the student card points at
   *  the real `basic-compounding` course. */
  enrollCourseId?: string;
  /** Tier radio to preselect on the inscription form. */
  enrollTier?: "profesional" | "student";
};
```

- [ ] **Step 2: Make uspLabel, includes, CE, credential, and the CTA card-aware**

In `CursosGrid.tsx`, inside the `items.map` callback, after `const cohortMonth = nextCohortLabel(course.id);` (line 97) add:

```ts
            const uspLabel = courseData?.uspLabel ?? course.uspLabel;
            const cardIncludes = course.includesItems ?? includesItems;
```

Replace the eyebrow uspLabel guard (lines 107-112) to use the local `uspLabel`:

```ts
                    {uspLabel && (
                      <>
                        <span aria-hidden className="text-teal-deep/40">·</span>
                        <span className="text-teal-deep/80">{uspLabel}</span>
                      </>
                    )}
```

Replace `includesItems?.length > 0` and the `.map` source (lines 150, 156) so the block uses `cardIncludes` (i.e. `{cardIncludes?.length > 0 && (` and `{cardIncludes.map(...)`).

After the ACPE block (closes at line 193), add a non-ACPE credential block:

```ts
                  {!courseData?.acpe && course.credentialNote && (
                    <div className="border-gray-300 mt-6 border-t pt-6">
                      <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
                        {t("credentialLabel")}
                      </p>
                      <p className="text-gray-900 mt-3 text-sm leading-relaxed">
                        {course.credentialNote}
                      </p>
                    </div>
                  )}
```

Replace the CTA `Link` href (line 213) with an enrollment-target + tier query:

```ts
                          href={{
                            pathname: "/inscripcion",
                            query: {
                              course: course.enrollCourseId ?? course.id,
                              ...(course.enrollTier ? { tier: course.enrollTier } : {}),
                            },
                          }}
```

- [ ] **Step 3: Add the `credentialLabel` key + the student item to `es.json`**

Under `cursosGrid`, add the label key:
```json
"credentialLabel": "Credencial",
```

Append a second entry to `cursosGrid.items` (after the existing `basic-compounding` item):
```json
{
  "id": "student-foundations",
  "level": "Fundamentos",
  "uspLabel": "USP 〈795〉 + 〈800〉",
  "title": "Track de Estudiantes — Compounding No Estéril",
  "description": "Programa auto-dirigido en línea para estudiantes pre-licenciatura. Dos módulos didácticos sobre los capítulos USP que rigen el compounding no estéril y el manejo de drogas peligrosas.",
  "duration": "Auto-dirigido · en línea",
  "modules": [
    {
      "id": "usp-795",
      "day": "Módulo 1",
      "title": "USP 〈795〉 — Compounding No Estéril",
      "summary": "Alcance de una preparación no estéril (CNSP), persona designada, estándares de instalación, Beyond-Use Dates por actividad de agua (aw) y la distinción frente a 〈797〉 y 〈800〉."
    },
    {
      "id": "usp-800",
      "day": "Módulo 2",
      "title": "USP 〈800〉 — Drogas Peligrosas",
      "summary": "Criterios NIOSH, lista de HD y Assessment of Risk, controles de ingeniería (C-PEC, C-SEC), PPE incluyendo guantes ASTM D6978, y procedimientos de derrame y vigilancia médica."
    }
  ],
  "includesItems": [
    "Acceso al portal de estudiantes",
    "Presentaciones USP 〈795〉 y 〈800〉",
    "Quiz por módulo con retroalimentación",
    "Certificado de finalización"
  ],
  "credentialNote": "Certificado de finalización — sin créditos de educación continua (CE) de ACPE. El crédito CE está reservado al track profesional.",
  "enrollCourseId": "basic-compounding",
  "enrollTier": "student"
}
```

- [ ] **Step 4: Add the parallel `credentialLabel` + student item to `en.json`**

Under `cursosGrid`, add:
```json
"credentialLabel": "Credential",
```

Append to `cursosGrid.items`:
```json
{
  "id": "student-foundations",
  "level": "Foundations",
  "uspLabel": "USP 〈795〉 + 〈800〉",
  "title": "Student Track — Nonsterile Compounding",
  "description": "A self-paced online program for pre-licensure students. Two didactic modules on the USP chapters that govern nonsterile compounding and hazardous-drug handling.",
  "duration": "Self-paced · online",
  "modules": [
    {
      "id": "usp-795",
      "day": "Module 1",
      "title": "USP 〈795〉 — Nonsterile Compounding",
      "summary": "Scope of a compounded nonsterile preparation (CNSP), the designated person, facility standards, Beyond-Use Dates by water activity (aw), and distinguishing 〈795〉 from 〈797〉 and 〈800〉."
    },
    {
      "id": "usp-800",
      "day": "Module 2",
      "title": "USP 〈800〉 — Hazardous Drugs",
      "summary": "NIOSH criteria, the HD list and Assessment of Risk, engineering controls (C-PEC, C-SEC), PPE including ASTM D6978 gloves, and spill and medical-surveillance procedures."
    }
  ],
  "includesItems": [
    "Student portal access",
    "USP 〈795〉 and 〈800〉 presentations",
    "Per-module quiz with feedback",
    "Certificate of completion"
  ],
  "credentialNote": "Certificate of completion — no ACPE continuing-education (CE) credit. CE credit is reserved for the professional track.",
  "enrollCourseId": "basic-compounding",
  "enrollTier": "student"
}
```

- [ ] **Step 5: Add `preselectedTier` to `InscripcionForm`**

In `src/components/marketing/inscripcion/InscripcionForm.tsx`, add to `Props` (after line 24):
```ts
  /** Tier radio to preselect via ?tier= query param (optional). */
  preselectedTier?: "profesional" | "student";
```

Add `preselectedTier` to the destructured params (line 44-49), then seed the tier state (replace line 72):
```ts
  const [tier, setTier] = useState<Tier>(
    preselectedTier === "profesional" || preselectedTier === "student"
      ? preselectedTier
      : DEFAULT_TIER,
  );
```

- [ ] **Step 6: Thread `?tier=` through the inscription page**

In `src/app/[locale]/(marketing)/inscripcion/page.tsx`:

Widen the searchParams type (line 35):
```ts
  searchParams: Promise<{ course?: string; tier?: string }>;
```

Destructure it (line 38):
```ts
  const { course, tier } = await searchParams;
```

Pass it down (line 52):
```ts
    <InscripcionPage
      locale={loc}
      preselectedCourseSlug={course}
      preselectedTier={tier === "student" || tier === "profesional" ? tier : undefined}
      cohorts={cohorts}
    />
```

Add the prop to `InscripcionPage` (line 56-64):
```ts
function InscripcionPage({
  locale,
  preselectedCourseSlug,
  preselectedTier,
  cohorts,
}: {
  locale: "es" | "en";
  preselectedCourseSlug?: string;
  preselectedTier?: "profesional" | "student";
  cohorts: CohortOption[];
}) {
```

Pass it into `<InscripcionForm>` (line 89-94): add `preselectedTier={preselectedTier}`.

- [ ] **Step 7: Type-check + i18n parity**

Run: `pnpm typecheck && pnpm check:i18n`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/marketing/CursosGrid.tsx src/components/marketing/inscripcion/InscripcionForm.tsx "src/app/[locale]/(marketing)/inscripcion/page.tsx" src/messages/es.json src/messages/en.json
git commit -m "feat(landing): two-track course cards (professional + student)"
```

---

## Task 12: Regression + full gauntlet

**Files:**
- (Run only — no edits unless a check fails.)

- [ ] **Step 1: Run the full unit + component suite**

Run: `pnpm test`
Expected: PASS, including any existing certificate/module-access tests. If an existing test stubbed `isEligibleForCertificate(userId)` or `getOrCreateCertificate(userId)` with the old single-arg signature, update the call to pass the tier/program (professional path: `isEligibleForCertificate(id, "profesional")`, `getOrCreateCertificate(id, "profesional")`) so behavior is unchanged.

- [ ] **Step 2: Run e2e (axe + portal flows)**

Run: `pnpm test:e2e`
Expected: PASS. Confirm the professional portal flows are unchanged.

- [ ] **Step 3: Lint + build**

Run: `pnpm lint && pnpm build`
Expected: PASS (brand-lint included — no new hex literals were added; `render.ts` uses `rgb()`).

- [ ] **Step 4: Manual smoke (optional, with a student test user)**

Set a Neon `user` row to `tier='student'`, `student_verification='approved'`, `paid_at=now()`. Sign in and confirm: dashboard shows two USP modules, NO ACPE block; `/portal/modulos/usp-795` renders the deck; pre-test → module → post-test → results work; passing both unlocks the cert; downloaded PDF says "Certificate of Completion" with no CEUs; cert number is `SCCA-EST-2026-NNN`; `/verificar/SCCA-EST-2026-NNN` shows the student course copy. Confirm `/portal/modulos/modulo-1` 404s for the student (cross-tier).

Landing: on `/es` (and `/es/cursos`) confirm two course cards render — the professional card unchanged (3 days, ACPE CE block, INCLUYE list), and a student card (two USP modules, "Credencial" completion note, NO ACPE block, online inclusions). Click the student card CTA → `/inscripcion?course=basic-compounding&tier=student` with the **Estudiante** tier radio preselected. Confirm the professional card CTA still preselects the professional tier.

- [ ] **Step 5: Commit (if any test fixes were needed)**

```bash
git add -A
git commit -m "test: keep professional regression green after portal split"
```

---

## Self-Review notes (author check against spec)

- **Spec §1 (no migration):** Tasks reinterpret `quizAttempts.moduleId` as ordinal (Task 7) and encode program in `certNo` prefix (Task 9). No schema change. ✓
- **Spec §2 (curriculum layer):** Task 1. ✓
- **Spec §3 (quizzes):** Tasks 2-3 (registry + content), bilingual English banks matching the existing `dia-1` style. ✓
- **Spec §4 (dashboard/routing, ACPE omission):** Tasks 6-8. ✓
- **Spec §5 (certificate eligibility/numbering/render, derive program from prefix):** Tasks 9-10. ✓
- **Spec §6 (i18n):** Tasks 4 + 10 Step 6; `check:i18n` gates parity. ✓
- **Spec §7 (assets):** Task 5. ✓
- **Spec §8 (landing two cards):** Task 11 — second `CursosGrid` item (virtual `student-foundations` id → no ACPE), per-card includes/credential, CTA into the existing `basic-compounding` + `student` enrollment with the tier radio preselected. ✓
- **Spec §9 (tests):** Tasks 1, 9 unit tests; Task 12 regression + e2e + manual student & landing smoke. ✓
- **Enrollment-safe:** the student card enrolls into the existing course/cohort/price; `student-foundations` is a marketing-only virtual id, never passed to `/api/inscripcion` (the CTA sends `basic-compounding`). ✓
- **Type consistency:** `UserTier` (curriculum) used everywhere `users.tier` flows; `CertProgram` derived via `programForTier`; `resolveModule().ordinal` replaces every `moduleQuizIdToInt`/`dayNumberFromId`. ✓
- **Known limitation (documented):** owners (tier `null`) preview the professional curriculum, not the student one; previewing the student track needs a `tier='student'` test account. Out of scope per spec.
