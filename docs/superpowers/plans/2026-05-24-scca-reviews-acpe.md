# SCCA Reviews + ACPE Compliance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the end-to-end student-review flow (24h email invite → admin approval → public landing display) bundled with the ACPE Standards 3 and 5.1 compliance pieces (learner-facing disclosure block in the portal + Spanish paper templates for the offline forms).

**Architecture:** A new Drizzle migration adds `published_at` / `archived_at` columns to `reviews` and a `review_invites` dedupe table. A daily GitHub Actions cron calls a new authenticated Next.js API route that finds cert-eligible students who haven't been invited and sends a Resend email. The admin gains a "Reseñas pendientes" section with approve / archive server actions. A new server component on the landing fetches and displays 3-5 approved reviews. The portal dashboard gains an ACPE-required disclosure block driven by env vars. The two paper forms live in `docs/acpe/` as Spanish markdown templates.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Tailwind 4 · next-intl · Auth.js 5 · Drizzle ORM (Neon Postgres) · Resend · GitHub Actions cron · Playwright + Vitest.

**Spec:** `docs/superpowers/specs/2026-05-24-scca-reviews-acpe-design.md`.

---

## File structure

**Created**
- `drizzle/0005_reviews_publishing.sql`
- `src/lib/emails/review-invite.ts`
- `src/app/api/cron/review-invites/route.ts`
- `.github/workflows/send-review-invites.yml`
- `src/app/[locale]/(portal)/portal/admin/actions.ts`
- `src/components/marketing/Resenas.tsx`
- `src/components/portal/AcpeDisclosure.tsx`
- `src/lib/reviews/format.ts`
- `tests/unit/format-reviewer-name.test.ts`
- `tests/unit/review-invite-email.test.ts`
- `tests/e2e/resenas.spec.ts`
- `docs/acpe/financial-disclosure-form-es.md`
- `docs/acpe/content-validity-peer-review-es.md`

**Modified**
- `src/lib/db/schema.ts` — add `publishedAt`, `archivedAt`, `reviewInvites` table.
- `src/app/[locale]/(portal)/portal/admin/page.tsx` — add "Reseñas pendientes" section + status badges.
- `src/app/[locale]/(portal)/portal/page.tsx` — render `<AcpeDisclosure />` above the modules strip.
- `src/app/[locale]/(marketing)/page.tsx` — render `<Resenas />` between `Galeria` and `FaqClean`.
- `src/messages/es.json`, `src/messages/en.json` — i18n keys for the landing reviews section.
- `.env.example` — add `CRON_SECRET`, `ACPE_DISCLOSURE_HEADING_ES`, `ACPE_DISCLOSURE_BODY_ES`.
- `STATUS.md` — reflect new state.

---

## Task 1 — Drizzle migration 0005 + schema update

**Files:**
- Create: `drizzle/0005_reviews_publishing.sql`
- Modify: `src/lib/db/schema.ts`

- [ ] **Step 1.1: Create the migration SQL file**

Create `drizzle/0005_reviews_publishing.sql` with exactly:

```sql
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "archived_at" timestamp;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "review_invites" (
	"user_id" text PRIMARY KEY NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "review_invites" ADD CONSTRAINT "review_invites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
```

- [ ] **Step 1.2: Add new columns + table to `src/lib/db/schema.ts`**

Locate the `reviews` table definition and add the two new columns just before the closing `});`:

```ts
  publishedAt: timestamp("published_at"),
  archivedAt: timestamp("archived_at"),
```

Then add a new exported table immediately after the `reviews` block:

```ts
/**
 * Dedupe ledger for the daily review-invite cron — one row per user the
 * moment the invite is sent. Skipping rule: the cron excludes any user
 * with a matching row here (regardless of whether they later left a
 * review). Cascades on user deletion so test-cleanup stays simple.
 */
export const reviewInvites = pgTable("review_invites", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  sentAt: timestamp("sent_at", { mode: "date" }).defaultNow().notNull(),
});
```

Add a corresponding type export near the bottom of the file (with the other `type X = typeof ...` exports):

```ts
export type Review = typeof reviews.$inferSelect;
export type ReviewInvite = typeof reviewInvites.$inferSelect;
```

- [ ] **Step 1.3: Verify TypeScript compiles**

Run:

```bash
pnpm typecheck
```

Expected: `> tsc --noEmit` with no errors.

- [ ] **Step 1.4: Commit**

```bash
git checkout -b feat/reviews-acpe
```

```bash
git add drizzle/0005_reviews_publishing.sql src/lib/db/schema.ts
```

```bash
git commit -m "feat(db): migration 0005 — review publishing + invite ledger

Adds reviews.published_at, reviews.archived_at, and the review_invites
table for the 24h email cron's deduplication. Schema mirrors the
migration so the rest of the feature work can type against it.

The migration must be applied manually in the Neon SQL Editor per repo
convention (no CI migration runner).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2 — ACPE financial disclosure paper template

**Files:**
- Create: `docs/acpe/financial-disclosure-form-es.md`

- [ ] **Step 2.1: Create the markdown template**

Create `docs/acpe/financial-disclosure-form-es.md` with this content:

```markdown
# Divulgación de relaciones financieras — Faculty / Planificador

> ACPE Standards for Integrity and Independence, Standard 3.
> Adaptación al español del template oficial del ACCME (Acreditation
> Council for Continuing Medical Education), distribuido por ACPE bajo
> permiso. Llenar antes de cada cohorte o anualmente.

## Datos del individuo

- **Nombre completo:** ___________________________________________
- **Título de la actividad de CE:** _____________________________
- **Fecha y sede:** ______________________________________________
- **Rol prospectivo en la actividad** (marca todos los que apliquen):
  - [ ] Planificador
  - [ ] Faculty / Conferenciante / Instructor
  - [ ] Autor / Redactor
  - [ ] Revisor
  - [ ] Otro: ___________________________________

## Instrucciones

Por favor divulga **todas las relaciones financieras** que has tenido en los **últimos 24 meses** con compañías **inelegibles** (definición abajo). Para cada relación, indica el nombre de la compañía inelegible y la naturaleza de la relación. **No hay umbral mínimo** — divulga toda relación financiera independientemente del monto.

Divulga todas las relaciones aunque no las consideres relevantes a la educación. La determinación de relevancia y la mitigación correspondiente las realiza el proveedor acreditado.

**Compañía inelegible:** cualquier entidad cuyo negocio principal sea producir, comercializar, vender, revender o distribuir productos sanitarios usados por o en pacientes.

Los Standards for Integrity and Independence requieren descalificar de la planificación e implementación a quien se niegue a proveer esta información.

## Tabla de relaciones financieras

| Compañía inelegible | Naturaleza de la relación | ¿Terminó la relación? |
|---|---|---|
| (ej: ABC Pharma) | (ej: consultor, empleado, accionista, conferenciante, royalty/patente) | ☐ Sí |
|  |  | ☐ Sí |
|  |  | ☐ Sí |
|  |  | ☐ Sí |
|  |  | ☐ Sí |
|  |  | ☐ Sí |
|  |  | ☐ Sí |

**Ejemplos de naturaleza de la relación:** empleado, investigador, consultor, asesor, conferenciante, contratista independiente (incluyendo investigación contratada), royalties o beneficiario de patente, rol ejecutivo, e interés de propiedad. Acciones individuales y opciones sobre acciones deben divulgarse; fondos mutuos diversificados no.

## Atestación

- [ ] En los últimos 24 meses, **no he tenido** relaciones financieras con compañías inelegibles.

Yo certifico que la información provista arriba es correcta a la fecha de esta atestación.

**Firma:** ______________________________________________

**Fecha:** ______________________________________________

---

> Adaptado con permiso del Accreditation Council for Continuing Medical Education (ACCME®). Distribuido a través del Accreditation Council for Pharmacy Education (ACPE).
```

- [ ] **Step 2.2: Commit**

```bash
git add docs/acpe/financial-disclosure-form-es.md
```

```bash
git commit -m "docs(acpe): financial disclosure form (Standard 3) — ES template

Spanish-language adaptation of the ACPE Standards for Integrity and
Independence faculty financial-relationships intake form. Owner /
Lcdo. Reyes prints, fills, and signs once per cohort (or annually if
nothing changes). PDF is filed in the cohort's archive outside the
repo.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3 — ACPE content validity peer review paper template

**Files:**
- Create: `docs/acpe/content-validity-peer-review-es.md`

- [ ] **Step 3.1: Create the markdown template**

Create `docs/acpe/content-validity-peer-review-es.md` with this content:

```markdown
# Revisión por pares — Validez del contenido clínico

> ACPE Standards for Integrity and Independence, Standard 5.1.
> Adaptación al español del template oficial del ACCME distribuido por
> ACPE bajo permiso. Llenar por un revisor externo (no faculty de la
> actividad), por cohorte o cuando el contenido cambie materialmente.

## Datos de la actividad

- **Título de la actividad / curso:** ___________________________
- **Sede y fecha:** ______________________________________________
- **Faculty principal:** _________________________________________
- **Nombre del revisor:** _______________________________________
- **Credenciales del revisor:** __________________________________
- **Atestación de no conflicto:** El revisor declara **no tener** relaciones financieras relevantes con compañías inelegibles relacionadas al contenido revisado.

## Cuestionario de revisión

Responde Sí / No a cada pregunta. Si la respuesta es No, explica en los comentarios qué requiere ajuste antes de impartir la actividad.

### 1. Base científica de las recomendaciones

¿Las recomendaciones para el cuidado del paciente están basadas en ciencia, evidencia y razonamiento clínico actuales, presentando una visión justa y balanceada de las opciones diagnósticas y terapéuticas? *(Guideline 5.1(1))*

- [ ] Sí
- [ ] No

**Comentarios:**
_______________________________________________________________
_______________________________________________________________

### 2. Validez de la investigación científica

¿Toda la investigación científica referida, reportada o usada en la actividad — en apoyo o justificación de una recomendación de cuidado al paciente — se ajusta a estándares generalmente aceptados de diseño experimental, recolección, análisis e interpretación de datos? *(Guideline 5.1(2))*

- [ ] Sí
- [ ] No

**Comentarios:**
_______________________________________________________________
_______________________________________________________________

### 3. Identificación de tópicos emergentes

¿Los tópicos nuevos y en evolución cuya base de evidencia es menor (o ausente) están **claramente identificados como tales** dentro de la actividad y las presentaciones individuales? *(Guideline 5.1(3))*

- [ ] Sí
- [ ] No

**Comentarios:**
_______________________________________________________________
_______________________________________________________________

### 4. Ausencia de promoción no respaldada

¿La actividad **evita abogar por o promover** prácticas que no están adecuadamente basadas — o aún no lo están — en ciencia, evidencia y razonamiento clínico actuales? *(Guideline 5.1(3))*

- [ ] Sí
- [ ] No

**Comentarios:**
_______________________________________________________________
_______________________________________________________________

### 5. Exclusión de prácticas no científicas o riesgosas

¿La actividad **excluye** cualquier promoción de enfoques no científicos al diagnóstico o la terapia, o recomendaciones, tratamientos o formas de practicar la atención médica que tengan riesgos o peligros que superen los beneficios, o que se sepa que son inefectivos en el tratamiento de pacientes? *(Guideline 5.1(4))*

- [ ] Sí
- [ ] No

**Comentarios:**
_______________________________________________________________
_______________________________________________________________

## Firma del revisor

**Firma:** ______________________________________________

**Fecha:** ______________________________________________

---

> Adaptado con permiso del Accreditation Council for Continuing Medical Education (ACCME®). Distribuido a través del Accreditation Council for Pharmacy Education (ACPE).
```

- [ ] **Step 3.2: Commit**

```bash
git add docs/acpe/content-validity-peer-review-es.md
```

```bash
git commit -m "docs(acpe): content validity peer review (Standard 5.1) — ES template

Spanish-language adaptation of the ACPE Standards for Integrity and
Independence peer review template for clinical-content validity. An
external pharmacist (no conflicts) signs this per cohort or when course
content changes materially. PDF filed in the cohort archive outside
the repo.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4 — ACPE disclosure block on the portal dashboard

**Files:**
- Create: `src/components/portal/AcpeDisclosure.tsx`
- Modify: `src/app/[locale]/(portal)/portal/page.tsx`
- Modify: `.env.example`
- Test: `tests/components/AcpeDisclosure.test.tsx`

- [ ] **Step 4.1: Write the failing component test**

Create `tests/components/AcpeDisclosure.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcpeDisclosure } from "@/components/portal/AcpeDisclosure";

describe("AcpeDisclosure", () => {
  const originalHeading = process.env.ACPE_DISCLOSURE_HEADING_ES;
  const originalBody = process.env.ACPE_DISCLOSURE_BODY_ES;

  afterEach(() => {
    process.env.ACPE_DISCLOSURE_HEADING_ES = originalHeading;
    process.env.ACPE_DISCLOSURE_BODY_ES = originalBody;
  });

  it("renders the default heading and body when env vars are unset", () => {
    delete process.env.ACPE_DISCLOSURE_HEADING_ES;
    delete process.env.ACPE_DISCLOSURE_BODY_ES;
    render(<AcpeDisclosure />);
    expect(screen.getByText("Divulgación de relaciones financieras")).toBeInTheDocument();
    expect(
      screen.getByText(/Lcdo\. Jorge L\. Reyes Quiñones, RPh, FACA, FACVP/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no tiene relaciones financieras relevantes/),
    ).toBeInTheDocument();
  });

  it("renders env-overridden heading and body when set", () => {
    process.env.ACPE_DISCLOSURE_HEADING_ES = "Encabezado de prueba";
    process.env.ACPE_DISCLOSURE_BODY_ES = "Cuerpo de prueba 12345.";
    render(<AcpeDisclosure />);
    expect(screen.getByText("Encabezado de prueba")).toBeInTheDocument();
    expect(screen.getByText(/Cuerpo de prueba 12345/)).toBeInTheDocument();
  });

  it("includes the ACPE standards reference footer", () => {
    render(<AcpeDisclosure />);
    expect(
      screen.getByText(/Standards for Integrity and Independence/i),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 4.2: Run the test — expect failure**

```bash
pnpm test tests/components/AcpeDisclosure.test.tsx
```

Expected: FAIL with `Cannot find module '@/components/portal/AcpeDisclosure'`.

- [ ] **Step 4.3: Create the component**

Create `src/components/portal/AcpeDisclosure.tsx`:

```tsx
import { GlassCard } from "@/components/glass/GlassCard";

/**
 * ACPE Standard 3.C — learner-facing financial-relationships disclosure.
 *
 * Rendered persistently on the student dashboard above any module
 * content so the disclosure is in front of the learner *before* they
 * engage with the activity. Text is driven by env vars so the owner
 * can update wording (e.g., when a new cohort adds a faculty member
 * with a relationship) without a code change.
 *
 * Defaults reflect the current state confirmed with the owner on
 * 2026-05-24: no faculty or planner has relevant financial
 * relationships to disclose.
 */
const DEFAULT_HEADING = "Divulgación de relaciones financieras";
const DEFAULT_BODY =
  "El Lcdo. Jorge L. Reyes Quiñones, RPh, FACA, FACVP — instructor de esta actividad de educación continua — no tiene relaciones financieras relevantes con compañías inelegibles que reportar. Ningún miembro del equipo de planificación de esta actividad tiene relaciones financieras relevantes que reportar.";

export function AcpeDisclosure() {
  const heading = process.env.ACPE_DISCLOSURE_HEADING_ES?.trim() || DEFAULT_HEADING;
  const body = process.env.ACPE_DISCLOSURE_BODY_ES?.trim() || DEFAULT_BODY;
  return (
    <GlassCard interactive={false} className="mt-8 p-6 sm:p-7">
      <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
        {heading}
      </p>
      <p className="text-gray-900 mt-3 text-sm leading-relaxed">{body}</p>
      <p className="text-gray-700 mt-4 text-xs leading-relaxed">
        Conforme con ACPE Standards for Integrity and Independence, Standard 3.
      </p>
    </GlassCard>
  );
}
```

- [ ] **Step 4.4: Run the test — expect pass**

```bash
pnpm test tests/components/AcpeDisclosure.test.tsx
```

Expected: 3 tests PASS.

- [ ] **Step 4.5: Wire the component into the portal dashboard**

Open `src/app/[locale]/(portal)/portal/page.tsx`. At the top of the imports block (alongside the other component imports), add:

```ts
import { AcpeDisclosure } from "@/components/portal/AcpeDisclosure";
```

Then locate the `<InstructorHero />` render inside the `Dashboard` function. Insert `<AcpeDisclosure />` **immediately after `<InstructorHero />`** (and **before** the `{!isPaid && (...)}` payment-pending block) so the disclosure sits above any module / payment content:

```tsx
      {/* Instructor hero — compact glass card right under the greeting
          so paid students see the human anchor for the course before
          the payment + cert + module banners. */}
      <InstructorHero />

      {/* ACPE Standard 3 — learner-facing financial-relationships
          disclosure. Must appear before any module content. */}
      <AcpeDisclosure />
```

- [ ] **Step 4.6: Add env vars to `.env.example`**

Locate the section of `.env.example` where Stripe / Resend env vars live and append a new block:

```bash
# ──────────────────────────────────────────────────────────────────────
# ACPE Standard 3 disclosure block (rendered on the portal dashboard).
# Defaults in src/components/portal/AcpeDisclosure.tsx — set these to
# override when a cohort's faculty or planning team has a relationship
# to disclose. Plain text, no Markdown.
# ──────────────────────────────────────────────────────────────────────
ACPE_DISCLOSURE_HEADING_ES=
ACPE_DISCLOSURE_BODY_ES=
```

- [ ] **Step 4.7: Run typecheck + lint**

```bash
pnpm typecheck
```

Expected: clean.

```bash
pnpm lint
```

Expected: clean.

- [ ] **Step 4.8: Commit**

```bash
git add src/components/portal/AcpeDisclosure.tsx tests/components/AcpeDisclosure.test.tsx src/app/[locale]/(portal)/portal/page.tsx .env.example
```

```bash
git commit -m "feat(portal): ACPE Standard 3 disclosure on student dashboard

Adds a persistent disclosure block to the portal dashboard so learners
see the faculty financial-relationships statement before engaging with
any module content (ACPE Standard 3.C requirement).

Heading and body are env-driven (ACPE_DISCLOSURE_HEADING_ES /
ACPE_DISCLOSURE_BODY_ES) with sensible defaults baked in for the
current state: no relevant relationships to disclose.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5 — Reviewer-name helper + unit test

**Files:**
- Create: `src/lib/reviews/format.ts`
- Test: `tests/unit/format-reviewer-name.test.ts`

The public Resenas component shows "María R." instead of full names. This task extracts the formatter so it is testable and reusable.

- [ ] **Step 5.1: Write the failing test**

Create `tests/unit/format-reviewer-name.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatReviewerName } from "@/lib/reviews/format";

describe("formatReviewerName", () => {
  it("formats first name + last initial when both are present", () => {
    expect(formatReviewerName("María del Carmen Rivera Santiago")).toBe("María R.");
  });

  it("formats first name + last initial for a simple two-word name", () => {
    expect(formatReviewerName("Juan Pérez")).toBe("Juan P.");
  });

  it("returns just the first name when no last name is present", () => {
    expect(formatReviewerName("Juan")).toBe("Juan");
  });

  it("returns a sensible fallback when the input is empty or null-ish", () => {
    expect(formatReviewerName(null)).toBe("Estudiante");
    expect(formatReviewerName("")).toBe("Estudiante");
    expect(formatReviewerName("   ")).toBe("Estudiante");
  });

  it("collapses double spaces and trims whitespace", () => {
    expect(formatReviewerName("  María   Rivera ")).toBe("María R.");
  });

  it("handles a single-letter first name without trailing period stacking", () => {
    expect(formatReviewerName("A. Rivera")).toBe("A. R.");
  });
});
```

- [ ] **Step 5.2: Run the test — expect failure**

```bash
pnpm test tests/unit/format-reviewer-name.test.ts
```

Expected: FAIL with `Cannot find module '@/lib/reviews/format'`.

- [ ] **Step 5.3: Create the helper**

Create `src/lib/reviews/format.ts`:

```ts
/**
 * Display formatter for public review cards.
 *
 * Takes the student's full name as stored in `users.name` (Auth.js stores
 * whatever the magic-link sign-in flow captured) and returns the
 * privacy-respecting form used on the marketing landing:
 *
 *   "María del Carmen Rivera Santiago"  →  "María R."
 *   "Juan Pérez"                         →  "Juan P."
 *   "Juan"                               →  "Juan"
 *   null / empty / whitespace            →  "Estudiante"
 */
export function formatReviewerName(raw: string | null | undefined): string {
  if (!raw) return "Estudiante";
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Estudiante";
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase();
  return `${first} ${lastInitial}.`;
}
```

- [ ] **Step 5.4: Run the test — expect pass**

```bash
pnpm test tests/unit/format-reviewer-name.test.ts
```

Expected: 6 tests PASS.

- [ ] **Step 5.5: Commit**

```bash
git add src/lib/reviews/format.ts tests/unit/format-reviewer-name.test.ts
```

```bash
git commit -m "feat(reviews): formatReviewerName helper

Extracts the public-display name formatter ('María R.' from a full
name) into a tested helper so the Resenas marketing component (next
task) stays focused on layout. Trims, collapses whitespace, falls
back to 'Estudiante' for missing names.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6 — Resenas marketing component + landing integration

**Files:**
- Create: `src/components/marketing/Resenas.tsx`
- Modify: `src/app/[locale]/(marketing)/page.tsx`
- Modify: `src/messages/es.json`
- Modify: `src/messages/en.json`
- Test: `tests/e2e/resenas.spec.ts`

The component is a server component: queries Drizzle directly, returns `null` when fewer than 3 approved reviews exist. The e2e test verifies the section is absent on the live landing (it is — no published reviews yet), which protects against regressions that would render an empty container.

- [ ] **Step 6.1: Add the new i18n keys to `src/messages/es.json`**

Locate the `"instagram"` namespace block (or any top-level namespace near the end of the file). Add a new `"resenas"` namespace immediately before the closing brace of the root object. Exact JSON to add (preserve trailing commas as needed):

```json
,
  "resenas": {
    "eyebrow": "Comunidad",
    "heading": "Lo que dicen los estudiantes",
    "subheading": "Reseñas reales de quienes han completado el curso.",
    "tierProfesional": "Profesional",
    "tierStudent": "Estudiante",
    "cohortPrefix": "Cohorte"
  }
```

Open `src/messages/es.json`, find the closing `}` of the root object, insert the block above just before it. **Adjust the comma on the previous key** so the JSON stays valid.

- [ ] **Step 6.2: Add the matching keys to `src/messages/en.json`**

Same structure, English text:

```json
,
  "resenas": {
    "eyebrow": "Community",
    "heading": "What students are saying",
    "subheading": "Real reviews from students who completed the course.",
    "tierProfesional": "Professional",
    "tierStudent": "Student",
    "cohortPrefix": "Cohort"
  }
```

- [ ] **Step 6.3: Verify i18n parity holds**

```bash
pnpm check:i18n
```

Expected: `i18n parity OK across en.json, es.json (321 keys).` (315 was the old count; six new keys lifted it to 321.)

- [ ] **Step 6.4: Create the Resenas component**

Create `src/components/marketing/Resenas.tsx`:

```tsx
import { desc, eq, isNotNull, and, isNull } from "drizzle-orm";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { db } from "@/lib/db";
import { reviews, users, cohorts } from "@/lib/db/schema";
import { formatReviewerName } from "@/lib/reviews/format";
import { formatCohortLabel } from "@/lib/cohorts";

type Locale = "es" | "en";

type Card = {
  id: string;
  rating: number;
  bestComment: string;
  displayName: string;
  tier: "profesional" | "student" | null;
  cohortLabel: string;
};

async function loadApprovedReviews(locale: Locale, limit = 5): Promise<Card[]> {
  try {
    const rows = await db
      .select({
        id: reviews.id,
        rating: reviews.overallRating,
        bestComment: reviews.bestComment,
        userName: users.name,
        userTier: users.tier,
        cohortId: users.cohortId,
        publishedAt: reviews.publishedAt,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(
        and(
          eq(reviews.publicConsent, true),
          isNotNull(reviews.publishedAt),
          isNull(reviews.archivedAt),
        ),
      )
      .orderBy(desc(reviews.publishedAt))
      .limit(limit);

    const cohortRows = await db.select().from(cohorts);
    const cohortById = new Map(cohortRows.map((c) => [c.id, c]));

    return rows
      .filter((r) => Boolean(r.bestComment?.trim()))
      .map((r) => {
        const cohort = r.cohortId ? cohortById.get(r.cohortId) : undefined;
        return {
          id: r.id,
          rating: r.rating,
          bestComment: r.bestComment!.trim(),
          displayName: formatReviewerName(r.userName),
          tier: r.userTier ?? null,
          cohortLabel: cohort ? formatCohortLabel(cohort, locale) : "",
        };
      });
  } catch (err) {
    // Graceful degradation: if the DB is unreachable (e.g., during e2e
    // tests where the server cannot reach Neon), do not throw — the
    // landing page is more important than this section.
    console.warn("[Resenas] DB query failed, rendering without reviews", err);
    return [];
  }
}

export async function Resenas({ locale }: { locale: Locale }) {
  const cards = await loadApprovedReviews(locale);
  // ACPE-credibility constraint + owner preference: never render an
  // anaemic section. Require ≥3 approved reviews before showing
  // anything publicly.
  if (cards.length < 3) return null;
  return <ResenasView cards={cards} />;
}

function ResenasView({ cards }: { cards: Card[] }) {
  const t = useTranslations("resenas");
  return (
    <section aria-labelledby="resenas-heading" className="bg-off-white">
      <Container className="max-w-5xl py-20 sm:py-24 lg:py-28">
        <p className="font-heading text-teal-deep/80 flex items-center text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
          <span
            aria-hidden
            className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm"
          />
          {t("eyebrow")}
        </p>
        <h2
          id="resenas-heading"
          className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl"
        >
          {t("heading")}
        </h2>
        <p className="text-gray-700 mt-3 max-w-2xl text-base leading-relaxed">
          {t("subheading")}
        </p>

        <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <li key={card.id}>
              <ResenaCard card={card} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function ResenaCard({ card }: { card: Card }) {
  const t = useTranslations("resenas");
  const tierLabel =
    card.tier === "profesional"
      ? t("tierProfesional")
      : card.tier === "student"
        ? t("tierStudent")
        : "";
  return (
    <article className="border-gray-300 rounded-xl border bg-white p-5 shadow-sm sm:p-6">
      <Stars rating={card.rating} />
      <p className="text-gray-900 mt-4 text-sm leading-relaxed">"{card.bestComment}"</p>
      <p className="font-heading text-teal-deep mt-5 text-sm font-semibold">{card.displayName}</p>
      <p className="text-gray-700 mt-1 text-xs">
        {[tierLabel, card.cohortLabel && `${t("cohortPrefix")} ${card.cohortLabel}`]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </article>
  );
}

function Stars({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div aria-label={`${clamped} de 5 estrellas`} className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={i < clamped ? "text-chartreuse" : "text-gray-300"}
        >
          ★
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 6.5: Render `<Resenas />` on the landing**

Open `src/app/[locale]/(marketing)/page.tsx`. Locate the imports block; add:

```ts
import { Resenas } from "@/components/marketing/Resenas";
```

Inside the JSX, find the `<Galeria />` render. Insert `<Resenas locale={locale} />` **immediately after `<Galeria />`** and **before** the `<FaqClean />` render. The `locale` value comes from the same `params` destructuring already in scope at the top of the page.

If the page does not destructure `locale` already, add the same pattern other server components in that file use — typically:

```tsx
const { locale } = await params;
```

Then pass `locale` to `<Resenas />`.

- [ ] **Step 6.6: Write the e2e test**

Create `tests/e2e/resenas.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

/**
 * `<Resenas />` is gated on ≥3 approved reviews. In the test environment
 * the DB is unreachable, so the component returns []. Verify the section
 * is absent (no orphaned container, no empty heading).
 *
 * When real approved reviews exist in production this test will be
 * tightened to assert positive presence (heading visible + at least
 * 3 articles).
 */
test.describe("Resenas section — landing", () => {
  test("section is absent when there are fewer than 3 approved reviews", async ({ page }) => {
    await page.goto("/es");
    await expect(page.getByRole("heading", { name: "Lo que dicen los estudiantes" })).toHaveCount(0);
    // Defence in depth — also ensure no anonymous '★' star clusters
    // bleed in if a future change accidentally renders the View
    // before checking length.
    const stars = page.locator("section[aria-labelledby='resenas-heading']");
    await expect(stars).toHaveCount(0);
  });
});
```

- [ ] **Step 6.7: Run typecheck + lint**

```bash
pnpm typecheck
```

Expected: clean.

```bash
pnpm lint
```

Expected: clean.

- [ ] **Step 6.8: Run the e2e Resenas test**

```bash
pnpm exec playwright test tests/e2e/resenas.spec.ts --reporter=list
```

Expected: 1 test PASS. The webServer build may take ~1-2 min.

- [ ] **Step 6.9: Commit**

```bash
git add src/components/marketing/Resenas.tsx src/app/[locale]/(marketing)/page.tsx src/messages/es.json src/messages/en.json tests/e2e/resenas.spec.ts
```

```bash
git commit -m "feat(marketing): public Resenas section on the landing

Adds a server-rendered 'Lo que dicen los estudiantes' section between
Galeria and FaqClean. Pulls 3-5 most-recent approved reviews from
Drizzle (public_consent=true + published_at IS NOT NULL +
archived_at IS NULL) and renders compact cards: ⭐ + best_comment +
'María R.' + tier + cohort. No aggregate stats per owner preference.

The section is gated at ≥3 approved reviews — fewer renders nothing,
because an anaemic testimonials section hurts credibility more than
no section at all. DB outages also degrade to 'no section'.

Six new i18n keys (es/en) keep parity at 321 keys.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7 — Admin "Reseñas pendientes" section + server actions

**Files:**
- Create: `src/app/[locale]/(portal)/portal/admin/actions.ts`
- Modify: `src/app/[locale]/(portal)/portal/admin/page.tsx`

- [ ] **Step 7.1: Create the server actions file**

Create `src/app/[locale]/(portal)/portal/admin/actions.ts`:

```ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    throw new Error("Forbidden");
  }
}

/**
 * Mark a review as approved for public display. Idempotent — calling on
 * an already-published review just refreshes the timestamp, which the
 * landing sort uses to bring it back to the top.
 */
export async function approveReview(reviewId: string): Promise<void> {
  await requireAdmin();
  await db
    .update(reviews)
    .set({ publishedAt: new Date(), archivedAt: null })
    .where(eq(reviews.id, reviewId));
  revalidatePath("/es/portal/admin");
  revalidatePath("/es");
  revalidatePath("/en");
}

/**
 * Soft-archive a review so it is excluded from both the public landing
 * and the admin "pending" queue. The row is retained so an unarchive
 * action can be added later if needed.
 */
export async function archiveReview(reviewId: string): Promise<void> {
  await requireAdmin();
  await db
    .update(reviews)
    .set({ archivedAt: new Date(), publishedAt: null })
    .where(eq(reviews.id, reviewId));
  revalidatePath("/es/portal/admin");
  revalidatePath("/es");
  revalidatePath("/en");
}
```

- [ ] **Step 7.2: Update `src/app/[locale]/(portal)/portal/admin/page.tsx`**

Open the admin page. Make these targeted modifications:

**a)** Update the import lines (top of the file) to include the new schema columns and the server actions:

```ts
import { desc, eq, isNotNull, isNull, and } from "drizzle-orm";
```

```ts
import { approveReview, archiveReview } from "./actions";
```

**b)** Locate the existing `reviewRows` query (uses `.from(reviews)` with no filter). Replace its select with one that also pulls `publishedAt`, `archivedAt`, and `publicConsent`, so the table renderer can show a status badge per row. Update the query to:

```ts
  const reviewRows = await db
    .select({
      id: reviews.id,
      userName: users.name,
      userEmail: users.email,
      overall: reviews.overallRating,
      m1: reviews.m1Rating,
      m2: reviews.m2Rating,
      m3: reviews.m3Rating,
      best: reviews.bestComment,
      improve: reviews.improveComment,
      submittedAt: reviews.submittedAt,
      publicConsent: reviews.publicConsent,
      publishedAt: reviews.publishedAt,
      archivedAt: reviews.archivedAt,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .orderBy(desc(reviews.submittedAt));
```

**c)** Below the existing query, derive the pending list in-page:

```ts
  const pendingReviews = reviewRows.filter(
    (r) => r.publicConsent && !r.publishedAt && !r.archivedAt,
  );
```

**d)** In the JSX, **above** the existing "Reseñas del curso" section, render a new `<section>` for pending reviews. Add this block:

```tsx
{pendingReviews.length > 0 && (
  <section aria-labelledby="resenas-pendientes-heading" className="mt-12">
    <h2
      id="resenas-pendientes-heading"
      className="font-heading text-teal-deep text-xl font-semibold sm:text-2xl"
    >
      Reseñas pendientes ({pendingReviews.length})
    </h2>
    <p className="text-gray-700 mt-2 text-sm">
      Estas reseñas tienen consentimiento del estudiante. Apruébalas para mostrarlas en la
      landing, o archívalas si prefieres no publicarlas.
    </p>
    <ul className="mt-6 space-y-4">
      {pendingReviews.map((r) => (
        <li key={r.id}>
          <PendingCard
            reviewId={r.id}
            userName={r.userName}
            overall={r.overall}
            m1={r.m1}
            m2={r.m2}
            m3={r.m3}
            best={r.best}
            improve={r.improve}
            submittedAt={r.submittedAt}
          />
        </li>
      ))}
    </ul>
  </section>
)}
```

**e)** Add the `PendingCard` component at the bottom of the same file (so the page can stay a single-file admin tool — the rest of the page already follows that convention):

```tsx
function PendingCard({
  reviewId,
  userName,
  overall,
  m1,
  m2,
  m3,
  best,
  improve,
  submittedAt,
}: {
  reviewId: string;
  userName: string | null;
  overall: number;
  m1: number | null;
  m2: number | null;
  m3: number | null;
  best: string | null;
  improve: string | null;
  submittedAt: Date;
}) {
  return (
    <article className="border-gray-300 rounded-lg border bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-heading text-teal-deep text-base font-semibold">
          {userName ?? "Estudiante"}
        </p>
        <p className="text-gray-700 text-xs">{fmtDate(submittedAt)}</p>
      </header>
      <p className="text-gray-900 mt-3 text-sm">
        General: <strong>{overall}/5</strong> · Día 1: {m1 ?? "—"}/5 · Día 2:{" "}
        {m2 ?? "—"}/5 · Día 3: {m3 ?? "—"}/5
      </p>
      {best && (
        <p className="text-gray-900 mt-3 text-sm leading-relaxed">
          <strong>Lo mejor:</strong> {best}
        </p>
      )}
      {improve && (
        <p className="text-gray-900 mt-2 text-sm leading-relaxed">
          <strong>Mejoraríamos:</strong> {improve}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <form action={approveReview.bind(null, reviewId)}>
          <button
            type="submit"
            className="bg-chartreuse text-teal-deep font-heading inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold hover:opacity-90"
          >
            Aprobar
          </button>
        </form>
        <form action={archiveReview.bind(null, reviewId)}>
          <button
            type="submit"
            className="border-gray-300 text-gray-900 font-heading inline-flex h-10 items-center rounded-md border bg-white px-4 text-sm font-semibold hover:bg-gray-100"
          >
            Archivar
          </button>
        </form>
      </div>
    </article>
  );
}
```

**f)** In the existing reviews table render, add a "Estado" column that shows the per-row status. After the existing data columns add a new `<th>`:

```tsx
<th scope="col" className="px-4 py-3 text-left">
  Estado
</th>
```

And a corresponding `<td>` per row:

```tsx
<td className="px-4 py-3 text-xs">
  {r.publishedAt
    ? "Publicada"
    : r.archivedAt
      ? "Archivada"
      : r.publicConsent
        ? "Pendiente"
        : "Sin consentimiento"}
</td>
```

(Adjust the colspan of any "no reviews" empty-state row to include the new column.)

- [ ] **Step 7.3: Verify typecheck + lint**

```bash
pnpm typecheck
```

Expected: clean.

```bash
pnpm lint
```

Expected: clean.

- [ ] **Step 7.4: Commit**

```bash
git add src/app/[locale]/(portal)/portal/admin/actions.ts src/app/[locale]/(portal)/portal/admin/page.tsx
```

```bash
git commit -m "feat(admin): Reseñas pendientes section + approve/archive actions

The admin gains a new top section that lists reviews with the
student's consent that have not yet been approved or archived. Two
server actions (approveReview, archiveReview) flip the new published_at
/ archived_at columns and revalidate the landing + admin paths so the
public surface reflects the change immediately.

The existing reviews table also gains a 'Estado' column with a per-row
badge (Publicada / Archivada / Pendiente / Sin consentimiento) for
visibility into the full set without affecting the action flow.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8 — review-invite email template

**Files:**
- Create: `src/lib/emails/review-invite.ts`
- Test: `tests/unit/review-invite-email.test.ts`

- [ ] **Step 8.1: Write the failing test**

Create `tests/unit/review-invite-email.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildReviewInviteEmail } from "@/lib/emails/review-invite";

describe("buildReviewInviteEmail", () => {
  it("interpolates the student's first name into the subject and body", () => {
    const out = buildReviewInviteEmail({
      nombre: "María del Carmen Rivera Santiago",
      reviewUrl: "https://sccompoundingacademy.com/es/portal/reseñas",
    });
    expect(out.subject).toContain("María");
    expect(out.text).toContain("María");
    expect(out.html).toContain("María");
  });

  it("includes the review URL in both html and text bodies", () => {
    const out = buildReviewInviteEmail({
      nombre: "Juan Pérez",
      reviewUrl: "https://sccompoundingacademy.com/es/portal/reseñas",
    });
    expect(out.html).toContain("https://sccompoundingacademy.com/es/portal/reseñas");
    expect(out.text).toContain("https://sccompoundingacademy.com/es/portal/reseñas");
  });

  it("uses a fallback greeting when the name is missing", () => {
    const out = buildReviewInviteEmail({
      nombre: "",
      reviewUrl: "https://sccompoundingacademy.com/es/portal/reseñas",
    });
    expect(out.text.toLowerCase()).toContain("hola");
    expect(out.subject.length).toBeGreaterThan(0);
  });

  it("returns plain-text and html that mention the Lcdo. Reyes-signed voice", () => {
    const out = buildReviewInviteEmail({
      nombre: "Juan",
      reviewUrl: "https://sccompoundingacademy.com/es/portal/reseñas",
    });
    expect(out.text).toMatch(/Lcdo\.\s*Jorge\s*Reyes/i);
    expect(out.html).toMatch(/Lcdo\.\s*Jorge\s*Reyes/i);
  });
});
```

- [ ] **Step 8.2: Run the test — expect failure**

```bash
pnpm test tests/unit/review-invite-email.test.ts
```

Expected: FAIL with `Cannot find module '@/lib/emails/review-invite'`.

- [ ] **Step 8.3: Implement the email builder**

Create `src/lib/emails/review-invite.ts`:

```ts
import { brand } from "@/lib/brand";

/**
 * Review-invite email sent 24h after a student becomes cert-eligible
 * (has passed all 3 module post-tests). Voice mirrors the educator-
 * warm tone the portal uses elsewhere — the email reads as if signed
 * by Lcdo. Reyes, not as a faceless transactional notification.
 *
 * No-React-Email convention: hand-written HTML with inline styles,
 * brand colours interpolated from lib/brand.ts at build time so the
 * no-hex-literal lint rule does not fail.
 */
type InviteParams = {
  nombre: string;
  reviewUrl: string;
};

const c = brand.colors;
const LOGO_URL = "https://www.sccompoundingacademy.com/brand/logo-email.png";
const FOOTER_NOTE =
  "Recibes este mensaje porque completaste recientemente el curso Basic Compounding No Estéril en SCCA.";

function firstName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/);
  return parts[0] ?? "";
}

export function buildReviewInviteEmail(p: InviteParams): {
  subject: string;
  html: string;
  text: string;
} {
  const first = firstName(p.nombre);
  const greeting = first ? `Hola ${first}` : "Hola";
  const subject = first
    ? `${first}, ¿cómo te fue en el curso? · SCCA`
    : "¿Cómo te fue en el curso? · SCCA";

  const text = `${greeting},

Acabas de completar el curso Basic Compounding No Estéril en Santa Cruz Compounding Academy. ¡Felicidades!

Si tienes un minuto, me ayudaría muchísimo si compartes una reseña corta. Cualquier cosa que aprendiste, algo que cambiarías, lo que más te llevaste. Tu feedback nos ayuda a mejorar el curso para las próximas cohortes — y, si das tu consentimiento, lo mostramos en el sitio para que otros farmacéuticos sepan qué esperar.

Dejar la reseña: ${p.reviewUrl}

Gracias por confiar en nosotros para esta etapa.

—Lcdo. Jorge L. Reyes Quiñones, RPh, FACA, FACVP
Santa Cruz Compounding Academy

${FOOTER_NOTE}
`;

  const html = `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:${c.offWhite};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${c.gray900};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${c.offWhite};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:${c.tealDeep};padding:24px 32px;text-align:left;">
                <img src="${LOGO_URL}" alt="Santa Cruz Compounding Academy" width="160" style="display:block;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">${greeting},</p>
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">
                  Acabas de completar el curso <strong>Basic Compounding No Estéril</strong> en Santa Cruz Compounding Academy. ¡Felicidades!
                </p>
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">
                  Si tienes un minuto, me ayudaría muchísimo si compartes una reseña corta. Cualquier cosa que aprendiste, algo que cambiarías, lo que más te llevaste. Tu feedback nos ayuda a mejorar el curso para las próximas cohortes — y, si das tu consentimiento, lo mostramos en el sitio para que otros farmacéuticos sepan qué esperar.
                </p>
                <p style="margin:24px 0;">
                  <a href="${p.reviewUrl}"
                     style="background-color:${c.chartreuse};color:${c.tealDeep};display:inline-block;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">
                    Dejar mi reseña
                  </a>
                </p>
                <p style="margin:0 0 8px 0;font-size:16px;line-height:1.6;">
                  Gracias por confiar en nosotros para esta etapa.
                </p>
                <p style="margin:0;font-size:15px;line-height:1.6;color:${c.gray900};">
                  —Lcdo. Jorge L. Reyes Quiñones, RPh, FACA, FACVP<br/>
                  <span style="color:${c.gray700};font-size:13px;">Santa Cruz Compounding Academy</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px 32px;font-size:12px;color:${c.gray700};line-height:1.5;">
                ${FOOTER_NOTE}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
```

- [ ] **Step 8.4: Run the test — expect pass**

```bash
pnpm test tests/unit/review-invite-email.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 8.5: Commit**

```bash
git add src/lib/emails/review-invite.ts tests/unit/review-invite-email.test.ts
```

```bash
git commit -m "feat(emails): review-invite template (educator-warm voice)

Hand-written HTML email (no React Email dep, matches inscripcion-
confirmacion.ts pattern). Voice is first-person from Lcdo. Reyes,
not a transactional notification. Brand colours interpolated from
lib/brand.ts so the no-hex-literal rule stays happy.

Used by the upcoming /api/cron/review-invites route at +24h after
cert-eligibility.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9 — Cron API route `/api/cron/review-invites`

**Files:**
- Create: `src/app/api/cron/review-invites/route.ts`
- Modify: `.env.example`
- Test: `tests/unit/review-invite-route.test.ts`

The cron's job: find users who passed their 3rd post-test ≥24h ago, haven't been invited, and haven't already submitted a review. Send the email. Record the invite in `review_invites`.

- [ ] **Step 9.1: Write the failing test (auth gate only — the DB side is verified manually)**

Create `tests/unit/review-invite-route.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/cron/review-invites/route";

describe("POST /api/cron/review-invites — auth gate", () => {
  const original = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret-123";
  });
  afterEach(() => {
    process.env.CRON_SECRET = original;
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const req = new Request("https://example.com/api/cron/review-invites", {
      method: "POST",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when the Authorization header is wrong", async () => {
    const req = new Request("https://example.com/api/cron/review-invites", {
      method: "POST",
      headers: { authorization: "Bearer wrong-secret" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 500 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const req = new Request("https://example.com/api/cron/review-invites", {
      method: "POST",
      headers: { authorization: "Bearer test-secret-123" },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 9.2: Run the test — expect failure**

```bash
pnpm test tests/unit/review-invite-route.test.ts
```

Expected: FAIL with `Cannot find module '@/app/api/cron/review-invites/route'`.

- [ ] **Step 9.3: Implement the cron route**

Create `src/app/api/cron/review-invites/route.ts`:

```ts
import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { users, quizAttempts, reviews, reviewInvites } from "@/lib/db/schema";
import { buildReviewInviteEmail } from "@/lib/emails/review-invite";
import { getSiteUrl } from "@/lib/siteUrl";

export const runtime = "nodejs";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const FROM_ADDRESS =
  process.env.EMAIL_FROM ??
  process.env.RESEND_FROM ??
  "Santa Cruz Compounding Academy <noreply@sccompoundingacademy.com>";
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? "info@sccompoundingacademy.com";

function authorize(req: Request): "ok" | "no-secret" | "forbidden" {
  const secret = process.env.CRON_SECRET;
  if (!secret) return "no-secret";
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}` ? "ok" : "forbidden";
}

/**
 * Find users whose 3rd passed post-test was ≥24h ago, who have not been
 * invited yet, and have not submitted a review yet. Returns at most 50
 * candidates per run to keep Resend usage predictable.
 */
async function findCandidates(now: Date) {
  const cutoff = new Date(now.getTime() - ONE_DAY_MS);

  // Pull all (userId, latest pass timestamp for any post-test phase row
  // with passed=true). We then count distinct module passes per user
  // in JS — small audience, simple to reason about, avoids gnarly SQL.
  const passRows = await db
    .select({
      userId: quizAttempts.userId,
      moduleId: quizAttempts.moduleId,
      submittedAt: quizAttempts.submittedAt,
      passed: quizAttempts.passed,
      phase: quizAttempts.phase,
    })
    .from(quizAttempts)
    .where(and(eq(quizAttempts.phase, "post"), eq(quizAttempts.passed, true)));

  type PerUser = {
    userId: string;
    modules: Set<number>;
    latestPassAt: Date | null;
  };
  const byUser = new Map<string, PerUser>();
  for (const r of passRows) {
    if (!r.submittedAt) continue;
    const slot = byUser.get(r.userId) ?? {
      userId: r.userId,
      modules: new Set<number>(),
      latestPassAt: null,
    };
    slot.modules.add(r.moduleId);
    if (!slot.latestPassAt || r.submittedAt > slot.latestPassAt) {
      slot.latestPassAt = r.submittedAt;
    }
    byUser.set(r.userId, slot);
  }

  const eligibleIds = Array.from(byUser.values())
    .filter((u) => u.modules.size >= 3 && u.latestPassAt && u.latestPassAt <= cutoff)
    .map((u) => u.userId);
  if (eligibleIds.length === 0) return [];

  // Exclude users who already have an invite recorded or a review on file.
  const alreadyInvited = await db
    .select({ userId: reviewInvites.userId })
    .from(reviewInvites);
  const invitedSet = new Set(alreadyInvited.map((r) => r.userId));

  const reviewed = await db.select({ userId: reviews.userId }).from(reviews);
  const reviewedSet = new Set(reviewed.map((r) => r.userId));

  const targetIds = eligibleIds.filter((id) => !invitedSet.has(id) && !reviewedSet.has(id));
  if (targetIds.length === 0) return [];

  const targets = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(inArray(users.id, targetIds))
    .limit(50);

  return targets;
}

export async function POST(req: Request) {
  const verdict = authorize(req);
  if (verdict === "no-secret") {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  if (verdict === "forbidden") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 },
    );
  }
  const resend = new Resend(apiKey);

  const now = new Date();
  const candidates = await findCandidates(now);
  if (candidates.length === 0) {
    return NextResponse.json({ sent: 0, message: "no candidates" });
  }

  const reviewUrl = `${getSiteUrl()}/es/portal/reseñas`;

  let sent = 0;
  const errors: Array<{ userId: string; error: string }> = [];
  for (const u of candidates) {
    if (!u.email) continue;
    try {
      const email = buildReviewInviteEmail({
        nombre: u.name ?? "",
        reviewUrl,
      });
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: u.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        replyTo: REPLY_TO,
      });
      await db
        .insert(reviewInvites)
        .values({ userId: u.id, sentAt: now })
        .onConflictDoNothing();
      sent += 1;
    } catch (err) {
      errors.push({
        userId: u.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ sent, errors });
}
```

- [ ] **Step 9.4: Run the test — expect pass**

```bash
pnpm test tests/unit/review-invite-route.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 9.5: Add `CRON_SECRET` to `.env.example`**

Append to `.env.example`:

```bash
# ──────────────────────────────────────────────────────────────────────
# Cron auth — shared secret between the send-review-invites GitHub
# Actions workflow and the /api/cron/review-invites route. Set the same
# value in GitHub repo secrets and in Vercel Production env vars.
# Generate with: `openssl rand -hex 32`.
# ──────────────────────────────────────────────────────────────────────
CRON_SECRET=
```

- [ ] **Step 9.6: Typecheck + lint**

```bash
pnpm typecheck
```

Expected: clean.

```bash
pnpm lint
```

Expected: clean.

- [ ] **Step 9.7: Commit**

```bash
git add src/app/api/cron/review-invites/route.ts tests/unit/review-invite-route.test.ts .env.example
```

```bash
git commit -m "feat(api): cron route to send 24h review-invite emails

POST /api/cron/review-invites, guarded by a CRON_SECRET bearer token,
finds users whose 3rd post-test passed ≥24h ago, who have not yet been
invited and have not yet left a review. For each, sends the invite via
Resend and records the row in review_invites to dedupe future runs.

Caps each run at 50 sends to keep Resend usage predictable. Sub-step
failures are collected per-user and returned in the response body so
the GitHub Actions log surfaces them; one bad send does not block the
others.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10 — GitHub Actions workflow for the daily cron

**Files:**
- Create: `.github/workflows/send-review-invites.yml`

- [ ] **Step 10.1: Create the workflow**

Create `.github/workflows/send-review-invites.yml`:

```yaml
# Sends the 24h review-invite emails by calling the protected Next.js
# cron route once a day. The route does the DB scan + Resend send +
# deduplication; this workflow's only job is to hit it on schedule.
#
# Required GitHub Actions secret:
#   CRON_SECRET — the same value set as CRON_SECRET in Vercel Production
#                 env vars. Generate with `openssl rand -hex 32`.
#
# The same secret protects the route from public traffic. If the run
# returns a non-2xx the job fails and the Actions UI surfaces the body.

name: Send review invites

on:
  schedule:
    # Once daily at 16:00 UTC (12:00 noon AST). Off-peak, lets a
    # student who finished the previous evening still get the email
    # the next day.
    - cron: "0 16 * * *"
  workflow_dispatch: # manual trigger from the Actions tab

concurrency:
  group: send-review-invites
  cancel-in-progress: false

jobs:
  send:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Hit the cron route
        env:
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
        run: |
          response=$(curl -sS -X POST \
            -H "Authorization: Bearer ${CRON_SECRET}" \
            -w "\n%{http_code}" \
            https://sccompoundingacademy.com/api/cron/review-invites)
          body=$(echo "$response" | head -n -1)
          status=$(echo "$response" | tail -n 1)
          echo "HTTP $status"
          echo "$body"
          if [ "$status" != "200" ]; then
            echo "::error::cron route returned HTTP $status"
            exit 1
          fi
```

- [ ] **Step 10.2: Commit**

```bash
git add .github/workflows/send-review-invites.yml
```

```bash
git commit -m "ci: daily cron workflow for review-invite emails

Triggers the /api/cron/review-invites route once a day at 16:00 UTC
(noon AST) using a CRON_SECRET bearer. Fails the job and surfaces the
response body if the route returns non-200, so a regression on the
route is visible in the Actions UI.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11 — STATUS.md refresh

**Files:**
- Modify: `STATUS.md`

- [ ] **Step 11.1: Update the "Last updated" date**

Replace the line:

```
> **Last updated**: 2026-05-22
```

with:

```
> **Last updated**: 2026-05-24
```

- [ ] **Step 11.2: Add the reviews + ACPE pieces to "Live in production"**

In the **Student portal (Phase A — `/portal/*`)** bullet list, append:

```
- ACPE Standard 3 — financial-relationships disclosure block on the portal dashboard (env-driven, configurable per cohort)
- Review-invite email sent 24h after cert-eligibility (daily GitHub Actions cron → `/api/cron/review-invites` → Resend)
- Admin: "Reseñas pendientes" with approve / archive server actions
```

Below the **Owner admin** subsection, add a new block:

```
**Marketing landing**
- "Lo que dicen los estudiantes" section between Galería and FAQ — shows 3-5 most-recent approved reviews; section is hidden when fewer than 3 are approved
```

- [ ] **Step 11.3: Move shipped Phase B items**

In **Phase B → Built**, append:

```
- Public reviews display on landing with owner curation (PR for the reviews + ACPE bundle)
- Automated review-invite email
```

In **Phase B → Not yet built**, remove the now-shipped lines:

- `Public reviews display with consent filter on homepage`
- `Automated email sequences (welcome post-payment, pre-quiz reminder, certificate-issued notification)` — keep this entry but trim it to `Automated welcome-post-payment and pre-quiz reminder emails (review-invite shipped)`.

- [ ] **Step 11.4: Update the accessibility findings note**

In the **Known accessibility findings** section, append this sentence to the closing parenthetical paragraph (the one that already explains the disabled-button exemption):

```
The new ACPE disclosure block uses `text-gray-900 text-sm` on the GlassCard surface (≈8.5:1 contrast) and the new Resenas section uses the same `text-gray-900` body color on white — both pass AA without additional changes.
```

- [ ] **Step 11.5: Commit**

```bash
git add STATUS.md
```

```bash
git commit -m "docs(status): reflect reviews + ACPE shipping

Updates STATUS.md for the work landed in this branch: ACPE Standard 3
disclosure block live in the portal, 24h review-invite cron live,
admin approve/archive flow live, public reviews section on the
landing. Moves the relevant Phase B bullets into the Built list.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12 — Full gauntlet + PR

- [ ] **Step 12.1: Run the full gauntlet locally**

```bash
pnpm typecheck
```

Expected: clean.

```bash
pnpm lint
```

Expected: clean.

```bash
pnpm check:i18n
```

Expected: `i18n parity OK across en.json, es.json (321 keys).`

```bash
pnpm test
```

Expected: previous 16 tests + 4 (`AcpeDisclosure`) + 6 (`format-reviewer-name`) + 4 (`review-invite-email`) + 3 (`review-invite-route`) = **33 tests pass.**

```bash
pnpm exec playwright test --reporter=list
```

Expected: all e2e tests pass, including the new `tests/e2e/resenas.spec.ts`. (The webServer build will take ~1-2 min.)

```bash
pnpm build
```

Expected: production build succeeds, `/api/cron/review-invites` listed as a function route.

- [ ] **Step 12.2: Apply the Drizzle migration in Neon**

In the Neon SQL Editor, paste and run the contents of `drizzle/0005_reviews_publishing.sql` so the new columns / table land before the deploy hits production. Verify with:

```sql
SELECT column_name FROM information_schema.columns WHERE table_name='reviews';
SELECT to_regclass('public.review_invites');
```

Expected: `published_at` and `archived_at` listed; `review_invites` exists.

- [ ] **Step 12.3: Push the branch and open the PR**

```bash
git push -u origin feat/reviews-acpe
```

```bash
gh pr create --title "feat: reviews collection + ACPE Standards 3 & 5.1 compliance" --body "Implements docs/superpowers/specs/2026-05-24-scca-reviews-acpe-design.md end-to-end. 12 commits, one per task in the plan. Full gauntlet green locally. Migration 0005 applied in Neon."
```

- [ ] **Step 12.4: Set Vercel + GitHub Secrets**

Before merging:

- **Vercel → Settings → Environment Variables (Production):** add `CRON_SECRET` with a value generated by `openssl rand -hex 32`. Optionally add `ACPE_DISCLOSURE_HEADING_ES` / `ACPE_DISCLOSURE_BODY_ES` if you want to override the defaults baked into the component.
- **GitHub → repo Settings → Secrets and variables → Actions:** add `CRON_SECRET` with the **same value**.

- [ ] **Step 12.5: Merge the PR**

```bash
gh pr merge --squash --delete-branch
```

```bash
git checkout main
```

```bash
git pull --ff-only
```

- [ ] **Step 12.6: Smoke-test in production**

After Vercel finishes deploying:

```bash
curl -sS -X POST -H "Authorization: Bearer <CRON_SECRET>" https://sccompoundingacademy.com/api/cron/review-invites
```

Expected: `200 OK` with `{"sent": 0, "message": "no candidates"}` (no eligible students yet at first run).

Visit `https://sccompoundingacademy.com/es/portal` while signed in as the admin (`sccapr2025@gmail.com`) and confirm the **Divulgación de relaciones financieras** card renders above the modules strip.

Visit `https://sccompoundingacademy.com/es` and confirm the **Lo que dicen los estudiantes** section is **absent** (no approved reviews yet — expected).

In Stripe webhook + portal flow, once at least one student passes all 3 post-tests **and** the cron fires once after 24h, the test loop is closed.

---

## Implementation notes

- **Migration application discipline**: per repo convention (STATUS.md "Repo conventions") migrations are applied manually in Neon. Task 12 step 2 is the place for that — apply *before* the production deploy goes live so the route doesn't error trying to read missing columns.
- **Cron secret rotation**: if `CRON_SECRET` ever leaks (e.g., accidentally logged), regenerate, set in Vercel + GitHub, and the next scheduled run picks up the new value. Old curl requests will 401.
- **Email volume**: at cohort size 12, the cron sends ≤12 emails per cohort, well within Resend's 3,000/month free tier.
- **Owner workflow on a new approved review**: a click of **Aprobar** is a server action that revalidates `/es` + `/en` immediately, so the landing surfaces the review within seconds. No manual deploy required.
