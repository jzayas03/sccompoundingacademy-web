# Spec — Ofertas de "registro liviano": curso Parte 2 y tier Estudiante Subgraduado

**Fecha:** 2026-09-04 · **Estado:** aprobado en diseño, pendiente de plan de implementación
**Decisiones del founder:** 2026-09-04 (esta conversación)

## 1. Resumen

Dos ofertas nuevas que comparten un mismo mecanismo:

| Oferta | Curso | Tier | Precio | Duración |
|---|---|---|---|---|
| **Parte 2** (curso avanzado) | `parte-2` (nuevo) | `profesional` | $1,745 — `STRIPE_PRICE_ID_PARTE2_PROFESIONAL` | 2 días |
| **Estudiante Subgraduado** | `basic-compounding` (existente) | `subgraduado` (nuevo) | TBD — `STRIPE_PRICE_ID_BASICO_SUBGRADUADO` | 3 días |

Ambas son **solo-registro**: el participante paga con Stripe Checkout y recibe un
email de confirmación; una copia llega al email admin de la academia (el mismo que
hoy recibe las notificaciones de matrícula pendiente). **No** se crea usuario del
portal, **no** hay evidencia de matrícula ni aprobación previa, **no** hay PDFs,
pruebas, CE ni certificado. Los usuarios del portal quedan reservados para los
cursos con teoría.

Cada oferta tiene **cohortes dedicadas con sus propias fechas** (decisión del
founder): las de Parte 2 son cohortes del curso `parte-2`; las de subgraduados son
cohortes de `basic-compounding` con la audiencia nueva `subgraduado`.

## 2. Qué NO cambia (do-not-touch)

- El enum `tier` de Postgres en `users` (el tier nuevo nunca llega a `users`).
- Gates del portal (paid → approved → pre-test), currículo, certificados y sus
  prefijos, flujo estudiante actual (evidencia → aprobación → link de pago).
- El flujo profesional existente del curso básico.
- Bancos de quizzes y regla de paridad deck ↔ banco (no aplican: sin material).
- Neon prod: la migración es aditiva e idempotente, hand-authored
  (regla del repo: nunca `pnpm db:generate`).

## 3. Modelo de datos

### 3.1 Tabla nueva `course_registrations`

```
id            uuid PK default gen_random_uuid()
cohort_id     uuid NOT NULL REFERENCES cohorts(id)
course_id     text NOT NULL            -- denormalizado para reporting
tier          text NOT NULL            -- "profesional" | "subgraduado" (texto libre, como users.profession)
nombre        text NOT NULL
email         text NOT NULL            -- SIN unique global
telefono      text
profesion     text                     -- tipo_profesional si aplica
amount_cents  integer                  -- lo cobrado según Stripe
stripe_session_id text NOT NULL UNIQUE -- idempotencia del webhook
paid_at       timestamptz NOT NULL
created_at    timestamptz NOT NULL default now()
UNIQUE (cohort_id, email)              -- no doble registro en la misma cohorte
```

Sin unique global de email: un egresado de Parte 1 (fila en `users`) se registra
en Parte 2 sin choque y sin tocar su historial. Migración `drizzle/00XX_*.sql`
idempotente siguiendo el patrón de `0011_cohort_audience.sql`.

### 3.2 Audiencia nueva `subgraduado`

`ALTER TYPE` del enum de audiencia (migración aparte, idempotente; aplicar en Neon
**antes** del deploy — la audiencia es gate de runtime). Touchpoints conocidos:
`schema.ts` (audienceEnum), `cohorts/audience.ts` (AUDIENCE_LABELS,
enrolleeAudience, visibleAudiences), `admin/cohortes/fields.ts` y `page.tsx`
(selector). Las cohortes existentes no cambian.

### 3.3 Catálogo (`src/lib/courses.ts`)

- `CourseId` += `"parte-2"`; entrada nueva en `COURSES`: `days: 2`, **sin `acpe`**
  (su ausencia ya apaga el copy CE), `level: "avanzado"` (ampliar la unión de
  literales).
- `Tier` += `"subgraduado"`.
- `Pricing` gana el flag **`registrationOnly?: true`**. Lo llevan: todo el pricing
  de `parte-2` y la entrada `subgraduado` de `basic-compounding`.
- Si el env del price no está definido en runtime, esa opción de pricing **no se
  ofrece** en el formulario (así el tier subgraduado queda construido pero
  inactivo hasta que exista `STRIPE_PRICE_ID_BASICO_SUBGRADUADO`).
- Declarar ambos envs en `.env.example`.

## 4. Flujo de inscripción y pago

Reusa el camino profesional existente (checkout directo con datos en metadata, sin
escritura previa en DB). Cambios:

- **Validación** (`inscripcion/schema.ts`): `z.enum` += `"subgraduado"`; el
  `superRefine` que exige `tipo_profesional` sigue aplicando solo a `profesional`.
  Sin campos nuevos para subgraduado.
- **Whitelist de query params** (`inscripcion/page.tsx`): aceptar
  `?tier=subgraduado`.
- **i18n**: claves `inscripcion.tiers.subgraduado.*` en `es.json` y `en.json`
  (label + note) — sin ellas next-intl revienta en runtime.
- **Pre-checks del POST** (`api/inscripcion/route.ts`): para pricing
  `registrationOnly`, el chequeo de duplicado consulta `course_registrations`
  por (cohorte, email) — no `users`. Capacidad: asientos = usuarios comprometidos
  + registros de esa cohorte. Los gates de curso↔cohorte, ventana de fechas y
  audiencia aplican igual que hoy.
- **Metadata del checkout**: añade `registration_only: "1"` explícito (más robusto
  que re-derivar del catálogo en el webhook, y sobrevive a cambios de catálogo
  entre checkout y webhook).

## 5. Webhook de Stripe

En `checkout.session.completed`, **antes** del narrowing actual a
`"profesional" | "student"`: si `metadata.registration_only === "1"` →

1. Insert idempotente en `course_registrations` (`ON CONFLICT (stripe_session_id) DO NOTHING`).
2. Email de confirmación al participante (template nuevo sobre el `_shell.ts`
   compartido: curso, fechas de la cohorte, monto; sin links de portal ni packet
   de bienvenida).
3. Copia/notificación al email admin existente (mismo mecanismo que la
   notificación de matrícula pendiente).
4. `revalidatePath` de landing/cursos (frescura del contador de asientos, igual
   que el flujo actual).
5. `return 200` — **nunca** entra al upsert de `users`.

Fallos de email no revientan el webhook (registro ya persistido); se loguean.

## 6. Superficies públicas

- **`/cursos`** (`CursosGrid` vía `cursosGrid.items` en i18n): dos tarjetas nuevas
  ES+EN — "Parte 2" (`enrollCourseId: "parte-2"`, `noCe: true`, `credentialNote`
  de no-CE) y "Subgraduados" (`courseRef: "basic-compounding"`, CTA con
  `tier=subgraduado`, `noCe: true`). El grid ya alinea footers con `mt-auto`.
- **Homepage** (`CursosHome.tsx`): decisión del founder — las tarjetas nuevas
  **sí** van en la portada. Añadir los dos ids a la lista (hoy hard-codea 3) y
  ajustar el grid para 5 tarjetas (3+2 con wrap).
- El emparejamiento de cohortes abiertas por `courseId + audience` ya funciona;
  las cohortes de subgraduados solo aparecen en la tarjeta de subgraduados.

## 7. Admin

- El form de cohortes se puebla solo desde `COURSES` (cero cambios para el curso
  nuevo); el selector de audiencia gana `subgraduado`.
- Vista nueva simple: **registrados por cohorte** (para cohortes con registros) +
  export CSV. Sin acciones de aprobación — el registro pagado es final.
- El conteo de asientos del admin y de la landing suma `course_registrations`.
- Reembolsos/cancelaciones: manuales vía Stripe + borrado manual del registro
  (fuera de alcance automatizarlo; documentar en el runbook del admin).

## 8. Pre-requisito técnico (PR propio, primero)

`InscripcionForm.tsx:422` resuelve el título del curso por **índice posicional**
(`COURSES.indexOf(c)` contra los items de i18n). Con un segundo curso mostraría el
título equivocado. Cambiar a lookup por id **antes** de añadir `parte-2`, con test
de regresión. (Incidental conocido, no bloqueante: `student-email-allowlist.ts` es
código muerto pero `es.json` aún promete "email institucional".)

## 9. Orden de entrega (PRs pequeños, cada uno off main + preview Vercel)

1. `fix/inscripcion-titulo-por-id` — bug posicional + test RED primero.
2. `feat/course-registrations` — migración tabla + audiencia, flag
   `registrationOnly`, curso `parte-2`, tier `subgraduado`, checkout + webhook +
   emails, tests (unit del branch del webhook, zod, capacidad).
3. `feat/registro-superficies` — tarjetas `/cursos` + homepage + i18n EN/ES.
4. `feat/admin-registros` — vista admin + CSV + asientos.

Migraciones aplicadas en Neon antes del deploy que las usa. Los price IDs se crean
en Stripe (modo live) y se cargan como env vars en Vercel — nunca en código.

## 10. Verificación

- `pnpm build` + vitest en cada PR (regla: tsc/vitest no ven errores build-only).
- Preview de Vercel: flujo completo Parte 2 con price de test → registro en tabla,
  email participante + admin, contador de asientos.
- Diferencial: flujo profesional del curso básico y flujo estudiante siguen
  intactos (regresión).
- Verificar en preview que el tier subgraduado NO se ofrece mientras falte su env.

## 11. Fuera de alcance

- Precio/price ID de subgraduados (pendiente de decisión de negocio).
- Refactor a tabla `enrollments` general (YAGNI — se reevalúa si un curso futuro
  con teoría necesita multi-curso por usuario).
- Automatización de reembolsos; certificados de asistencia; structuredData del
  curso nuevo (se puede añadir luego).
