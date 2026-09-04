# PR 2 — Núcleo de registro liviano (`course_registrations`) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pagar → confirmación (participante + copia admin) sin usuario de portal, para el curso nuevo `parte-2` (profesional $1,745) y el tier nuevo `subgraduado` del curso básico (inactivo hasta que exista su env de Stripe).

**Architecture:** Flag `registrationOnly` en `Pricing`; el POST /api/inscripcion reusa el camino profesional (checkout con metadata) pero valida duplicado/capacidad contra la tabla nueva `course_registrations`; el webhook, al ver `metadata.registration_only === "1"`, inserta el registro (idempotente por `stripe_session_id`) y envía email nuevo de registro + el email interno existente — nunca toca `users`.

**Tech Stack:** Next.js App Router, Drizzle/Neon (migraciones SQL a mano — nunca `db:generate`), Stripe Checkout + webhook firmado, Resend, vitest.

**Spec:** `docs/superpowers/specs/2026-09-04-registro-liviano-parte2-subgraduado-design.md` (§3–§5)

## Global Constraints

- Rama `feat/course-registrations` off `main`. Merge DESPUÉS de #163 (ambos tocan `InscripcionForm.tsx`; rebase si hace falta).
- No tocar: enum `tier` de `users`, gates del portal, certificados, flujo estudiante, quizzes, Airtable (el registro liviano NO escribe en Airtable — el email interno es la notificación).
- Migraciones idempotentes estilo `drizzle/0011_cohort_audience.sql`; se aplican a mano en Neon ANTES del deploy.
- Envs nuevos solo declarados en `.env.example` — valores nunca en código.
- ASSUMPTIONS a confirmar con el founder (copy, no bloquean): parte-2 `uspLabel` "USP 〈795〉 + 〈800〉", 12 h (2×6), título display "Compounding No Estéril Avanzado — Parte 2".

---

### Task 1: Migraciones + schema Drizzle

**Files:**
- Create: `drizzle/0014_course_registrations.sql`, `drizzle/0015_audience_subgraduado.sql`
- Modify: `src/lib/db/schema.ts` (añadir `subgraduado` a `cohortAudienceEnum:144-148`; tabla `courseRegistrations` nueva al final + types)

**Interfaces:**
- Produces: tabla `courseRegistrations` (cols: id, cohortId, courseId, tier, nombre, email, telefono, profesion, amountCents, stripeSessionId UNIQUE, paidAt, createdAt; UNIQUE(cohort_id,email)); types `CourseRegistration`/`NewCourseRegistration`.

- [ ] 0014: `CREATE TABLE IF NOT EXISTS "course_registrations" (...)` con `UNIQUE ("cohort_id","email")` y FK a cohorts(id).
- [ ] 0015: `ALTER TYPE "cohort_audience" ADD VALUE IF NOT EXISTS 'subgraduado';`
- [ ] schema.ts: enum + pgTable espejo exacto del SQL.
- [ ] Commit.

### Task 2: Catálogo + audiencia + zod

**Files:**
- Modify: `src/lib/courses.ts` (CourseId+="parte-2"; Tier+="subgraduado"; `level: "fundamentos" | "avanzado"`; `Pricing.registrationOnly?: true`; `Course.displayTitle: {es,en}`; entrada parte-2; pricing subgraduado en básico; envs `STRIPE_PRICE_ID_PARTE2_PROFESIONAL` / `STRIPE_PRICE_ID_BASICO_SUBGRADUADO`)
- Modify: `src/lib/cohorts/audience.ts` (CohortAudience+, AUDIENCE_LABELS+, `enrolleeAudience`: `if (tier === "subgraduado") return "subgraduado";`)
- Modify: `src/lib/inscripcion/schema.ts:22` (`z.enum(["profesional","student","subgraduado"])`)
- Modify: `.env.example`, `src/messages/es.json` + `en.json` (`inscripcion.tiers.subgraduado.{label,note}`)
- Modify: admin selector de audiencia (`src/app/[locale]/(portal)/portal/admin/cohortes/fields.ts` y `page.tsx:97`)
- Test: `tests/unit/registro-liviano-catalogo.test.ts` (RED primero)

Tests: parte-2 existe sin `acpe` y todo su pricing `registrationOnly`; subgraduado en básico `registrationOnly`; `enrolleeAudience("subgraduado", null) === "subgraduado"`; zod acepta subgraduado sin `tipo_profesional` y sigue exigiéndolo a profesional; displayTitle definido para ambos cursos.

### Task 3: Data layer `src/lib/registrations.ts` (nuevo)

**Interfaces (Produces):**
- `insertRegistration(values: NewCourseRegistration): Promise<{inserted: boolean}>` — `onConflictDoNothing({target: stripeSessionId})`.
- `registrationExists(cohortId: string, email: string): Promise<boolean>`
- `registrationCountByCohort(): Promise<Map<string, number>>` — espejo de `enrollmentCountByCohort`.

### Task 4: POST /api/inscripcion — pre-checks registration-only

**Files:** `src/app/api/inscripcion/route.ts`

- Mover la resolución `pricing`/`invalid-tier` (hoy `:326-332`) ANTES del pre-check de duplicado; `const registrationOnly = pricing.registrationOnly === true`.
- Duplicado: si registrationOnly → `registrationExists(cohort.id, email)` → 409 `already-enrolled` (NO consulta `users`); si no, camino actual intacto.
- Capacidad: asientos = `enrollmentCountByCohort` + `registrationCountByCohort` del cohorte (sumar siempre — para cohortes de cursos con teoría el segundo término es 0).
- Metadata: `registration_only: registrationOnly ? "1" : ""`.
- El branch student queda antes e intacto (subgraduado NO es student).
- Test: `tests/unit/inscripcion-registro-branch.test.ts` siguiendo el patrón de mocks de `tests/unit/inscripcion-student-branch.test.ts` (RED primero): subgraduado con env → llega a Stripe con metadata registration_only=1 y sin tocar users; duplicado en misma cohorte → 409; sin env → 503 price-missing.

### Task 5: Webhook — branch de registro

**Files:** `src/app/api/webhooks/stripe/route.ts`, Create: `src/lib/emails/registro-confirmacion.ts`

- Tras resolver course/cohort y ANTES del narrowing de tier (`:201`): `if (md.registration_only === "1") { ... return 200 }`.
- Insert vía `insertRegistration` (tier = `md.tier` texto crudo; amountCents = `session.amount_total ?? 0`; email lowercase). Throw → outer catch existente (release claim + 500). `inserted:false` (replay) → 200 sin emails.
- Side effects best-effort (inner try/catch, patrón existente): `revalidatePath("/", "layout")`; email `registro-confirmacion` al participante (displayTitle del curso por locale, cohorte, monto, recibo; SIN portal CTA, SIN welcome packet); `buildInternalEmail` a `INTERNAL_RECIPIENT` (mismo mecanismo actual, con displayTitle como cursoTitulo).
- Template nuevo sobre `_shell.ts`: eyebrow "Registro confirmado"/"Registration confirmed", card de detalles (cohorte/fechas/monto), sede + horario, link recibo, soporte.
- Test: unit del branch (RED primero) con el patrón de mocks del webhook existente: metadata registration_only → inserta en course_registrations, 0 escrituras a users, 200; replay (inserted:false) → no reenvía emails.

### Task 6: Form + página — ofrecer solo tiers con env

**Files:** `src/app/[locale]/(marketing)/inscripcion/page.tsx`, `src/components/marketing/inscripcion/InscripcionForm.tsx`
- page.tsx: whitelist `?tier=` += "subgraduado"; computar `enabledTiers: Record<string, Tier[]>` (por curso, pricing cuyo env existe) y pasarlo al form.
- Form: prop nueva `enabledTiers`; filtrar `selectedCourse.pricing`; al cambiar curso/si el tier activo no está habilitado → primer tier habilitado; aceptar "subgraduado" en preselectedTier.
- Test componente (RED primero): con enabledTiers sin subgraduado → el botón no se renderiza; con él → se renderiza con su label i18n.

### Task 7: CLAUDE.md + verificación final

- CLAUDE.md (repo): regla "Arrays de i18n se resuelven por id, nunca por índice posicional".
- `pnpm vitest run` + `pnpm build`. Commit, push, `gh pr create` (body: Implemented/Risks/Controls/Tests + migraciones a aplicar en Neon + envs a crear en Vercel/Stripe).
