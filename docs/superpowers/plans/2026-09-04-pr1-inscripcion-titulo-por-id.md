# PR 1 — Título de curso por id (no por posición) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El `<select>` de curso en el formulario de inscripción resuelve su título buscando la tarjeta i18n por `id`, no por índice posicional, para que añadir un segundo curso al catálogo no muestre títulos equivocados.

**Architecture:** `InscripcionForm` hoy hace `tCourses.raw(\`${COURSES.indexOf(c)}.title\`)` contra `cursosGrid.items` (array i18n de 3 tarjetas vs. catálogo de 1 curso — coincide solo por casualidad en el índice 0). Se reemplaza por `raw("items")` + `find(it => it.id === c.id)` con fallback a `c.id`.

**Tech Stack:** Next.js App Router, next-intl, vitest + @testing-library/react (jsdom).

**Spec:** `docs/superpowers/specs/2026-09-04-registro-liviano-parte2-subgraduado-design.md` (§8)

## Global Constraints

- Rama `fix/inscripcion-titulo-por-id` off `main`; nunca commit directo a `main`.
- Test RED primero, luego el fix (regla del repo para gates/regresiones).
- Verificación: vitest + `pnpm build` (tsc/vitest no ven errores build-only).
- El spec y este plan se commitean en esta misma rama.

---

### Task 1: Test de regresión + fix del lookup

**Files:**
- Modify: `src/components/marketing/inscripcion/InscripcionForm.tsx:421-429` (bloque `COURSES.map` del select de curso; hook `tCourses` en `:66`)
- Test: `tests/components/InscripcionForm.test.tsx` (añadir describe nuevo)

**Interfaces:**
- Consumes: `COURSES` de `@/lib/courses`; mensajes `cursosGrid.items[]` (`{ id, title, ... }`) de `src/messages/{es,en}.json`.
- Produces: nada nuevo — mismo DOM, título correcto por id.

- [ ] **Step 1: Escribir el test que falla**

En `tests/components/InscripcionForm.test.tsx`, añadir:

```tsx
describe("InscripcionForm course select titles", () => {
  it("resolves the course title by card id even when cursosGrid.items is reordered", () => {
    // Simula el estado futuro: la tarjeta de basic-compounding NO está en el índice 0.
    const reordered = structuredClone(esMessages);
    reordered.cursosGrid.items = [...reordered.cursosGrid.items].reverse();
    const expectedTitle = esMessages.cursosGrid.items.find(
      (it) => it.id === "basic-compounding",
    )!.title;

    const { container } = render(
      <NextIntlClientProvider locale="es" messages={reordered}>
        <InscripcionForm
          locale="es"
          preselectedTier="profesional"
          cohorts={cohorts}
          docsVersion="2026-01-01"
        />
      </NextIntlClientProvider>,
    );

    const option = container.querySelector(
      'select[name="curso_id"] option[value="basic-compounding"]',
    );
    expect(option?.textContent).toBe(expectedTitle);
  });
});
```

(Ajustar tipos si `structuredClone` sobre el JSON importado necesita cast; reusar el fixture `cohorts` ya definido en el archivo.)

- [ ] **Step 2: Verificar que falla**

Run: `pnpm vitest run tests/components/InscripcionForm.test.tsx`
Expected: FAIL — el option muestra el título de la tarjeta en el índice 0 (tras el reverse, "Otros Profesionales"), no el de basic-compounding.

- [ ] **Step 3: Fix mínimo**

En `InscripcionForm.tsx`: cambiar el hook de `:66` a namespace `cursosGrid` y resolver por id:

```tsx
const tCursosGrid = useTranslations("cursosGrid");
// dentro del render, antes del map:
const gridItems = tCursosGrid.raw("items") as { id: string; title: string }[];
// en el select:
{COURSES.map((c) => {
  const title = gridItems.find((it) => it.id === c.id)?.title ?? c.id;
  return (
    <option key={c.id} value={c.id}>
      {title}
    </option>
  );
})}
```

Si `tCourses` (`cursosGrid.items`) tiene otros usos en el archivo, conservarlo; si el select era su único uso, eliminarlo.

- [ ] **Step 4: Verificar que pasa + suite completa**

Run: `pnpm vitest run tests/components/InscripcionForm.test.tsx` → PASS
Run: `pnpm vitest run` → PASS (sin regresiones)
Run: `pnpm build` → OK

- [ ] **Step 5: Commit + PR**

```bash
git checkout -b fix/inscripcion-titulo-por-id
git add tests/components/InscripcionForm.test.tsx src/components/marketing/inscripcion/InscripcionForm.tsx docs/superpowers/
git commit -m "fix(inscripcion): resolver título del curso por id de tarjeta, no por índice posicional"
git push -u origin fix/inscripcion-titulo-por-id
gh pr create
```

PR body: qué rompía (índice posicional COURSES↔items), por qué ahora (pre-requisito de Parte 2, spec §8), evidencia RED→GREEN.
