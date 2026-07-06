# Hide Prices + "Otros Profesionales" Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide all public prices (shown only at Stripe checkout) and add an "Otros Profesionales" enrollment track priced like pharmacists but earning a completion certificate with **no ACPE CE**.

**Architecture:** "Otros Profesionales" is not a new DB tier — it stays `tier='profesional'` (same `STRIPE_PRICE_ID_PROFESIONAL`, same 3-module curriculum). The CE-vs-completion distinction is centralized in one eligibility predicate keyed on `users.professional_type`, and a third certificate program (`profesional-completion`, prefix `SCCA-COMP-`) carries the no-CE completion cert. Marketing surfaces gain a third card and hide dollar amounts.

**Tech Stack:** Next.js (App Router, RSC + server actions), Drizzle ORM (Postgres/Neon), Stripe Checkout, next-intl (es/en), pdf-lib, Vitest, Resend.

## Global Constraints

- **No DB migration, no new Stripe Price, no change to `courses.ts` price values.** (`professional_type` is existing nullable text; `STRIPE_PRICE_ID_PROFESIONAL` is reused.)
- **CE eligibility is the positive test only:** `tier === "profesional" && (professionalType === "farmaceutico" || professionalType === "tecnico")`. **Never test `=== "otro"`** — that string is discarded before persistence (`InscripcionForm.tsx:109-118`). Fail-safe: null/unknown/free-text → no CE.
- **Do NOT run `pnpm db:generate`** (stale journal risk; there is no schema change).
- **Existing cert prefixes are immutable:** `SCCA-{year}-` (professional CE) and `SCCA-EST-{year}-` (student) must not change. New completion prefix is `SCCA-COMP-{year}-`.
- **i18n mirrored:** every key added to `src/messages/es.json` must be added to `src/messages/en.json`.
- **Certs re-render from current code on each download** (not frozen PDFs) — Task 1's data audit must be clear before deploying Tasks 2–8.
- **Never commit to `main`.** Work stays on `feat/hide-prices-otros-profesionales-track`. Test command: `pnpm vitest run <path>`. Full suite: `pnpm vitest run`. Lint: `pnpm lint`.

---

### Task 1: Pre-deploy data audit (compliance gate — no code)

Certs re-render from live data, so an existing professional graduate whose `professional_type` is null/non-pharmacy would flip from CE to completion after Tasks 2–8 deploy. Clear this before merge.

**Files:** none (operational).

- [ ] **Step 1: Run the read-only audit against the pilot DB**

Run (via the project's DB access — Neon SQL console or `ssh czi`/psql as configured; raw SQL, not `pnpm db:*`):

```sql
SELECT tier, professional_type, count(*)
FROM "user"
GROUP BY tier, professional_type
ORDER BY tier, professional_type;
```

Expected: a small table. Focus on rows where `tier='profesional'`.

- [ ] **Step 2: Interpret**

For every `tier='profesional'` row whose `professional_type` is **not** `farmaceutico` or `tecnico` (null, empty, `medico`, free text, …): after deploy these become no-CE completion certs. Confirm with the owner whether any such row is a real pharmacist/tech who must keep CE.

- [ ] **Step 3: Backfill only if the owner confirms a misclassified pharmacist/tech**

Blast-radius note first: this UPDATE touches only professional-tier rows you name by id; it cannot widen CE (it only sets pharmacy roles the owner confirms). Parameterized, id-scoped:

```sql
-- Example: only after owner confirms these ids are pharmacists.
UPDATE "user" SET professional_type = 'farmaceutico'
WHERE id = $1 AND tier = 'profesional';
```

- [ ] **Step 4: Record the audit result in the PR description** (counts + any backfill performed). This gate must read "clean" before Tasks 2–8 merge to a deploy branch.

---

### Task 2: CE eligibility predicate

**Files:**
- Modify: `src/lib/professions.ts`
- Modify: `src/lib/certificates/index.ts`
- Test: `tests/unit/ce-eligibility.test.ts` (create)

**Interfaces:**
- Produces: `isPharmacyRole(professionalType: string | null | undefined): boolean` (professions.ts); `isCeEligible(tier: UserTier, professionalType: string | null): boolean` (certificates/index.ts).

- [ ] **Step 1: Write the failing test**

Create `tests/unit/ce-eligibility.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isPharmacyRole } from "@/lib/professions";
import { isCeEligible } from "@/lib/certificates";

describe("isPharmacyRole", () => {
  it("is true only for pharmacist and technician codes", () => {
    expect(isPharmacyRole("farmaceutico")).toBe(true);
    expect(isPharmacyRole("tecnico")).toBe(true);
  });
  it("is false for every other value incl. null/empty/free text", () => {
    for (const v of [null, undefined, "", "otro", "medico", "enfermero", "Quimico"]) {
      expect(isPharmacyRole(v)).toBe(false);
    }
  });
});

describe("isCeEligible", () => {
  it("is true only for professional-tier pharmacists/techs", () => {
    expect(isCeEligible("profesional", "farmaceutico")).toBe(true);
    expect(isCeEligible("profesional", "tecnico")).toBe(true);
  });
  it("is false for professional non-pharmacy, student, and null tier", () => {
    expect(isCeEligible("profesional", "medico")).toBe(false);
    expect(isCeEligible("profesional", null)).toBe(false);
    expect(isCeEligible("student", "farmaceutico")).toBe(false);
    expect(isCeEligible(null, "farmaceutico")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/ce-eligibility.test.ts`
Expected: FAIL — `isPharmacyRole`/`isCeEligible` not exported.

- [ ] **Step 3: Add `isPharmacyRole` to `professions.ts`**

Append to `src/lib/professions.ts`:

```ts
/**
 * Pharmacy roles that earn ACPE CE. This is the ONLY positive CE test —
 * "otro" is never persisted (InscripcionForm discards it into the specific
 * profession or free text), so we detect CE-eligibility by pharmacy role,
 * not by the absence of "otro". Fail-safe: unknown/null → false.
 */
export function isPharmacyRole(professionalType: string | null | undefined): boolean {
  return professionalType === "farmaceutico" || professionalType === "tecnico";
}
```

- [ ] **Step 4: Add `isCeEligible` to `certificates/index.ts`**

In `src/lib/certificates/index.ts`, add the import at the top (after the existing `curriculum` import on line 5) and the function near the other exported helpers (after `programForTier`, ~line 42):

```ts
import { isPharmacyRole } from "@/lib/professions";
```

```ts
/** True only for professional-tier pharmacists/techs — the only enrollees
 *  who earn ACPE CE. Fail-safe: null/unknown/free-text profession → false. */
export function isCeEligible(
  tier: UserTier,
  professionalType: string | null,
): boolean {
  return tier === "profesional" && isPharmacyRole(professionalType);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/ce-eligibility.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/professions.ts src/lib/certificates/index.ts tests/unit/ce-eligibility.test.ts
git commit -m "feat(cert): add CE eligibility predicate keyed on professional_type"
```

---

### Task 3: Third certificate program (`profesional-completion`)

**Files:**
- Modify: `src/lib/certificates/index.ts:38-50`
- Test: `tests/unit/certificate-program.test.ts:4-14`

**Interfaces:**
- Consumes: `isCeEligible` (Task 2).
- Produces: `CertProgram = "profesional" | "profesional-completion" | "student"`; `programFor(tier: UserTier, professionalType: string | null): CertProgram`; `certAwardsCeus(program: CertProgram): boolean`; `certPrefix(program, year)` now handles the third program. `programForTier(tier)` retained (returns `"profesional"` or `"student"`, never the completion program — only `programFor` can).

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/certificate-program.test.ts` inside the `describe("certPrefix", …)` block and add two new describes:

```ts
import { certPrefix, evaluateEligibility, programFor, certAwardsCeus } from "@/lib/certificates";

describe("programFor", () => {
  it("maps professional pharmacists/techs to the CE program", () => {
    expect(programFor("profesional", "farmaceutico")).toBe("profesional");
    expect(programFor("profesional", "tecnico")).toBe("profesional");
  });
  it("maps professional non-pharmacy to the completion program", () => {
    expect(programFor("profesional", "medico")).toBe("profesional-completion");
    expect(programFor("profesional", null)).toBe("profesional-completion");
  });
  it("maps the student tier to the student program", () => {
    expect(programFor("student", null)).toBe("student");
  });
});

describe("certAwardsCeus", () => {
  it("awards CEUs only for the CE professional program", () => {
    expect(certAwardsCeus("profesional")).toBe(true);
    expect(certAwardsCeus("profesional-completion")).toBe(false);
    expect(certAwardsCeus("student")).toBe(false);
  });
});

describe("certPrefix (completion)", () => {
  it("uses SCCA-COMP- for the professional completion program", () => {
    expect(certPrefix("profesional-completion", 2026)).toBe("SCCA-COMP-2026-");
  });
  it("keeps COMP disjoint from the CE prefix", () => {
    expect("SCCA-COMP-2026-001".startsWith("SCCA-2026-")).toBe(false);
    expect("SCCA-2026-001".startsWith("SCCA-COMP-2026-")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/certificate-program.test.ts`
Expected: FAIL — `programFor`/`certAwardsCeus` not exported; completion prefix wrong.

- [ ] **Step 3: Widen `CertProgram` and add the helpers**

In `src/lib/certificates/index.ts`, replace the `CertProgram` type + `programForTier` + `certPrefix` (lines 38-50) with:

```ts
export type CertProgram = "profesional" | "profesional-completion" | "student";

/** Legacy tier-only mapping (student vs professional). Kept for callers that
 *  have no professional_type; NEVER returns the completion program. Prefer
 *  `programFor` at any site that can read professional_type. */
export function programForTier(tier: UserTier): "profesional" | "student" {
  return tier === "student" ? "student" : "profesional";
}

/** Full program resolution. Professional-tier pharmacists/techs earn the CE
 *  program; every other professional gets the no-CE completion program. */
export function programFor(tier: UserTier, professionalType: string | null): CertProgram {
  if (tier === "student") return "student";
  return isCeEligible(tier, professionalType) ? "profesional" : "profesional-completion";
}

/** Only the CE professional program prints CEUs + the ACPE provider line. */
export function certAwardsCeus(program: CertProgram): boolean {
  return program === "profesional";
}

/** Human-friendly cert-number prefix per program. The three prefixes are
 *  deliberately disjoint so each `LIKE ${prefix}%` numbering query stays in
 *  its own sequence: SCCA- (CE), SCCA-EST- (student), SCCA-COMP- (completion). */
export function certPrefix(program: CertProgram, year: number): string {
  if (program === "student") return `SCCA-EST-${year}-`;
  if (program === "profesional-completion") return `SCCA-COMP-${year}-`;
  return `SCCA-${year}-`;
}
```

Note: `programFor` references `isCeEligible` (defined above it in Task 2). Ensure `isCeEligible` is declared before `programFor` or hoisted (function declarations hoist, so order is fine).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/certificate-program.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/certificates/index.ts tests/unit/certificate-program.test.ts
git commit -m "feat(cert): add profesional-completion program with SCCA-COMP prefix"
```

---

### Task 4: Renderer — no-CE completion variant

**Files:**
- Modify: `src/lib/certificates/render.ts:34-45, 63-73, 197-249, 297-423`
- Test: `tests/unit/cert-render.test.ts:14-28`

**Interfaces:**
- Consumes: `CertProgram` (Task 3).
- Produces: `renderCertificatePdf(input)` where `CertRenderInput.program: CertProgram`; three-way audience/credit/ACPE selection with `awardsCeus = program === "profesional"`.

- [ ] **Step 1: Write the failing test**

Replace the loop header in `tests/unit/cert-render.test.ts` line 15 to include the third program and give it a COMP cert number:

```ts
  for (const program of ["profesional", "profesional-completion", "student"] as const) {
    it(`produces a valid PDF for the ${program} program`, async () => {
      const certNo =
        program === "student"
          ? "SCCA-EST-2026-001"
          : program === "profesional-completion"
            ? "SCCA-COMP-2026-001"
            : "SCCA-2026-001";
      const bytes = await renderCertificatePdf({
        certNo,
        studentName: "Kiara Rivera Santiago",
        issuedAt: new Date("2026-06-24T00:00:00Z"),
        verificationUrl: "https://sccompoundingacademy.com/verificar/X",
        program,
      });
      expect(bytes.length).toBeGreaterThan(1000);
      expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    });
  }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/cert-render.test.ts`
Expected: FAIL — type error: `"profesional-completion"` not assignable to `program` (union is still 2-value in render.ts).

- [ ] **Step 3: Widen the render input type and derive `awardsCeus` from the CE program only**

In `src/lib/certificates/render.ts`:

Line 44 — change the `program` field type:

```ts
  program: "profesional" | "profesional-completion" | "student";
```

Line 73 (in `renderCertificatePdf`) and line 306 (in `drawPlaceholderBody`) — change the derivation so completion does NOT award CEUs:

```ts
  const awardsCeus = input.program === "profesional";
```

- [ ] **Step 4: Make the overlay text 3-way (template path, English)**

In `drawOverlay`, replace the audience subtitle block (lines 216-227) and keep credit/ACPE gated on `awardsCeus`:

```ts
  drawCentered(
    page,
    input.program === "student"
      ? "Student Track — Foundations of Nonsterile Compounding"
      : awardsCeus
        ? "for Pharmacists & Pharmacy Technicians"
        : "Professional Program",
    { y: 237, size: 10, font: helvetica, color: COLOR.gray900 },
  );
```

Replace the credit line (lines 228-241) so completion shows hours without CEUs:

```ts
  drawCentered(
    page,
    input.program === "student"
      ? "Certificate of Completion · USP <795> & <800>"
      : awardsCeus
        ? "18 contact hours · 1.8 CEUs · Knowledge-based, Level 1"
        : "18 contact hours · Certificate of Completion",
    { y: 221, size: 10, font: helvetica, color: COLOR.gray900 },
  );
```

Change the ACPE provider gate (line 242) from `if (input.program !== "student")` to:

```ts
  if (awardsCeus) {
    drawCentered(page, "ACPE Provider 0151 — Puerto Rico College of Pharmacists", {
      y: 205, size: 9, font: helvetica, color: COLOR.gray700,
    });
  }
```

- [ ] **Step 5: Make the placeholder body 3-way (Spanish)**

In `drawPlaceholderBody`, replace the course-audience line (lines 386-397):

```ts
  drawCentered(
    page,
    input.program === "student"
      ? "Compounding No Estéril — Programa de Estudiantes"
      : awardsCeus
        ? "Basic Compounding No Estéril para Farmacéuticos y Técnicos de Farmacia"
        : "Basic Compounding No Estéril — Programa Profesional",
    { y: PAGE_H - 360, size: 13, font: helveticaBold, color: COLOR.tealDeep },
  );
```

Replace the credit line (lines 398-411):

```ts
  drawCentered(
    page,
    input.program === "student"
      ? "Certificado de Finalización · USP <795> y <800>"
      : awardsCeus
        ? "18 horas de contacto · 1.8 CEUs · Knowledge-based, Level 1"
        : "18 horas de contacto · Certificado de Finalización",
    { y: PAGE_H - 384, size: 10, font: helvetica, color: COLOR.gray900 },
  );
```

Change the ACPE gate (line 412) from `if (input.program !== "student")` to `if (awardsCeus)`.

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/cert-render.test.ts`
Expected: PASS (3 cases).

- [ ] **Step 7: Manually render the completion cert and eyeball it**

Run this one-off in the repo (node, no template asset needed — exercises the placeholder path):

```bash
pnpm vitest run tests/unit/cert-render.test.ts --reporter=verbose
```

Expected: all three "produces a valid PDF" cases green. (Full visual QA of the PDF is Task 14.)

- [ ] **Step 8: Commit**

```bash
git add src/lib/certificates/render.ts tests/unit/cert-render.test.ts
git commit -m "feat(cert): render no-CE completion variant for profesional-completion"
```

---

### Task 5: Issuance route reads professional_type

**Files:**
- Modify: `src/app/api/certificate/route.ts:6-10, 70-95, 115-126`

**Interfaces:**
- Consumes: `programFor` (Task 3), `isCeEligible` (Task 2), full `users` row (already selected at line 46).
- Produces: certs minted/rendered with `programFor(effectiveTier, user.professionalType)`.

- [ ] **Step 1: Swap the import**

In `src/app/api/certificate/route.ts` lines 6-10, replace `programForTier` with `programFor`:

```ts
import {
  getOrCreateCertificate,
  isEligibleForCertificate,
  programFor,
} from "@/lib/certificates";
```

- [ ] **Step 2: Compute the program from tier + professional_type**

Replace line 76 (`const program = programForTier(effectiveTier);`) with owner-preview awareness. Replace lines 70-76 with:

```ts
  const preview = new URL(req.url).searchParams.get("preview");
  const effectiveTier = resolveEffectiveTier({
    isOwner,
    userTier: user.tier,
    preview,
  });
  // Owner may force the no-CE completion variant via ?preview=completion so the
  // design can be QA'd without a real "otro" enrollee. Real users always get
  // programFor(their tier, their professional_type).
  const program =
    isOwner && preview === "completion"
      ? "profesional-completion"
      : programFor(effectiveTier, user.professionalType);
```

The two `renderCertificatePdf({ … program })` calls (lines 80-86 and 120-126) and `getOrCreateCertificate(user.id, program)` (line 115) already pass `program` — no further change.

- [ ] **Step 3: Typecheck + run the route's neighbors**

Run: `pnpm vitest run tests/unit/certificate-program.test.ts tests/unit/cert-render.test.ts && pnpm lint`
Expected: PASS, no type errors on the route.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/certificate/route.ts
git commit -m "feat(cert): issue program by professional_type in certificate route"
```

---

### Task 6: Portal ACPE disclosure + cert preview become CE-aware

**Files:**
- Modify: `src/lib/curriculum.ts:63-67`
- Modify: `src/app/[locale]/(portal)/portal/page.tsx:193`
- Modify: `src/app/[locale]/(portal)/portal/certificado/page.tsx:105-116, 139`
- Test: `tests/unit/curriculum.test.ts:59-65`

**Interfaces:**
- Consumes: `isCeEligible` (Task 2) — but to avoid an import cycle (`certificates` imports `curriculum`), curriculum uses `isPharmacyRole` from `professions.ts` directly.
- Produces: `showAcpeDisclosure(tier: UserTier, professionalType: string | null): boolean`.

- [ ] **Step 1: Update the failing test**

Replace the `showAcpeDisclosure` describe in `tests/unit/curriculum.test.ts` (lines 59-65):

```ts
describe("showAcpeDisclosure", () => {
  it("shows only for professional-tier pharmacists/techs", () => {
    expect(showAcpeDisclosure("profesional", "farmaceutico")).toBe(true);
    expect(showAcpeDisclosure("profesional", "tecnico")).toBe(true);
  });
  it("is hidden for students and non-pharmacy professionals", () => {
    expect(showAcpeDisclosure("student", null)).toBe(false);
    expect(showAcpeDisclosure("profesional", "medico")).toBe(false);
    expect(showAcpeDisclosure("profesional", null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/curriculum.test.ts`
Expected: FAIL — `showAcpeDisclosure` takes one arg.

- [ ] **Step 3: Update `showAcpeDisclosure`**

In `src/lib/curriculum.ts`, add the import near the top (after line 17's import):

```ts
import { isPharmacyRole } from "@/lib/professions";
```

Replace lines 63-67:

```ts
/** ACPE Standard 3 disclosure applies only to CE-bearing enrollees:
 *  professional-tier pharmacists/techs. Students and non-pharmacy
 *  professionals (no CE) omit the block. */
export function showAcpeDisclosure(
  tier: UserTier,
  professionalType: string | null,
): boolean {
  return tier === "profesional" && isPharmacyRole(professionalType);
}
```

- [ ] **Step 4: Update the dashboard caller**

In `src/app/[locale]/(portal)/portal/page.tsx` line 193, pass the user's professional_type. The page already loads the user row; use its `professionalType` (confirm the variable name in scope — the user row is loaded above; reference `user.professionalType`). Change:

```tsx
{showAcpeDisclosure(effectiveTier, user.professionalType) && <AcpeDisclosure locale={locale} />}
```

- [ ] **Step 5: Gate the cert-preview CEU line**

In `src/app/[locale]/(portal)/portal/certificado/page.tsx`, the preview card hard-shows "1.8 CEUs" (`CERT_MOCK` ~105-116, selected ~139). Import the predicate and gate the CEU/ACPE text on it. Add near the top imports:

```tsx
import { isCeEligible } from "@/lib/certificates";
```

Where the preview picks the professional mock (line ~139, `tier === "student" ? student : profesional`), compute and use CE eligibility for the CEU/ACPE line. Replace the selection with:

```tsx
const ceEligible = isCeEligible(effectiveTier, user.professionalType);
const mock = effectiveTier === "student" || !ceEligible ? CERT_MOCK.completion : CERT_MOCK.ce;
```

And in `CERT_MOCK` (105-116) split the professional mock into `ce` (with "1.8 CEUs · ACPE 0151") and `completion` (no CEUs, "Certificado de finalización") variants, plus the existing student variant. (Keep the student copy unchanged; `completion` reuses the no-CE wording.)

- [ ] **Step 6: Run tests + lint**

Run: `pnpm vitest run tests/unit/curriculum.test.ts && pnpm lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/curriculum.ts "src/app/[locale]/(portal)/portal/page.tsx" "src/app/[locale]/(portal)/portal/certificado/page.tsx" tests/unit/curriculum.test.ts
git commit -m "feat(portal): ACPE disclosure + cert preview gated on CE eligibility"
```

---

### Task 7: Certificate-ready email drops CE copy for completion

**Files:**
- Modify: `src/lib/emails/certificado.ts:14-22, 39-48, 56-71`
- Modify: `src/lib/portal/notify-certificate-ready.ts:7, 33-39, 44, 62`
- Modify: `src/app/[locale]/(portal)/portal/modulos/[id]/post-test/actions.ts:95-101`
- Test: `tests/unit/email-templates.test.ts`

**Interfaces:**
- Consumes: `CertProgram`, `programFor`, `certAwardsCeus` (Task 3); full `user` row in the post-test action (`user.professionalType`).
- Produces: `buildCertificateReadyEmail({ …, program: CertProgram })` with CE copy only when `certAwardsCeus(program)`; `notifyCertificateReadyIfEligible({ …, professionalType: string | null })`.

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/email-templates.test.ts`:

```ts
import { buildCertificateReadyEmail } from "@/lib/emails/certificado";

describe("buildCertificateReadyEmail CE gating", () => {
  const base = { nombre: "Ana", locale: "es" as const, certUrl: "https://x/y" };
  it("includes CEUs for the CE professional program", () => {
    const m = buildCertificateReadyEmail({ ...base, program: "profesional" });
    expect(m.html).toContain("CEUs");
  });
  it("omits CE copy for the completion program", () => {
    const m = buildCertificateReadyEmail({ ...base, program: "profesional-completion" });
    expect(m.html).not.toContain("CEUs");
    expect(m.html).not.toContain("ACPE");
    expect(m.html).not.toContain("documentación de horas CE");
    expect(m.text).not.toContain("CEUs");
  });
  it("omits CE copy for students", () => {
    const m = buildCertificateReadyEmail({ ...base, program: "student" });
    expect(m.html).not.toContain("CEUs");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/email-templates.test.ts`
Expected: FAIL — type: `"profesional-completion"` not assignable; and completion currently emits CE badge/body.

- [ ] **Step 3: Widen the email program type and gate CE copy**

In `src/lib/emails/certificado.ts` line 14:

```ts
type CertProgram = "profesional" | "profesional-completion" | "student";
```

Add after line 30 (`const first = …`):

```ts
  const awardsCeus = p.program === "profesional";
```

Replace the HTML body line (39-41):

```ts
  const bodyText = es
    ? `Completaste el curso <strong>Basic Non-Sterile Compounding</strong> satisfactoriamente. Tu certificado SCCA${awardsCeus ? " y la documentación de horas CE están listos" : " está listo"} para descargar.`
    : `You successfully completed <strong>Basic Non-Sterile Compounding</strong>. Your SCCA certificate${awardsCeus ? " and CE hour documentation are ready" : " is ready"} to download.`;
```

Replace the badge subline (43-48):

```ts
  const badgeSub = awardsCeus
    ? "ACPE 0151 · 1.8 CEUs"
    : es
      ? "Certificado de finalización"
      : "Certificate of completion";
```

(Avoid the substring "CE" in the completion badge — "sin CE" would defeat a
`not.toContain("CEUs")`-style guard and reads awkwardly; the badge simply says
"completion".)

Replace the plain-text body (58-60) to mirror the gated HTML:

```ts
${(es
    ? `Completaste el curso Basic Non-Sterile Compounding satisfactoriamente. Tu certificado SCCA${awardsCeus ? " y la documentación de horas CE están listos" : " está listo"} para descargar.`
    : `You successfully completed Basic Non-Sterile Compounding. Your SCCA certificate${awardsCeus ? " and CE hour documentation are ready" : " is ready"} to download.`)}
```

- [ ] **Step 4: Thread professional_type into the notifier**

In `src/lib/portal/notify-certificate-ready.ts`:

Line 7 — swap import:

```ts
import { isEligibleForCertificate, programFor } from "@/lib/certificates";
```

Lines 33-39 — add `professionalType` to the params:

```ts
export async function notifyCertificateReadyIfEligible(p: {
  userId: string;
  name: string | null;
  email: string | null;
  tier: UserTier;
  professionalType: string | null;
  locale: "es" | "en";
}): Promise<void> {
```

Line 62 — resolve the full program:

```ts
        program: programFor(p.tier, p.professionalType),
```

- [ ] **Step 5: Pass professional_type from the post-test action**

In `src/app/[locale]/(portal)/portal/modulos/[id]/post-test/actions.ts` lines 95-101, add the field (the full `user` row is loaded at line 50):

```ts
    await notifyCertificateReadyIfEligible({
      userId: user.id,
      name: user.name,
      email: user.email,
      tier: user.tier,
      professionalType: user.professionalType,
      locale: locale === "en" ? "en" : "es",
    });
```

- [ ] **Step 6: Run tests + lint**

Run: `pnpm vitest run tests/unit/email-templates.test.ts && pnpm lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/emails/certificado.ts src/lib/portal/notify-certificate-ready.ts "src/app/[locale]/(portal)/portal/modulos/[id]/post-test/actions.ts" tests/unit/email-templates.test.ts
git commit -m "feat(email): drop CE copy from certificate-ready email for completion program"
```

---

### Task 8: Public verify page shows no CE for completion certs

**Files:**
- Modify: `src/app/verificar/[certNo]/page.tsx:87-119, 190-194`
- Modify: `src/messages/es.json`, `src/messages/en.json` (`verificar` block)

**Interfaces:**
- Consumes: cert-number prefix `SCCA-COMP-` (Task 3).
- Produces: 3-way `program: "profesional" | "profesional-completion" | "student"` from prefix; no CE/ACPE language for completion.

- [ ] **Step 1: Make prefix inference 3-way**

In `src/app/verificar/[certNo]/page.tsx`, replace line 89:

```tsx
  const program: "profesional" | "profesional-completion" | "student" =
    certNo.startsWith("SCCA-EST-")
      ? "student"
      : certNo.startsWith("SCCA-COMP-")
        ? "profesional-completion"
        : "profesional";
```

Widen the `VerifyPanel` prop type (line 116):

```tsx
  program: "profesional" | "profesional-completion" | "student";
```

- [ ] **Step 2: Pick copy per program**

Replace the course title/subtitle lookup (lines 190, 193). Add a small map above the `return` in `VerifyPanel`:

```tsx
  const titleKey =
    program === "student" ? "courseTitleStudent" : "courseTitle";
  const subtitleKey =
    program === "student"
      ? "courseSubtitleStudent"
      : program === "profesional-completion"
        ? "courseSubtitleCompletion"
        : "courseSubtitle";
```

Change lines 190 and 193 to use `t(titleKey)` and `t(subtitleKey)`. (Completion reuses the professional course title but a no-CE subtitle.)

- [ ] **Step 3: Add the i18n key (es + en)**

In `src/messages/es.json` under `verificar`, add alongside `courseSubtitle`:

```json
"courseSubtitleCompletion": "Certificado de finalización · 18 horas de contacto · sin créditos CE de ACPE",
```

In `src/messages/en.json` under `verificar`:

```json
"courseSubtitleCompletion": "Certificate of completion · 18 contact hours · no ACPE CE credit",
```

- [ ] **Step 4: Verify JSON parses + lint**

Run: `pnpm vitest run tests/unit/i18n-consistency.test.ts 2>/dev/null; node -e "JSON.parse(require('fs').readFileSync('src/messages/es.json'));JSON.parse(require('fs').readFileSync('src/messages/en.json'));console.log('json ok')" && pnpm lint`
Expected: `json ok`, lint clean. (If an i18n parity test exists it must stay green; if not, the node parse is the guard.)

- [ ] **Step 5: Commit**

```bash
git add "src/app/verificar/[certNo]/page.tsx" src/messages/es.json src/messages/en.json
git commit -m "feat(verify): no-CE copy for SCCA-COMP completion certificates"
```

---

### Task 9: Hide prices on the homepage cards

**Files:**
- Modify: `src/components/marketing/CursosHome.tsx:7, 45-51, 62-64, 72-74, 82-100, 151-176`
- Test: `tests/components/CursosHome.test.tsx` (create)

**Interfaces:**
- Produces: `CursosHome` renders no dollar amount; keeps CTA and the includes footnote.

- [ ] **Step 1: Write the failing test**

Create `tests/components/CursosHome.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { CursosHome } from "@/components/marketing/CursosHome";

describe("CursosHome", () => {
  it("renders no dollar price on the marketing cards", () => {
    const { container } = render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <CursosHome />
      </NextIntlClientProvider>,
    );
    expect(container.textContent).not.toMatch(/\$\s?\d/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/components/CursosHome.test.tsx`
Expected: FAIL — the cards currently render "$2,395"/"$495".

- [ ] **Step 3: Remove price plumbing**

In `src/components/marketing/CursosHome.tsx`:

Line 7 — drop the price imports:

```ts
import { type Tier } from "@/lib/courses";
```

Delete lines 45-51 (the `base`/`proCents`/`studentCents` block). Remove the `price` and `perLabel` props from both `<CourseCard>` usages (lines 62-64 and 72-74) — keep `priceNote`. Remove `price`, `perLabel` from the `CourseCard` prop type (lines 82-100).

Replace the price block (lines 151-176) so only the includes footnote remains:

```tsx
      <div
        className={cn(
          "mt-auto flex flex-wrap items-end justify-between gap-4 border-t pt-5",
          dark ? "border-white/10" : "border-gray-300",
        )}
      >
        <p className={cn("text-[11.5px]", dark ? "text-off-white/55" : "text-gray-700")}>
          {priceNote}
        </p>
        <Link
          href={{
            pathname: "/inscripcion",
            query: {
              course: course.enrollCourseId ?? course.id,
              ...(course.enrollTier ? { tier: course.enrollTier } : {}),
            },
          }}
          aria-label={`${enrollAria}: ${course.title}`}
        >
          <Button variant={dark ? "primary" : "secondary"} size="md">
            {enrollCta}
          </Button>
        </Link>
      </div>
```

(`priceNote` prop stays; the `Type` import stays because `enrollTier` is typed `Tier`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/components/CursosHome.test.tsx && pnpm lint`
Expected: PASS, lint clean (no unused imports).

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/CursosHome.tsx tests/components/CursosHome.test.tsx
git commit -m "feat(marketing): hide prices on homepage course cards"
```

---

### Task 10: i18n third item + CursosGrid third card

**Files:**
- Modify: `src/messages/es.json`, `src/messages/en.json` (`cursosGrid` block)
- Modify: `src/components/marketing/CursosGrid.tsx:22-34, 100-104, 190, 234-241`
- Test: `tests/components/CursosGrid.test.tsx` (create or extend)

**Interfaces:**
- Consumes: item fields `courseRef`, `enrollProf`, `noCe`.
- Produces: an "Otros Profesionales" catalogue card that resolves cohort/USP from `basic-compounding`, shows the completion note (no ACPE block), and enrolls with `tier=profesional&prof=otro`.

- [ ] **Step 1: Add the i18n item (es + en)**

In `src/messages/es.json`, append a third entry to `cursosGrid.items` (after `student-foundations`), and relabel `basic-compounding`'s title to the pharmacist/tech framing. New entry:

```json
{
  "id": "otros-profesionales",
  "level": "Fundamentos",
  "uspLabel": "USP 〈795〉 + 〈800〉",
  "title": "Otros Profesionales",
  "description": "El mismo curso presencial de 18 horas (USP 〈795〉 y 〈800〉) para otros profesionales licenciados no farmacéuticos. Misma formación y práctica supervisada; certificado de finalización sin créditos CE de ACPE.",
  "duration": "18 h · 3 días",
  "courseRef": "basic-compounding",
  "noCe": true,
  "modules": [
    { "id": "modulo-1", "day": "Día 1 · 6 hrs", "title": "Fundamentos regulatorios y cápsulas", "summary": "USP 〈795〉 y 〈800〉, NIOSH, PPE, Ley de Farmacia de PR, DQSA; cálculo de BUD y laboratorio de cápsulas." },
    { "id": "modulo-2", "day": "Día 2 · 6 hrs", "title": "Supositorios, líquidos orales y dermatología", "summary": "Formulación de supositorios, suspensiones orales, condiciones tópicas y preparaciones para manejo del dolor." },
    { "id": "modulo-3", "day": "Día 3 · 6 hrs", "title": "Hormonales tópicos, veterinaria y regulación", "summary": "BHRT, Topi-Click, penetration enhancers, 503A/503B y compounding veterinario." }
  ],
  "credentialNote": "Certificado de finalización — sin créditos CE de ACPE. El crédito CE está reservado a farmacéuticos y técnicos de farmacia licenciados.",
  "enrollCourseId": "basic-compounding",
  "enrollTier": "profesional",
  "enrollProf": "otro"
}
```

Mirror in `src/messages/en.json` with English strings (title "Other Professionals", analogous description/modules/credentialNote, same non-string fields `courseRef`/`noCe`/`enrollCourseId`/`enrollTier`/`enrollProf`).

Also add homepage highlight arrays next to `professionalHighlights`/`studentHighlights` in BOTH files:

```json
"otrosProfesionalesHighlights": [
  "18 horas de contacto · 3 días · 6 hrs/día",
  "Mismo currículo USP 〈795〉 + 〈800〉 que el track profesional",
  "Certificado de finalización — sin crédito CE de ACPE",
  "Cohortes pequeñas · materiales y almuerzo incluidos",
  "Práctica supervisada en laboratorio"
]
```

- [ ] **Step 2: Write the failing test**

Create `tests/components/CursosGrid.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { CursosGrid } from "@/components/marketing/CursosGrid";

describe("CursosGrid", () => {
  it("renders the Otros Profesionales card with a completion (no-CE) note and no ACPE block", () => {
    const { getByText, container } = render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <CursosGrid openCohorts={[]} />
      </NextIntlClientProvider>,
    );
    expect(getByText("Otros Profesionales")).toBeTruthy();
    expect(container.textContent).toContain("sin créditos CE de ACPE");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run tests/components/CursosGrid.test.tsx`
Expected: FAIL — `courseRef`/`enrollProf`/`noCe` not on the type; ACPE block shows for the ref'd course.

- [ ] **Step 4: Extend CursosGrid**

In `src/components/marketing/CursosGrid.tsx`:

Extend `CourseItem` (lines 22-34) with:

```ts
  courseRef?: string;
  enrollProf?: string;
  noCe?: boolean;
```

Line 101 — resolve facts through `courseRef`:

```ts
            const courseData = getCourseById(course.courseRef ?? course.id);
```

Line 102 — cohort through `courseRef`:

```ts
            const cohortMonth = nextCohortLabel(course.courseRef ?? course.id);
```

The ACPE block gate (line 190) — suppress it for `noCe` items so the completion note shows instead:

```tsx
                  {courseData?.acpe && !course.noCe && (
```

The credential-note branch (line 206) currently requires `!courseData?.acpe`. Change it so a `noCe` item always shows its note:

```tsx
                  {(course.noCe || !courseData?.acpe) && course.credentialNote && (
```

Enroll `Link` query (lines 237-240) — add `prof`:

```tsx
            query: {
              course: course.enrollCourseId ?? course.id,
              ...(course.enrollTier ? { tier: course.enrollTier } : {}),
              ...(course.enrollProf ? { prof: course.enrollProf } : {}),
            },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run tests/components/CursosGrid.test.tsx && pnpm lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/messages/es.json src/messages/en.json src/components/marketing/CursosGrid.tsx tests/components/CursosGrid.test.tsx
git commit -m "feat(marketing): add Otros Profesionales card to /cursos catalogue"
```

---

### Task 11: Homepage third card

**Files:**
- Modify: `src/components/marketing/CursosHome.tsx:33-43, 52-76, 177-190`
- Test: `tests/components/CursosHome.test.tsx` (extend Task 9 file)

**Interfaces:**
- Consumes: i18n `otros-profesionales` item + `otrosProfesionalesHighlights` (Task 10); `enrollProf` routing.
- Produces: three homepage cards, `md:grid-cols-3`.

- [ ] **Step 1: Extend the test**

Add to `tests/components/CursosHome.test.tsx`:

```tsx
  it("renders three tracks incl. Otros Profesionales", () => {
    const { getByText } = render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <CursosHome />
      </NextIntlClientProvider>,
    );
    expect(getByText("Otros Profesionales")).toBeTruthy();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/components/CursosHome.test.tsx`
Expected: FAIL — only two cards render.

- [ ] **Step 3: Add the third card**

In `src/components/marketing/CursosHome.tsx`:

Destructure the new highlights (line 40):

```ts
  const { items, professionalHighlights, studentHighlights, otrosProfesionalesHighlights } =
    messages.cursosGrid as typeof messages.cursosGrid & { otrosProfesionalesHighlights: string[] };
```

Add the message-type field (lines 33-39) `otrosProfesionalesHighlights: string[];` to the inline type.

Select the third item (after line 42):

```ts
  const otros = items.find((c) => c.id === "otros-profesionales");
```

Guard (line 43) — keep rendering even if `otros` is missing is fine, but require pro+student:

```ts
  if (!professional || !student) return null;
```

Change the grid (line 55) `md:grid-cols-2` → `md:grid-cols-3`, and insert the third `<CourseCard>` between the professional and student cards (light tone):

```tsx
          {otros && (
            <CourseCard
              tone="light"
              course={otros}
              highlights={otrosProfesionalesHighlights}
              enrollCta={t("courseCta")}
              enrollAria={t("courseLinkAria")}
              priceNote={t("priceNoteStudent")}
            />
          )}
```

(Reuse `priceNoteStudent` — a portal/completion-style note — or add a dedicated `priceNoteOtros` key in Task 10 if the owner wants distinct copy. Reuse is fine; it's a benefits line, not a price.)

Thread `enrollProf` into the card enroll `Link` (Task 9's edited block, lines ~177-190):

```tsx
            query: {
              course: course.enrollCourseId ?? course.id,
              ...(course.enrollTier ? { tier: course.enrollTier } : {}),
              ...(course.enrollProf ? { prof: course.enrollProf } : {}),
            },
```

Add `enrollProf?: string;` to the `CourseItem` type (lines 9-15).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/components/CursosHome.test.tsx && pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/CursosHome.tsx tests/components/CursosHome.test.tsx
git commit -m "feat(marketing): add Otros Profesionales card to homepage (3-up)"
```

---

### Task 12: Enroll form preselects profession from `?prof=`

**Files:**
- Modify: `src/app/[locale]/(marketing)/inscripcion/page.tsx:31-60, 62-108`
- Modify: `src/components/marketing/inscripcion/InscripcionForm.tsx:27-39, 90-96`
- Test: `tests/components/InscripcionForm.test.tsx` (create or extend)

**Interfaces:**
- Consumes: `?prof=` query param.
- Produces: `InscripcionForm` prop `preselectedProf?: "farmaceutico" | "tecnico" | "otro"`; when tier is professional, initializes `tipoProfesional` from it.

- [ ] **Step 1: Write the failing test**

Create `tests/components/InscripcionForm.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { InscripcionForm } from "@/components/marketing/inscripcion/InscripcionForm";

const cohorts = [{ id: "c1", courseId: "basic-compounding", label: "Cohorte" }];

describe("InscripcionForm preselectedProf", () => {
  it("opens the Otro profession branch when prof=otro", () => {
    const { getByText } = render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <InscripcionForm
          locale="es"
          preselectedTier="profesional"
          preselectedProf="otro"
          cohorts={cohorts}
          docsVersion="2026-01-01"
        />
      </NextIntlClientProvider>,
    );
    // The "otro" branch reveals the otraProfesion select label.
    expect(getByText(esMessages.inscripcion.fields.otraProfesion)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/components/InscripcionForm.test.tsx`
Expected: FAIL — `preselectedProf` prop does not exist.

- [ ] **Step 3: Add the prop and initialize state**

In `src/components/marketing/inscripcion/InscripcionForm.tsx`, add to `Props` (after line 32's `preselectedTier`):

```ts
  /** Profession pre-selected via ?prof= (profesional tier only). */
  preselectedProf?: "farmaceutico" | "tecnico" | "otro";
```

Add `preselectedProf` to the destructured params (line 52-58 block). Change the `tipoProfesional` initializer (lines 90-92):

```ts
  const [tipoProfesional, setTipoProfesional] = useState<
    "farmaceutico" | "tecnico" | "otro" | ""
  >(
    preselectedTier === "profesional" &&
      (preselectedProf === "farmaceutico" ||
        preselectedProf === "tecnico" ||
        preselectedProf === "otro")
      ? preselectedProf
      : "",
  );
```

- [ ] **Step 4: Thread the param through the page**

In `src/app/[locale]/(marketing)/inscripcion/page.tsx`:

Line 36 — add `prof`:

```ts
  searchParams: Promise<{ course?: string; tier?: string; prof?: string }>;
```

Line 39 — destructure it:

```ts
  const { course, tier, prof } = await searchParams;
```

Lines 52-59 — pass `preselectedProf`:

```tsx
    <InscripcionPage
      locale={loc}
      preselectedCourseSlug={course}
      preselectedTier={tier === "student" || tier === "profesional" ? tier : undefined}
      preselectedProf={prof === "farmaceutico" || prof === "tecnico" || prof === "otro" ? prof : undefined}
      cohorts={cohorts}
    />
```

Add `preselectedProf` to the `InscripcionPage` prop type (lines 62-72) and forward it to `<InscripcionForm>` (lines 97-103):

```tsx
  preselectedProf?: "farmaceutico" | "tecnico" | "otro";
```

```tsx
          <InscripcionForm
            locale={locale}
            preselectedCourseId={preselectedCourseSlug}
            preselectedTier={preselectedTier}
            preselectedProf={preselectedProf}
            cohorts={cohorts}
            docsVersion={docsVersion}
          />
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run tests/components/InscripcionForm.test.tsx && pnpm lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(marketing)/inscripcion/page.tsx" src/components/marketing/inscripcion/InscripcionForm.tsx tests/components/InscripcionForm.test.tsx
git commit -m "feat(enroll): preselect profession from ?prof= for Otros Profesionales"
```

---

### Task 13: Require profession for the professional tier (CE correctness)

**Files:**
- Create: `src/lib/inscripcion/schema.ts` (extract the Zod schema out of the route)
- Modify: `src/app/api/inscripcion/route.ts:37-58` (import the extracted schema; drop the inline one)
- Modify: `src/components/marketing/inscripcion/InscripcionForm.tsx:120-130` (client guard)
- Test: `tests/unit/inscripcion-profession-required.test.ts` (create)

**Interfaces:**
- Consumes: request body `{ tier, tipo_profesional }`.
- Produces: `inscripcionSchema` (a pure Zod schema module, no server-only imports); server rejects `tier==='profesional'` with empty `tipo_profesional`.

Why extract: importing the schema from the route into a test would pull in the
route's server-only deps (`db`, `stripe`) at module load and can crash the test
env. A standalone `schema.ts` (only `zod`) is cleanly importable.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/inscripcion-profession-required.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { inscripcionSchema } from "@/lib/inscripcion/schema";

const base = {
  nombre: "Ana Ruiz",
  email: "ana@example.com",
  telefono: "7871234567",
  curso_id: "basic-compounding",
  cohorte_id: "c1",
  acepto_terminos: true as const,
  acepto_version_docs: "2026-01-01",
  locale: "es" as const,
};

describe("inscripcion profession requirement", () => {
  it("rejects a professional enrollment with no profession", () => {
    const r = inscripcionSchema.safeParse({ ...base, tier: "profesional", tipo_profesional: "" });
    expect(r.success).toBe(false);
  });
  it("accepts a professional enrollment with a profession", () => {
    const r = inscripcionSchema.safeParse({ ...base, tier: "profesional", tipo_profesional: "farmaceutico" });
    expect(r.success).toBe(true);
  });
  it("accepts a student enrollment with no profession", () => {
    const r = inscripcionSchema.safeParse({ ...base, tier: "student", tipo_profesional: "" });
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/inscripcion-profession-required.test.ts`
Expected: FAIL — schema not exported and/or professional+empty currently passes.

- [ ] **Step 3: Extract the schema into its own module + add the refine**

Create `src/lib/inscripcion/schema.ts` by moving the `z.object({ … })` body currently in the route (lines ~37-58) verbatim, then appending the refine:

```ts
import { z } from "zod";

export const inscripcionSchema = z
  .object({
    // …paste the existing field definitions from route.ts lines 38-58 verbatim…
    // nombre / email / telefono / licencia / curso_id / cohorte_id / tier /
    // matricula_doc_url / tipo_profesional / notas / acepto_terminos /
    // acepto_version_docs / locale / (turnstile token, etc.)
  })
  .superRefine((data, ctx) => {
    if (data.tier === "profesional" && !(data.tipo_profesional ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tipo_profesional"],
        message: "Selecciona tu profesión para la inscripción profesional.",
      });
    }
  });

export type InscripcionInput = z.infer<typeof inscripcionSchema>;
```

In `src/app/api/inscripcion/route.ts`, delete the inline schema and import it:

```ts
import { inscripcionSchema } from "@/lib/inscripcion/schema";
```

Update the parse call in the handler to use `inscripcionSchema` (replace the old local `schema` reference).

- [ ] **Step 4: Add the client guard**

In `src/components/marketing/inscripcion/InscripcionForm.tsx` `onSubmit` (after the student matrícula check, ~line 126-129), add:

```ts
    if (tier === "profesional" && !profesion.trim()) {
      setError(t("errors.professionRequired"));
      return;
    }
```

Add the i18n key `inscripcion.errors.professionRequired` to `src/messages/es.json` ("Selecciona tu profesión para continuar.") and `en.json` ("Select your profession to continue."). If `inscripcion.errors` doesn't exist, create it.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/inscripcion-profession-required.test.ts && pnpm lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/inscripcion/schema.ts src/app/api/inscripcion/route.ts src/components/marketing/inscripcion/InscripcionForm.tsx src/messages/es.json src/messages/en.json tests/unit/inscripcion-profession-required.test.ts
git commit -m "feat(enroll): require profession for the professional tier (CE correctness)"
```

---

### Task 14: Full verification + manual QA

**Files:** none (verification).

- [ ] **Step 1: Full test suite**

Run: `pnpm vitest run`
Expected: all green. Pay attention to `student-checkout`, `pagar-route`, `inscripcion-student-branch`, `webhook-stripe-route` — the price invariant ($2,395 professional) must hold for "otro".

- [ ] **Step 2: Lint + typecheck**

Run: `pnpm lint`
Expected: clean. Then `pnpm exec tsc --noEmit` (or the repo's typecheck script) — expected: no errors.

- [ ] **Step 3: Drive the real flows (dev server)**

Start: `pnpm dev`

Verify by hand (or via the `verify`/`run` skill):
1. Homepage `/es` — three cards, **no `$` anywhere**, CTAs present.
2. `/es/cursos` — three catalogue cards; "Otros Profesionales" shows the completion note and **no ACPE CE block**.
3. Click "Otros Profesionales" CTA → lands on `/es/inscripcion?...tier=profesional&prof=otro`, professional tier selected, "Otro" profession branch open.
4. Enroll form: professional tier with no profession selected → blocked with the profession-required message.

- [ ] **Step 4: Render each certificate variant and eyeball the PDF**

With the dev server signed in as an owner (ADMIN_EMAILS), download:
- `/api/certificate` (owner default) — professional CE cert shows "1.8 CEUs" + ACPE line.
- `/api/certificate?preview=completion` — completion cert shows **no CEUs, no ACPE line**, neutral "Programa Profesional" audience.
- `/api/certificate?preview=student` — student completion cert unchanged.

Confirm each PDF opens and the CE/no-CE text matches expectation.

- [ ] **Step 5: Confirm the Task 1 audit is recorded**

Verify the PR description carries the Task 1 audit result (and any backfill). Do not deploy Parts C (cert) until it reads clean.

- [ ] **Step 6: Final commit (if any QA fixes) + push branch**

```bash
git push -u origin feat/hide-prices-otros-profesionales-track
```

---

## Notes for the implementer

- The three-way `program` union appears in five files (`certificates/index.ts`, `render.ts`, `emails/certificado.ts`, `verificar/[certNo]/page.tsx`, and — as `isCeEligible` — `curriculum.ts`/portal). Keep the string literals byte-identical: `"profesional"`, `"profesional-completion"`, `"student"`.
- `programForTier` (2-value) survives only for legacy call sites without `professional_type`. New logic uses `programFor`. Don't reintroduce `programForTier` where a `professional_type` is in scope.
- The compliance chain is one direction: `isCeEligible(tier, pt)` ⇒ `programFor(...) === "profesional"` ⇒ `certAwardsCeus(program)` ⇒ CEU/ACPE printed. If you ever see CE text without `certAwardsCeus`, that's the bug.
