# Deploy runbook — Matrícula review BEFORE payment (PR #96)

Switches the **student tier** from pay-first to review-before-payment. Profesional tier is unchanged. No new env vars required (reuses `AUTH_SECRET`, `STRIPE_PRICE_ID_STUDENT`, `RESEND_API_KEY`, `ADMIN_EMAILS`/`EMAIL_REPLY_TO`, `BLOB_READ_WRITE_TOKEN`).

## 1. Pre-merge — apply the migration (Neon, production DB)

Run in the Neon SQL Editor (idempotent, nullable columns — safe to run before merging; the current code ignores them):

```sql
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "acepto_timestamp" timestamp;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "acepto_ip" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "acepto_user_agent" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "acepto_version_docs" text;
```

Verify (expect 4 rows):

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user' AND column_name LIKE 'acepto_%' ORDER BY 1;
```

## 2. Merge PR #96 → Vercel auto-deploys `main` to production

Wait for the production deployment to reach **READY** before testing.

## 3. Smoke test the new flow end-to-end (production)

Use a real email you control + a Stripe **live** card you can refund, or do it as a real enrollment.

- [ ] Student enrollment + matrícula photo → lands on **/inscripcion/revision** (NOT Stripe).
- [ ] Admin review **email arrives** (to `ADMIN_EMAILS`) with the photo (signed URL) + Aprobar/Rechazar.
- [ ] **Approve** → student receives the **"Pagar ahora"** email with the 48h link.
- [ ] Click the pay link → reaches **Stripe Checkout** ($495 student price).
- [ ] Complete payment → portal **unlocks** (`paidAt` set), confirmation email + welcome packet arrive, and **NO** "Pago recibido con metadata inválida" ops alert fires. *(This is the C-1 path — the most important check.)*
- [ ] **Reject** a test submission → student gets the rejection email; **no charge**.
- [ ] **Expired/closed link** → `/inscripcion/pago-cerrado`; the **resend** form emails a fresh working link.
- [ ] **Profesional** tier still goes straight to Stripe (unchanged).

## 4. Rollback (if needed)

Code is safe to roll back: the migration columns are additive + nullable, so the previous deployment ignores them.

- Vercel → Deployments → the prior production deploy → **Instant Rollback**.
- No DB rollback needed (leave the columns; they're harmless).

## Notes

- The matrícula-upload fix (private Blob store, #95) is already live and is included here (this branch was rebased onto it) — merging does not revert it.
- Known minor follow-ups (non-blocking): student pay-flow emails are ES-only; an EN user hitting the resend lands on the `/es/` pago-cerrado page.
