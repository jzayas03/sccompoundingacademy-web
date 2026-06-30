# Task 4 Report — Student Branch of POST /api/inscripcion

## Status: COMPLETE

## Commit
`132bda2` — feat(inscripcion): student tier persists pending row + admin review, no pre-payment Stripe session

## Files changed
| File | Change |
|---|---|
| `src/app/api/inscripcion/route.ts` | Added 4 imports + 56-line student short-circuit block |
| `src/lib/inscripcion/pending-enrollment.ts` | **New** — pure helper `buildPendingStudentValues` |
| `tests/unit/pending-enrollment.test.ts` | **New** — 9 unit tests for the helper |
| `tests/unit/inscripcion-idempotency.test.ts` | Added `server-only` + stripe + notify mocks (route's new transitive deps) |

## What was built

### Helper extraction (diverges from brief's inline approach — preferred)
`src/lib/inscripcion/pending-enrollment.ts` exports `buildPendingStudentValues(input)` returning:
- `insertValues` — fields for the DB `INSERT` (email lowercased, tier="student", studentVerification="pending", paidAt absent, full audit trail)
- `conflictSet` — `ON CONFLICT DO UPDATE` set, including the Drizzle `sql` CASE expression that preserves an existing "approved" status and clears verifiedAt/rejectedAt on re-submit

The route calls this helper, then performs the DB upsert, 409 guard, and `notifyMatriculaReview`.

### Route change
After the BLOB_URL_RE check and `acceptedAt`/`userAgent` capture, a `if (data.tier === "student")` block short-circuits:
1. Calls `buildPendingStudentValues` to get insert/conflict values
2. `db.insert(users).values(...).onConflictDoUpdate(...).returning(...)` — upserts the pending row
3. If `row.paidAt` is set → 409 "already enrolled" guard
4. `notifyMatriculaReview(...)` — fires admin review email
5. Returns `{ pending: true }` (HTTP 200)
6. Profesional tier falls through to the unchanged Stripe session block

## Test evidence
```
RED baseline: n/a — helper did not exist before (pure new extraction; no route handler test needed per brief)
GREEN: 9/9 tests in pending-enrollment.test.ts PASS
Full suite: 132/132 tests across 27 files PASS
```

Assertions verified: email lowercase, tier="student", studentVerification="pending", paidAt undefined, audit fields mapped through, userAgent truncated to 480, conflictSet has truthy SQL expression, conflictSet clears verifiedAt/rejectedAt.

## Build
`pnpm typecheck` — no errors  
`pnpm build` — succeeded; `/api/inscripcion` listed as dynamic ƒ route

## Side-effect fix
`inscripcion-idempotency.test.ts` broke because the route now transitively imports `server-only` via `notifyMatriculaReview`. Added `vi.mock("server-only", ...)` + stripe + notify mocks. Its 4 tests remain GREEN.

## Concerns
None. The `paidAt` 409 guard is intentional: once a student pays after approval, resubmitting a matrícula returns a 409 rather than silently overwriting the paid row with a new pending state.

---

## Review fixes (2026-06-30)

### I-1 — data-corruption guard (pre-check before upsert)
`src/app/api/inscripcion/route.ts`: Added a `db.select({ id, paidAt }).from(users).where(eq(users.email, ...)).limit(1)` pre-check **before** the `onConflictDoUpdate` upsert. If the row exists and `paidAt` is set, returns 409 immediately without touching any columns. The post-upsert `row?.paidAt` 409 branch was removed (now dead); replaced by a defensive `if (!row) return 500` on the upsert result. Also added `import { eq } from "drizzle-orm"`.

### I-2 — route handler test
`tests/unit/inscripcion-student-branch.test.ts` (new file, 2 tests):
- Student, no paid row → `{ pending: true }`, `stripe().checkout.sessions.create` NOT called, `notifyMatriculaReview` called once.
- Student, paid row → HTTP 409, `db.insert` NOT called, `notifyMatriculaReview` NOT called.
Uses `vi.hoisted` for mock handles, same mock list pattern as `inscripcion-idempotency.test.ts`.

### M-1 — stronger test 8 in pending-enrollment.test.ts
Replaced `toBeTruthy()` on `conflictSet.studentVerification` with a walk over `node.queryChunks`: filters to `StringChunk` objects (those whose `.value` is an array), flattens to strings, asserts any string includes `"approved"`. Avoids circular-reference crash that `JSON.stringify` would hit on Column/Table chunks.

### M-2 — JSDoc updated
`src/app/api/inscripcion/route.ts` header comment rewritten to describe both paths (student → pending DB row + admin email, no Stripe; profesional → Stripe session, no pre-payment DB write).

## Verification (2026-06-30)
```
npx vitest run tests/unit/pending-enrollment.test.ts tests/unit/inscripcion-idempotency.test.ts tests/unit/inscripcion-student-branch.test.ts
  15 passed (15) — 3 files
npx vitest run
  134 passed (134) — 28 files
pnpm typecheck
  no errors
```
