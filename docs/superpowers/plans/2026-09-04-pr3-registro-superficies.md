# PR 3 — Superficies públicas del registro liviano — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tarjetas públicas de "Parte 2" y "Estudiantes Subgraduados" en `/cursos` y la portada (ES+EN), ofrecidas solo cuando su Stripe Price env existe; y el conteo de asientos público sumando registros.

**Architecture:** Las tarjetas viven en `cursosGrid.items` (i18n, lookup por id — regla CLAUDE.md). Gating: helper `isPricingOffered(courseId, tier)` en `courses.ts` — un pricing `registrationOnly` sin env se oculta (evita que el CTA aterrice en un form que resetea al tier profesional de $2,395). Asientos: `enrollmentCountByCohort` pliega `course_registrations` (es "the single seat count used everywhere"), y el API deja de sumar aparte.

**Spec:** `docs/superpowers/specs/2026-09-04-registro-liviano-parte2-subgraduado-design.md` (§6, parte de §7)

## Global Constraints
- Rama `feat/registro-superficies` off `main`. Sin montos en dólares en tarjetas (test existente lo exige y es la convención del sitio).
- ES byte-exacto como fuente; EN traducción fiel. items por id, nunca por índice.
- No tocar: flujo estudiante, quizzes, admin (PR 4).

### Task 1: Asientos unificados + helper de oferta
- `lib/cohorts.ts`: `enrollmentCountByCohort` suma `course_registrations` por cohorte (dos queries, merge). Doc actualizado.
- `api/inscripcion/route.ts`: revertir la suma manual (una sola llamada). Adaptar `tests/unit/inscripcion-registro-branch.test.ts` (capacidad vía un solo mock).
- `lib/courses.ts`: `isPricingOffered(courseId, tier)` — pricing inexistente → false; no-registrationOnly → true; registrationOnly → Boolean(env). Test unit RED→GREEN.

### Task 2: Tarjetas en /cursos (CursosGrid)
- `es.json`/`en.json`: items nuevos `parte-2` (level Avanzado, 12 h · 2 días, modules [], noCe, credentialNote, includesItems propios, audience farmaceutico_tecnico) y `estudiantes-subgraduados` (courseRef basic-compounding, enrollTier subgraduado, audience subgraduado, 18 h · 3 días, módulos del básico, noCe, includesItems propios).
- `CursosGrid.tsx`: filtrar items con `isPricingOffered(enrollCourseId ?? courseRef ?? id, enrollTier ?? "profesional")`.
- Test componente RED→GREEN: con envs → ambas tarjetas visibles (título + credentialNote); sin envs → ausentes; tarjetas existentes intactas.

### Task 3: Portada (CursosHome)
- i18n: `parte2Highlights`, `subgraduadoHighlights`, `priceNoteParte2`, `priceNoteSubgraduado`.
- `CursosHome.tsx`: dos cards nuevas (tone light) tras las tres existentes, cada una gated por `isPricingOffered`; grid md:grid-cols-3 con wrap (3+2).
- Test componente RED→GREEN (con envs set; y el test "no dollar price" sigue pasando).

### Task 4: Verificación y PR
- `pnpm vitest run` + `pnpm build`; commit por task; PR con Implemented/Risks/Controls/Tests.
