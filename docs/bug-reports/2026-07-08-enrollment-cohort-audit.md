# Bug report — enrollment/cohort flow audit (2026-07-08)

Adversarial audit of the full enrollment/cohort flow: inscription form + API,
Stripe checkout + webhook, seat counting + public meters, and the admin panel.
Method: 4 parallel bug-finders (one lens each), every serious claim then
independently verified by an adversarial reviewer instructed to refute it.
Only CONFIRMED findings are listed as defects; refuted/downgraded claims are
noted at the end.

## Critical

### C1 — Webhook idempotency claim can permanently swallow a payment
`src/app/api/webhooks/stripe/route.ts:117-121` inserts the event into
`processedStripeEvents` BEFORE any processing; only two catch blocks
(`:258-268`, `:356-362`) release the claim on failure. `getCohort` (`:134`) is
an unwrapped live DB read — a transient Neon failure throws, returns 500,
Stripe retries, and the retry short-circuits on the held claim (`:122`) → the
student paid but is never marked paid, permanently, with no ops alert.
Post-stamp throws (`recordInscripcion` `:410` — `airtable.ts:65` fetch rejects
on network error; `notifyMatriculaReview` `:386`) lose only the emails but
also hold the claim forever.
**Fix:** wrap the entire post-claim body so ANY throw releases the claim and
returns 500 (Stripe retries then re-process cleanly).

### C2 — Student pay-link flow has NO capacity check anywhere (uncapped oversell)
The profesional path has a pay-time guard (`route.ts:297-310`), but the student
path has none at any of its four stages: the enrollment POST writes the pending
row unconditionally (`route.ts:196-262`), admin approval doesn't check
(`apply-verification-decision.ts`), `createStudentCheckoutSession` checks only
`openForEnrollment` (`checkout.ts:57-67`), and the webhook stamps without
re-checking (`route.ts:238-279`). N approved students can all pay into a full
cohort of a physical-seat course.
**Fix:** capacity guard in `createStudentCheckoutSession` (the single
chokepoint every student payment funnels through).

### C3 — Webhook re-stamps `cohortId` from session metadata, reverting admin moves
Both webhook paths write `cohortId` from checkout metadata with no freshness
check (`webhook-user.ts:60-68` via `route.ts:244`; Path B `:339`). If an admin
moves a student to another cohort (the `changeCohort` control) while the
student's checkout session is open (~24h Stripe session lifetime), completing
payment silently reverts the move.
**Fix:** drop `cohortId` from `studentPaidUpdate` — the pre-payment row already
carries the authoritative cohort; stamp-by-id needs only `paidAt` +
`stripeCustomerId`. (Path B legitimately owns the buyer's selection; unchanged.)

## Important

### I1 — Profesional path lacks a duplicate-payment pre-check
The student path 409s if already paid (`route.ts:217-228`); the profesional
path creates a new Checkout Session with no check (`:264-333`), and the
webhook's `onConflictDoUpdate` on email (`:325-343`) then overwrites the same
person's row (`tier`, `cohortId`, `paidAt`, …). Concrete harms: double charge;
a prior enrollment's tier/cohort silently mutated.
**Fix:** mirror the student pre-check (SELECT paidAt by lowercased email → 409).

### I2 — `deleteCohort` can orphan pending/approved-unpaid students
`users.cohortId` has no FK (`schema.ts:70`); the delete guard
(`cohortes/actions.ts:82-85`) counts only PAID enrollees, but the student POST
stamps `cohortId` pre-payment (`route.ts:199-236`). Deleting such a cohort
orphans the reference; when the student later pays, `course-access.ts` fails
open (`cohortEndDate: null` → access active indefinitely), silently.
**Fix:** the delete guard must count ANY user row referencing the cohort,
paid or not.

### I3 — `updateUserEmail` "empty duplicate" deletion discards in-flight verification
`admin/actions.ts:162`: `isEmptyDuplicate = !paidAt && !quiz && !cert` ignores
`verificationDocUrl`/`verificationSubmittedAt`/`studentVerification`. A
duplicate account with a pending matrícula submission is "empty" by that test
and gets cascade-deleted, silently discarding the student's submitted document.
**Fix:** treat any verification activity as non-empty (refuse + manual review).

### I4 — Orphaned identity-document blobs on server-side rejection
`InscripcionForm.tsx:201-233` uploads the matrícula photo to Vercel Blob BEFORE
the POST; every server rejection path (rate limit, Turnstile, invalid/closed
cohort, audience mismatch, duplicate 409, insert failure) leaves the blob
orphaned — PII with no DB reference and no cleanup path (only the
approve/reject flow ever calls `del()`).
**Fix (follow-up PR):** best-effort server-side `del()` on rejection paths
(validating the URL belongs to our store), or a scheduled sweep.

### I5 — API error messages are Spanish-only for EN users
`route.ts` returns hardcoded ES strings on ~12 failure paths (rate limit,
Turnstile, closed/full cohort, duplicate, Stripe errors…); only the
audience-mismatch and Zod-validation messages are locale-aware, and the form
renders `json.error` verbatim.
**Fix (follow-up PR):** route all errors through a locale-aware table like the
existing `inscripcionErrorMessage` pattern.

### I6 — Bad-metadata webhook branch holds the claim, blocking dashboard resend
`route.ts:135-152` returns 200 without releasing the claim. The ops alert does
fire (mitigating), but a Stripe-dashboard resend — the natural recovery — is
swallowed by the held claim.
**Fix:** release the claim before returning in that branch.

## Minor (surgical fixes bundled)

- **M1** — `notifyMatriculaReview`'s pre-email code (`getSiteUrl`, template
  build) is outside its try/catch; a throw after the DB commit makes the API
  return 500 "no pudimos registrar" although the row persisted
  (`route.ts:247-253`, `notify-matricula-review.ts:42-61`). Fix: wrap the call.
- **M2** — Admin "Cupos disponibles" stat clamps once at the end instead of
  per-cohort (`admin/page.tsx:169-174`): an oversold cohort's deficit eats
  other cohorts' displayed availability. Fix: per-cohort `Math.max(0, …)`.
- **M3** — `changeCohort` doesn't independently verify the student is paid
  (relies on the roster filter) and its read-then-write capacity check has no
  acknowledging comment. Fix: add the check + comment.

## Noted, not fixed here (product decisions / accepted)

- `updateCohort` allows shrinking capacity below paid count / changing audience
  under enrollees — compensating clamps exist; optional admin-UI warning.
- Force-oversell is invisible outside the raw cohort list (0-clamped meters).
- `/cursos` shows a full-but-open cohort with an active CTA.
- No date-based auto-close: a past cohort left open keeps being "featured".
- `telefono` accepts non-digits (schema allows any 7-40 chars).
- Pay-time capacity TOCTOU on the profesional path — acknowledged in code.

## Refuted / downgraded by verification

- "Second purchase clobbers a DIFFERENT student's enrollment" — no; the upsert
  targets the same person's row (still harmful, see I1, but scoped).
- Client/server audience-gate divergence — unreachable (client blocks submit).
- Cohort-dropdown stale-`cohorteId` POST — reset logic verified correct.
- Cross-row state bleed in AdminChangeCohort/AdminEditEmail — each row is an
  isolated component instance.
- i18n message keys — all present in both locales.
- Tier fallback (`hasDiscount`) misclassification — unreachable from this
  codebase's flows.
