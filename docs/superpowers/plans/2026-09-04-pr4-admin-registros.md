# PR 4 — Vista admin de registros livianos + CSV — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El admin ve los registrados de Parte 2 / Subgraduados (tabla por cohorte en el panel) y exporta CSV. Sin acciones de aprobación — el registro pagado es final.

**Architecture:** Sección nueva "Registros" en `/portal/admin` (server component, patrón GlassCard existente), query envuelta en `.catch` (patrón `emailEvents`: la tabla puede no existir en previews con Neon sin migrar). Ruta CSV nueva `/api/admin/export-registros` espejo de `/api/admin/export` (auth `isAdminEmail`, BOM UTF-8). Data layer: `listRegistrations()` en `lib/registrations.ts`.

**Spec:** `docs/superpowers/specs/2026-09-04-registro-liviano-parte2-subgraduado-design.md` (§7)

## Global Constraints
- Rama `feat/admin-registros` off `main`. Solo lectura — cero acciones de mutación sobre registros (reembolsos = manual en Stripe, runbook).
- No tocar: roster de usuarios, verificaciones, stats existentes.

### Task 1: Data layer + ruta CSV (test RED primero)
- `lib/registrations.ts`: `listRegistrations()` → todas las filas, `paidAt` desc.
- `src/app/api/admin/export-registros/route.ts`: GET admin-only; columnas Nombre · Email · Teléfono · Profesión · Tier · Curso · Cohorte · Monto USD · Pago; BOM + CRLF + csvCell escapado (copiar helper); filename `scca-registros-YYYY-MM-DD.csv`.
- Test `tests/unit/export-registros-route.test.ts`: 403 sin sesión admin; 200 con CSV que contiene la fila mockeada y el header correcto.

### Task 2: Sección en el panel admin
- `portal/admin/page.tsx`: GlassCard "Registros — Parte 2 y Subgraduados" bajo el roster: tabla (Nombre, Email, Teléfono, Profesión, Tier, Curso, Cohorte, Monto, Pago), cohorte vía `cohortById` + `formatCohortLabel(…, "es")`, monto vía `formatPrice`; botón "Exportar CSV ↓" → `/api/admin/export-registros` (plain `<a>`); vacío → "Sin registros aún."; query `.catch` → oculta sección con log.

### Task 3: Verificación y PR
- `pnpm vitest run` + `pnpm build`; PR con Implemented/Risks/Controls/Tests.
