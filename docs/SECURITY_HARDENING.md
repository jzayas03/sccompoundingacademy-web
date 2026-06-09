# Backend hardening — enrollment & Stripe

This document describes the abuse / resilience protections added around the
enrollment flow, and the **one-time setup** needed to switch each one on.

Everything ships **degraded-gracefully**: with none of the env vars below
set, the app behaves exactly as before (enrollment works, protections are
simply inactive). Each protection activates the moment its env vars exist —
so deploying the code can never break a real enrollment.

---

## What was added

| Protection | Where | Activates when |
|---|---|---|
| **Per-IP rate limiting** (Upstash Redis) | `/api/inscripcion`, `/api/contact` | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` set |
| **CAPTCHA** (Cloudflare Turnstile) | enrollment form + `/api/inscripcion` | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` set |
| **Webhook idempotency** (no duplicate emails on Stripe replays) | `/api/webhooks/stripe` | DB migration `0007` applied |
| **Ops failure alerts** (email on "paid but DB write failed") | `/api/webhooks/stripe` | `RESEND_API_KEY` set (already is) |
| **Stripe Radar** (card-testing defense) | Stripe dashboard | configured in dashboard (no code) |

A note on the threat model: Stripe transactions themselves **cannot be
"intercepted"** — the card data never touches our server (the student pays
on Stripe's hosted page) and the webhook is already protected by mandatory
signature verification (`STRIPE_WEBHOOK_SECRET`), so a forged "paid" event
is rejected. The real risks these protections address are: (1) bots
spamming the checkout-creation endpoint, (2) attackers using our checkout to
test stolen cards, and (3) silent failures that leave a paying student
locked out of the portal.

---

## Setup checklist

### 1. Apply the database migration (enables webhook dedup)

The dedup ledger table is created by `drizzle/0007_webhook_event_dedup.sql`.
It is hand-authored and idempotent (safe to re-run), matching the 0005/0006
convention — **do not** run `pnpm db:generate`. Apply it directly against
the production database:

```
psql "$DATABASE_URL" -f drizzle/0007_webhook_event_dedup.sql
```

(`DATABASE_URL` is the Neon connection string from Vercel → Storage.)

### 2. Provision Upstash Redis (enables rate limiting)

In the Vercel dashboard:

```
Vercel → your project → Storage (or Marketplace) → Upstash → Redis → Create
```

Connect it to the project. Vercel auto-injects `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` into all environments. Redeploy. Done — the free
tier covers this traffic comfortably.

Current limits (tune in code if needed):
- enrollment: **8 requests / minute / IP**
- contact:    **5 requests / minute / IP**

### 3. Create a Cloudflare Turnstile widget (enables CAPTCHA)

```
https://dash.cloudflare.com → Turnstile → Add widget
  - Domain:  sccompoundingacademy.com   (the apex)
  - Mode:    Managed (recommended — invisible for most users)
```

Copy the two keys into Vercel env vars (Production + Preview):
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = the **Site Key** (public)
- `TURNSTILE_SECRET_KEY` = the **Secret Key** (server-only)

Redeploy. The widget then renders on the enrollment form and the server
rejects submissions without a valid token.

### 4. Harden Stripe Radar (card-testing defense — dashboard only)

In the Stripe dashboard (no code):

1. **Radar → Rules.** Radar runs by default on Stripe Checkout. Add rules:
   - `Block if :risk_level: = 'highest'`
   - `Block if :cvc_check: = 'fail'`
   - Review/3DS for elevated risk: `Request 3D Secure if :risk_level: = 'elevated'`
2. **Radar → Lists.** Optionally block IPs/emails seen card-testing.
3. **Settings → Radar.** Enable "Block payments if CVC verification fails"
   and "Block payments if postal code verification fails" if your cards
   collect those.
4. **Rate-limit at Stripe too:** Stripe automatically rate-limits the
   payment surface, but the app-side Upstash limit (step 2) stops the
   Checkout Session from even being created, which is the cheaper guard.

Radar's free tier covers basic rules; Radar for Fraud Teams ($0.07/txn)
adds advanced rules and the rule editor UI — not needed at current volume.

---

## How the resilience pieces behave under failure

- **Upstash down / not configured** → rate limiting *fails open* (requests
  pass). A flaky limiter never blocks a paying student.
- **Cloudflare down** → Turnstile verification *fails open* (after a 5s
  timeout). The IP rate limit remains as a backstop.
- **Portal DB down during webhook** → the user upsert fails, but Airtable +
  confirmation email still go out, an **ops alert email** fires, and the
  idempotency claim is **released** so a manual "resend" from the Stripe
  dashboard reprocesses the event and heals the DB once it's back.
- **Stripe sends a duplicate event** → the idempotency ledger short-circuits
  it; the confirmation email is sent exactly once.
