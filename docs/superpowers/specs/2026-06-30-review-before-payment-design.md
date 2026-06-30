# Matrícula review BEFORE payment — design

**Date:** 2026-06-30
**Status:** Approved (brainstorming), pending implementation plan
**Supersedes the flow ordering in:** `2026-06-02-student-matricula-verification-design.md`

## Problem

The student tier ($495) gates the discounted price on a matrícula photo that
the owner reviews. Today the order is **pay first, review after**: the
enrollment form sends the student straight to Stripe Checkout, and the matrícula
review email to the admin is only sent from the Stripe webhook **after**
`checkout.session.completed`. Rejection therefore requires a 100% refund.

Observed in production (2026-06-30):

- `POST /api/inscripcion` → 200 and `POST /api/inscripcion/matricula-upload` →
  200 — the backend payment path is **not** erroring. Students reach Stripe and
  several land on `/inscripcion/cancelada` (they cancel).
- The runtime-error aggregate shows only auth (magic-link) and certificate
  (WinAnsi) errors — nothing on the inscription/payment path.
- The owner never receives a matrícula review email because that email only
  fires **after a completed payment**, and students are not completing payment.

The comment in `src/lib/portal/notify-matricula-review.ts:26` even claims a
"pre-payment upload" path, but the code only ever runs it from the webhook
(post-payment). Intent and implementation disagree.

**Owner decision:** the review must happen **before** payment, not after.

## Goal

Invert the student-tier flow to: submit matrícula → admin reviews → on approval
the student receives an emailed payment link → student pays. No payment ever
happens before approval, so **rejection needs no refund**. The **profesional
tier is unchanged** (instant checkout; never requires a matrícula).

## Decisions (from brainstorming)

1. **Return-to-pay mechanism:** email with a signed payment link (no login).
2. **On rejection:** a simple rejection email to the student (existing
   template), telling them to contact `info@sccompoundingacademy.com`. The owner
   follows up manually. No automatic profesional-tier offer.
3. **Persistence approach:** reuse the existing `users` row as the pre-payment
   record (Approach A). The table already models this — `paidAt` is nullable and
   verification state is a separate concern.
4. **Legal-acceptance audit trail:** dedicated columns on `users` (Option a),
   requires a small migration.
5. **Payment link validity:** 48 hours from approval, with a self-service
   "resend payment link" button on the expired-link page.

## End-to-end flow

### Student tier (new)

1. Student fills the form and uploads the matrícula photo to Vercel Blob
   (unchanged — `POST /api/inscripcion/matricula-upload`).
2. `POST /api/inscripcion` (student branch) does **not** create a Stripe
   session. It upserts a `users` row:
   `{ tier:'student', paidAt:null, studentVerification:'pending',
   verificationDocUrl, verificationSubmittedAt: now, name, email, phone,
   cohortId, + legal-acceptance columns }`, then fires the admin review email
   (`notifyMatriculaReview`) immediately.
3. Student is redirected to `/inscripcion/revision` (ES) / `/enroll/review`
   (EN): "We received your matrícula. We'll review it and email you to complete
   payment."
4. Admin clicks **Aprobar** / **Rechazar** from the review email (existing
   signed-token machinery).
   - Approve → `applyVerificationDecision` sets `'approved'` → email to student
     **with a signed 48h payment link** (modified approved-email template).
   - Reject → existing simple rejection email.
5. Student clicks the payment link → `GET /api/inscripcion/pagar?token=…`
   validates and 302-redirects to Stripe Checkout.
6. Student pays → webhook `checkout.session.completed` looks up the row by
   `userId` (from session metadata) and **only** stamps `paidAt`,
   `stripeCustomerId`, `stripePaymentIntent`. It does **not** reset verification.
   Confirmation email + welcome packet unchanged.

### Profesional tier (unchanged)

Form → `POST /api/inscripcion` creates a Stripe session → pay → webhook creates
the row as today. Instant.

## Components

### Touched / new files

- `src/app/api/inscripcion/route.ts` — branch student vs profesional. Student:
  upsert pending row + fire admin review email; return `{ pending: true }`
  instead of `{ url }`. Profesional: unchanged.
- `src/app/api/inscripcion/pagar/route.ts` — **new** `GET` endpoint. Verifies
  the checkout token, mints the Stripe session, redirects.
- `src/app/api/webhooks/stripe/route.ts` — student branch: look up row by
  `userId` from metadata, stamp `paidAt` only; do not touch verification.
  Profesional branch unchanged.
- `src/lib/portal/verification-token.ts` — add `signCheckoutToken` /
  `verifyCheckoutToken` (same HMAC-over-`AUTH_SECRET` pattern).
- `src/lib/portal/apply-verification-decision.ts` — approved branch emails the
  student a payment link instead of a plain "approved" notice.
- `src/lib/emails/verificacion.ts` — approved email includes a "Pagar ahora"
  button/link; add an "expired link / resend" email if needed.
- `src/components/marketing/inscripcion/InscripcionForm.tsx` — student tier
  redirects to the review page on `{ pending: true }` instead of to Stripe.
- New pages: `/inscripcion/revision` (+ EN `/enroll/review`) and an
  expired/closed payment-link page with a "resend payment link" action.
- `src/lib/db/schema.ts` + new hand-authored idempotent Drizzle migration — add
  legal-acceptance columns to `users`.
- i18n message catalogs (ES/EN) for the new pages and email copy.

### The payment token

Stateless, mirrors the existing verification token:

```
signCheckoutToken({ userId, approvedAt })  → body.hmac (base64url)
verifyCheckoutToken(token) → { userId, approvedAt } | null
```

`approvedAt` is the row's `verifiedAt` epoch-ms (the approval timestamp set by
`verificationDecisionPatch`), signed in so a later re-decision invalidates old
links.

### `GET /api/inscripcion/pagar?token=…` validation order

1. HMAC signature valid.
2. Row exists, `studentVerification === 'approved'`, `paidAt` is `null`.
3. `now - approvedAt <= 48h`, else → expired-link page (offer resend).
4. Cohort still `openForEnrollment`, else → closed page.

**Note (2026-06-30 integration fix):** step 3 in the original design ("token
`approvedAt` matches the row's `verifiedAt`") is NOT implemented and is
deliberately NOT being implemented. `/pagar` enforces a 48h freshness window
on the token's `approvedAt` plus the live row state (approved + unpaid + cohort
open). Re-decision invalidation comes from the status flip — a rejection makes
`/pagar` refuse at step 2 because `studentVerification !== 'approved'`, not
from a timestamp equality check. The resend route (`/api/inscripcion/reenviar-pago`)
mints a fresh 48h window via `approvedAt: Date.now()` rather than re-using the
stale `row.verifiedAt`, which would immediately expire the resent link.

On success: create the Stripe Checkout Session with `STRIPE_PRICE_ID_STUDENT`,
put `userId` in session metadata, 302 to `session.url`.

### Pre-payment upsert details

- Email normalized to lowercase (match Auth.js `normalizeIdentifier`).
- `ON CONFLICT (email) DO UPDATE` handles "signed into portal first" and
  "re-submitted the form" cases.
- **Guard:** if the existing row already has `paidAt` set, do not reset to
  pending — return a "you're already enrolled" message.
- `verificationSubmittedAt` set here (the admin review token binds to it —
  identical to today, just earlier in the flow).
- Legal-acceptance columns (`aceptoTimestamp`, `aceptoIp`, `aceptoUserAgent`,
  `aceptoVersionDocs`) captured at submit time, server-side.

### Migration

Add to `users` (hand-authored, idempotent — `ADD COLUMN IF NOT EXISTS`, per the
repo's Drizzle migration rule; do **not** run `pnpm db:generate`):

- `acepto_timestamp` (timestamptz, null)
- `acepto_ip` (text, null)
- `acepto_user_agent` (text, null)
- `acepto_version_docs` (text, null)

All nullable — existing rows and the profesional tier leave them null.

## Error handling

- Pre-payment upsert failure → surface a retryable error to the student; nothing
  charged, safe to retry.
- Admin review email send failure → logged, not thrown (the row is `pending` and
  reviewable; same best-effort policy as today).
- Payment-link endpoint: every failed precondition routes to a friendly page
  (expired / already paid / cohort closed), never a raw 500.
- Webhook student-tier lookup miss (row gone) → ops alert + 200 (no Stripe
  retry storm), same pattern as the existing bad-metadata path.

## Testing (Vitest, repo patterns)

- `signCheckoutToken` / `verifyCheckoutToken`: valid/invalid signature, 48h
  expiry boundary, `approvedAt` binding.
- `/api/inscripcion/pagar`: rejects not-approved, already-paid, cohort-closed,
  expired token; accepts the happy path and redirects.
- `/api/inscripcion` student branch: creates pending row + fires admin email;
  does **not** create a Stripe session; profesional branch still returns a URL.
- Webhook: student stamps `paidAt` without touching verification; profesional
  unchanged.
- Migration is idempotent (safe to re-run).

## Out of scope (YAGNI)

- No automatic profesional-tier offer on rejection.
- No formal seat/cohort hold during review.
- No in-portal "Pagar" button (email link only, per decision 1).

## Open follow-ups (not blocking)

- Fix the stale "pre-payment upload" comment in `notify-matricula-review.ts`.
- Consider dropping the unused post-payment review path once this ships.
