# Matrícula Review Before Payment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Invert the student-tier enrollment flow so the matrícula is reviewed *before* payment — on approval the student gets an emailed 48-hour payment link — removing the pay-first / refund-on-reject model. The profesional tier is unchanged.

**Architecture:** Reuse the existing `users` row as the pre-payment record (`paidAt` is already nullable). The student-tier `POST /api/inscripcion` upserts a pending row and emails the admin for review instead of creating a Stripe session. A new signed checkout token (same HMAC-over-`AUTH_SECRET` pattern as the existing approve/reject token) is emailed to the student on approval; a new `GET /api/inscripcion/pagar` endpoint validates it and mints the Stripe Checkout Session. The webhook, for student tier, only stamps `paidAt` on the existing row.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Drizzle ORM (Postgres/Neon), Stripe, Resend, Vitest, next-intl.

## Global Constraints

- Hand-author idempotent Drizzle migrations (`ADD COLUMN IF NOT EXISTS`). Do **NOT** run `pnpm db:generate` (stale journal → conflicting migrations).
- Stripe Price IDs come from env at request time: `STRIPE_PRICE_ID_STUDENT`, `STRIPE_PRICE_ID_PROFESIONAL`. Never hardcode.
- Signed-link HMAC is keyed on `AUTH_SECRET` (`createHmac("sha256", AUTH_SECRET)`), base64url `body.sig` format. Reuse the pattern in `src/lib/portal/verification-token.ts`.
- Emails go through Resend; a send failure is logged, never thrown (best-effort) — the DB row is the source of truth.
- App-router page directory names must be ASCII; Spanish-native public URLs come from the next-intl `pathnames` map in `src/i18n/routing.ts`.
- Email normalized to lowercase before any `users` upsert/lookup (match Auth.js `normalizeIdentifier`).
- Payment link validity: **48 hours** from approval.
- Profesional tier behavior is unchanged in every task.

---

## File Structure

- `drizzle/0008_legal_acceptance.sql` — **new** migration: 4 nullable audit columns on `user`.
- `src/lib/db/schema.ts` — **modify**: declare the 4 new columns on `users`.
- `src/lib/portal/verification-token.ts` — **modify**: add `signCheckoutToken` / `verifyCheckoutToken`.
- `src/lib/emails/verificacion.ts` — **modify**: add `buildCheckoutLinkEmail(locale, payUrl)`.
- `src/lib/portal/apply-verification-decision.ts` — **modify**: on approval, branch on `paidAt` — unpaid → send pay-link email; paid → existing approved email.
- `src/lib/inscripcion/checkout.ts` — **new**: `createStudentCheckoutSession(userId)` helper (shared Stripe session builder).
- `src/app/api/inscripcion/route.ts` — **modify**: student branch upserts pending row + admin email, returns `{ pending: true }`; profesional branch unchanged.
- `src/app/api/inscripcion/pagar/route.ts` — **new**: `GET` endpoint; validate token → mint session → redirect.
- `src/app/api/webhooks/stripe/route.ts` — **modify**: student branch looks up by `userId` and stamps `paidAt` only.
- `src/components/marketing/inscripcion/InscripcionForm.tsx` — **modify**: student tier redirects to review page on `{ pending: true }`.
- `src/app/[locale]/(marketing)/inscripcion/revision/page.tsx` — **new**: "we received your matrícula" page.
- `src/app/[locale]/(marketing)/inscripcion/pago-cerrado/page.tsx` — **new**: expired/closed/already-paid page + "resend payment link" form.
- `src/app/api/inscripcion/reenviar-pago/route.ts` — **new**: resend a fresh 48h link if row is approved + unpaid + cohort open.
- `src/i18n/routing.ts` — **modify**: add `pathnames` for the two new pages.
- `messages/es.json`, `messages/en.json` — **modify**: copy for new pages.

---

### Task 1: Migration — legal-acceptance columns on `users`

**Files:**
- Create: `drizzle/0008_legal_acceptance.sql`
- Modify: `src/lib/db/schema.ts:88-91` (insert columns before `createdAt`)

**Interfaces:**
- Produces: `users.aceptoTimestamp` (Date|null), `users.aceptoIp` (string|null), `users.aceptoUserAgent` (string|null), `users.aceptoVersionDocs` (string|null).

- [ ] **Step 1: Write the migration SQL**

Create `drizzle/0008_legal_acceptance.sql`:

```sql
-- Legal-acceptance audit trail, captured at matrícula submit time (student
-- tier now persists this BEFORE payment; profesional leaves it null and the
-- webhook path no longer needs it). Idempotent — safe to re-run.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "acepto_timestamp" timestamp;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "acepto_ip" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "acepto_user_agent" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "acepto_version_docs" text;
```

- [ ] **Step 2: Declare the columns in schema.ts**

In `src/lib/db/schema.ts`, insert before `createdAt:` (line ~91):

```ts
  /** Legal-acceptance audit trail, captured server-side at matrícula submit
   * (student tier) or checkout (profesional). All nullable. */
  aceptoTimestamp: timestamp("acepto_timestamp", { mode: "date" }),
  aceptoIp: text("acepto_ip"),
  aceptoUserAgent: text("acepto_user_agent"),
  aceptoVersionDocs: text("acepto_version_docs"),
```

- [ ] **Step 3: Apply the migration locally and verify it parses**

Run: `pnpm drizzle-kit migrate` (or the repo's migrate script — check `package.json` scripts; do NOT run `db:generate`).
Expected: migration `0008_legal_acceptance` applied, no error.

- [ ] **Step 4: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: PASS (no type errors from the new columns).

- [ ] **Step 5: Commit**

```bash
git add drizzle/0008_legal_acceptance.sql src/lib/db/schema.ts
git commit -m "feat(db): legal-acceptance audit columns on user (pre-payment capture)"
```

---

### Task 2: Checkout token (sign/verify)

**Files:**
- Modify: `src/lib/portal/verification-token.ts` (append new functions)
- Test: `src/lib/portal/verification-token.test.ts` (create or extend)

**Interfaces:**
- Consumes: `AUTH_SECRET` env, the existing `hmac()` / `signingSecret()` helpers in the same file.
- Produces:
  - `signCheckoutToken(p: { userId: string; approvedAt: number }): string`
  - `verifyCheckoutToken(token: string): { userId: string; approvedAt: number } | null`

- [ ] **Step 1: Write the failing test**

Create/extend `src/lib/portal/verification-token.test.ts`:

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { signCheckoutToken, verifyCheckoutToken } from "./verification-token";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-please-ignore";
});

describe("checkout token", () => {
  it("round-trips a valid payload", () => {
    const token = signCheckoutToken({ userId: "u1", approvedAt: 1_700_000_000_000 });
    expect(verifyCheckoutToken(token)).toEqual({
      userId: "u1",
      approvedAt: 1_700_000_000_000,
    });
  });

  it("rejects a tampered signature", () => {
    const token = signCheckoutToken({ userId: "u1", approvedAt: 1 });
    const tampered = token.slice(0, -2) + (token.endsWith("a") ? "bb" : "aa");
    expect(verifyCheckoutToken(tampered)).toBeNull();
  });

  it("rejects a malformed token", () => {
    expect(verifyCheckoutToken("nodot")).toBeNull();
    expect(verifyCheckoutToken("")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/portal/verification-token.test.ts`
Expected: FAIL — `signCheckoutToken is not a function`.

- [ ] **Step 3: Implement the functions**

Append to `src/lib/portal/verification-token.ts`:

```ts
/**
 * Signed token for the student's "pay now" link, emailed on approval. Same
 * stateless HMAC scheme as the admin decision token. `approvedAt` is the
 * row's `verifiedAt` epoch-ms — signed in so a later re-decision (which
 * changes `verifiedAt`) invalidates old links. The 48h expiry is enforced
 * by the consuming endpoint against `approvedAt`, not here.
 */
export type CheckoutTokenPayload = {
  userId: string;
  approvedAt: number;
};

export function signCheckoutToken(payload: CheckoutTokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = hmac(body).toString("base64url");
  return `${body}.${sig}`;
}

export function verifyCheckoutToken(token: string): CheckoutTokenPayload | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = hmac(body).toString("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const p = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as CheckoutTokenPayload;
    if (
      typeof p.userId === "string" &&
      p.userId.length > 0 &&
      typeof p.approvedAt === "number"
    ) {
      return p;
    }
    return null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/portal/verification-token.test.ts`
Expected: PASS (all three cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/portal/verification-token.ts src/lib/portal/verification-token.test.ts
git commit -m "feat(inscripcion): signed checkout token for emailed pay link"
```

---

### Task 3: Shared student checkout-session helper

**Files:**
- Create: `src/lib/inscripcion/checkout.ts`
- Test: `src/lib/inscripcion/checkout.test.ts`

**Interfaces:**
- Consumes: `stripe()` from `@/lib/stripe`, `getSiteUrl()` from `@/lib/siteUrl`, `users`/`db`, `getCourseById`/`getPricingByTier` from `@/lib/courses`, `getCohort` from `@/lib/cohorts`.
- Produces:
  - `type CheckoutOutcome = { ok: true; url: string } | { ok: false; reason: "not-found" | "already-paid" | "not-approved" | "cohort-closed" | "no-price" | "stripe-error" }`
  - `createStudentCheckoutSession(userId: string): Promise<CheckoutOutcome>`

This helper is the single place that turns an approved, unpaid student row into a Stripe Checkout URL. Both `/api/inscripcion/pagar` and `/api/inscripcion/reenviar-pago` build on its preconditions.

- [ ] **Step 1: Write the failing test**

Create `src/lib/inscripcion/checkout.test.ts`. Mock `db`, `stripe`, `getCohort`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const selectChain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
vi.mock("@/lib/db", () => ({ db: { select: () => ({ from: () => ({ where: () => ({ limit: () => mockRows }) }) }) } }));
vi.mock("@/lib/cohorts", () => ({ getCohort: vi.fn() }));
vi.mock("@/lib/stripe", () => ({
  stripe: () => ({ checkout: { sessions: { create: vi.fn().mockResolvedValue({ url: "https://stripe.test/sess" }) } } }),
}));
vi.mock("@/lib/siteUrl", () => ({ getSiteUrl: () => "https://sccompoundingacademy.com" }));

let mockRows: unknown[] = [];
import { createStudentCheckoutSession } from "./checkout";
import { getCohort } from "@/lib/cohorts";

beforeEach(() => {
  process.env.STRIPE_PRICE_ID_STUDENT = "price_student_test";
  mockRows = [];
  vi.mocked(getCohort).mockReset();
});

const approvedRow = {
  id: "u1", email: "a@b.com", tier: "student", paidAt: null,
  studentVerification: "approved", verifiedAt: new Date(), cohortId: "c1",
  curso_id: "basic-compounding",
};

it("returns not-found when the row is missing", async () => {
  mockRows = [];
  expect((await createStudentCheckoutSession("u1")).ok).toBe(false);
});

it("rejects an unapproved row", async () => {
  mockRows = [{ ...approvedRow, studentVerification: "pending" }];
  const r = await createStudentCheckoutSession("u1");
  expect(r).toEqual({ ok: false, reason: "not-approved" });
});

it("rejects an already-paid row", async () => {
  mockRows = [{ ...approvedRow, paidAt: new Date() }];
  const r = await createStudentCheckoutSession("u1");
  expect(r).toEqual({ ok: false, reason: "already-paid" });
});

it("rejects a closed cohort", async () => {
  mockRows = [approvedRow];
  vi.mocked(getCohort).mockResolvedValue({ id: "c1", courseId: "basic-compounding", openForEnrollment: false } as never);
  const r = await createStudentCheckoutSession("u1");
  expect(r).toEqual({ ok: false, reason: "cohort-closed" });
});

it("mints a session for the happy path", async () => {
  mockRows = [approvedRow];
  vi.mocked(getCohort).mockResolvedValue({ id: "c1", courseId: "basic-compounding", openForEnrollment: true } as never);
  const r = await createStudentCheckoutSession("u1");
  expect(r).toEqual({ ok: true, url: "https://stripe.test/sess" });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/inscripcion/checkout.test.ts`
Expected: FAIL — module `./checkout` not found.

- [ ] **Step 3: Implement the helper**

Create `src/lib/inscripcion/checkout.ts`:

```ts
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/siteUrl";
import { getCohort } from "@/lib/cohorts";
import { getCourseById, getPricingByTier } from "@/lib/courses";

export type CheckoutOutcome =
  | { ok: true; url: string }
  | {
      ok: false;
      reason:
        | "not-found"
        | "already-paid"
        | "not-approved"
        | "cohort-closed"
        | "no-price"
        | "stripe-error";
    };

/**
 * Turn an approved, unpaid student row into a Stripe Checkout URL. The single
 * place that enforces the pre-payment preconditions: row exists, student tier,
 * verification approved, not yet paid, cohort still open. The 48h token expiry
 * is enforced by the CALLER (it owns the signed token); this function only
 * checks DB state. `userId` travels in session metadata so the webhook can
 * find this exact row.
 */
export async function createStudentCheckoutSession(
  userId: string,
): Promise<CheckoutOutcome> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      paidAt: users.paidAt,
      studentVerification: users.studentVerification,
      cohortId: users.cohortId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return { ok: false, reason: "not-found" };
  if (row.paidAt) return { ok: false, reason: "already-paid" };
  if (row.studentVerification !== "approved")
    return { ok: false, reason: "not-approved" };

  const cohort = row.cohortId ? await getCohort(row.cohortId) : undefined;
  if (!cohort || !cohort.openForEnrollment)
    return { ok: false, reason: "cohort-closed" };

  const course = getCourseById(cohort.courseId);
  const pricing = course && getPricingByTier(course, "student");
  const stripePriceId = pricing && process.env[pricing.stripePriceEnvKey];
  if (!stripePriceId) {
    console.error("[pagar] STRIPE_PRICE_ID_STUDENT not configured");
    return { ok: false, reason: "no-price" };
  }

  const origin = getSiteUrl();
  // Locale isn't stored on the row; default to ES success/cancel paths.
  const successUrl = `${origin}/es/inscripcion/exito?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/es/inscripcion/cancelada`;

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      allow_promotion_codes: true,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer_email: row.email ?? undefined,
      metadata: { user_id: row.id, tier: "student" },
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_intent_data: { receipt_email: row.email ?? undefined },
      locale: "es",
    });
    if (!session.url) return { ok: false, reason: "stripe-error" };
    return { ok: true, url: session.url };
  } catch (err) {
    const e = err as { type?: string; code?: string; message?: string };
    console.error("[pagar] Stripe error", { type: e?.type, code: e?.code, message: e?.message });
    return { ok: false, reason: "stripe-error" };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/inscripcion/checkout.test.ts`
Expected: PASS (all five cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/inscripcion/checkout.ts src/lib/inscripcion/checkout.test.ts
git commit -m "feat(inscripcion): createStudentCheckoutSession helper with pre-payment guards"
```

---

### Task 4: Student branch of `POST /api/inscripcion`

**Files:**
- Modify: `src/app/api/inscripcion/route.ts:181-312` (the post-validation section)
- Test: `src/app/api/inscripcion/route.test.ts` (extend if present, else create)

**Interfaces:**
- Consumes: existing validated `data`, `course`, `cohort`, `ip`, `userAgent`, `acceptedAt`; `notifyMatriculaReview` from `@/lib/portal/notify-matricula-review`; `db`/`users`.
- Produces: for student tier, JSON `{ pending: true }` (HTTP 200) and a pending `users` row; for profesional tier, the existing `{ url }` response (unchanged).

- [ ] **Step 1: Write the failing test**

In `src/app/api/inscripcion/route.test.ts`, add a student-tier case asserting the response is `{ pending: true }` and that **no** Stripe session is created (mock `stripe().checkout.sessions.create` and assert it was not called for student), and that `notifyMatriculaReview` was called once. Mock `db.insert(...).values(...).onConflictDoUpdate(...).returning()` to return `[{ id: "u1", studentVerification: "pending" }]`.

```ts
// Sketch — match the repo's existing route-test harness/mocks.
it("student tier creates a pending row + admin email, no Stripe session", async () => {
  const res = await POST(makeReq({ tier: "student", matricula_doc_url: BLOB_URL, /* …valid fields… */ }));
  expect(await res.json()).toEqual({ pending: true });
  expect(stripeCreate).not.toHaveBeenCalled();
  expect(notifyMatriculaReview).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/api/inscripcion/route.test.ts`
Expected: FAIL — current code returns `{ url }` and calls Stripe for student tier.

- [ ] **Step 3: Implement the student branch**

In `src/app/api/inscripcion/route.ts`, after the matrícula-URL validation block (the `BLOB_URL_RE` check, ~line 194) and the `acceptedAt`/`userAgent` capture, insert the student short-circuit BEFORE the pricing/Stripe block:

```ts
  // ── Student tier: review BEFORE payment ──────────────────────────────
  // Persist a pending row (paidAt stays null) carrying every datum the
  // post-approval checkout + webhook need, then email the admin to review.
  // No Stripe session is created here; the student receives a pay link only
  // after the owner approves (see applyVerificationDecision + /api/inscripcion/pagar).
  if (data.tier === "student") {
    const email = data.email.trim().toLowerCase();
    const submittedAt = new Date();
    try {
      const [row] = await db
        .insert(users)
        .values({
          email,
          name: data.nombre || null,
          tier: "student",
          phone: data.telefono || null,
          cohortId: cohort.id,
          studentVerification: "pending",
          verificationDocUrl: matriculaDocUrl,
          verificationSubmittedAt: submittedAt,
          aceptoTimestamp: new Date(acceptedAt),
          aceptoIp: ip,
          aceptoUserAgent: userAgent.slice(0, 480),
          aceptoVersionDocs: data.acepto_version_docs,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            name: data.nombre || undefined,
            tier: "student",
            phone: data.telefono || null,
            cohortId: cohort.id,
            // Preserve an existing approval; only (re)set pending when not approved.
            studentVerification: sql`case when ${users.studentVerification} = 'approved' then ${users.studentVerification} else 'pending'::"public"."student_verification_status" end`,
            verificationDocUrl: matriculaDocUrl,
            verificationSubmittedAt: submittedAt,
            verifiedAt: null,
            rejectedAt: null,
            aceptoTimestamp: new Date(acceptedAt),
            aceptoIp: ip,
            aceptoUserAgent: userAgent.slice(0, 480),
            aceptoVersionDocs: data.acepto_version_docs,
          },
        })
        .returning({ id: users.id, studentVerification: users.studentVerification, paidAt: users.paidAt });

      // Guard: already paid → don't reopen review.
      if (row?.paidAt) {
        return NextResponse.json(
          { error: "Ya tienes una inscripción registrada con este correo. Escríbenos si necesitas ayuda." },
          { status: 409 },
        );
      }

      if (row) {
        await notifyMatriculaReview({
          userId: row.id,
          name: data.nombre || null,
          email,
          docUrl: matriculaDocUrl,
          submittedAt,
        });
      }
    } catch (err) {
      console.error("[inscripcion] student pending upsert failed", err);
      return NextResponse.json(
        { error: "No pudimos registrar tu matrícula. Intenta nuevamente o escríbenos." },
        { status: 500 },
      );
    }
    return NextResponse.json({ pending: true });
  }
```

Add the imports at the top of the file:

```ts
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { notifyMatriculaReview } from "@/lib/portal/notify-matricula-review";
```

The existing pricing + `stripe().checkout.sessions.create(...)` block below now runs for the profesional tier only (it is already correct for profesional; no change to its body).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/api/inscripcion/route.test.ts`
Expected: PASS (student case + existing profesional cases still green).

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm tsc --noEmit
git add src/app/api/inscripcion/route.ts src/app/api/inscripcion/route.test.ts
git commit -m "feat(inscripcion): student tier persists pending row + admin review, no pre-payment Stripe session"
```

---

### Task 5: Approval email carries the pay link

**Files:**
- Modify: `src/lib/emails/verificacion.ts` (add `buildCheckoutLinkEmail`)
- Modify: `src/lib/portal/apply-verification-decision.ts` (branch on `paidAt`)
- Test: `src/lib/portal/apply-verification-decision.test.ts`

**Interfaces:**
- Consumes: `signCheckoutToken` (Task 2), `getSiteUrl`, `users.paidAt`/`users.verifiedAt`.
- Produces: `buildCheckoutLinkEmail(locale: "es" | "en", payUrl: string): { subject; text; html }`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/portal/apply-verification-decision.test.ts`. Mock `db`, `Resend`, `del`. Assert that approving an **unpaid** row sends an email whose body contains the `/api/inscripcion/pagar?token=` URL, and approving a **paid** row sends the existing "acceso completo al portal" email.

```ts
it("approval of an unpaid row emails a pay link", async () => {
  // row: { email, verificationDocUrl, studentVerification: 'pending', paidAt: null, verifiedAt(after update) }
  await applyVerificationDecision("u1", "approved");
  expect(sentHtml).toContain("/api/inscripcion/pagar?token=");
});

it("approval of a paid row emails the portal-access note", async () => {
  await applyVerificationDecision("u2", "approved");
  expect(sentText).toContain("acceso completo al portal");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/portal/apply-verification-decision.test.ts`
Expected: FAIL — pay-link email not implemented; approval always sends the portal note.

- [ ] **Step 3: Add the email builder**

Append to `src/lib/emails/verificacion.ts`:

```ts
/**
 * Sent to the student when the owner APPROVES a pre-payment matrícula. Carries
 * the signed 48-hour "Pagar ahora" link. (The already-paid approval path keeps
 * using buildVerificationApprovedEmail.)
 */
export function buildCheckoutLinkEmail(
  locale: Locale,
  payUrl: string,
): { subject: string; text: string; html: string } {
  const es = {
    subject: "Matrícula aprobada — completa tu pago · SCCA",
    body: `¡Tu matrícula fue aprobada! Completa tu inscripción con el pago seguro.\n\nEste enlace vence en 48 horas:\n${payUrl}`,
  };
  const en = {
    subject: "Matrícula approved — complete your payment · SCCA",
    body: `Your matrícula was approved! Complete your enrollment with secure payment.\n\nThis link expires in 48 hours:\n${payUrl}`,
  };
  const c = locale === "en" ? en : es;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const label = locale === "en" ? "Pay now" : "Pagar ahora";
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#404040;max-width:520px;">
  <p>${esc(c.body.split("\n")[0])}</p>
  <p style="margin:18px 0;">
    <a href="${esc(payUrl)}" style="display:inline-block;background:#E6EA82;color:#195561;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px;">${label}</a>
  </p>
  <p style="color:#666666;font-size:13px;">${locale === "en" ? "This link expires in 48 hours." : "Este enlace vence en 48 horas."}</p>
</div>`;
  return { subject: c.subject, text: c.body, html };
}
```

- [ ] **Step 4: Branch the approval path on `paidAt`**

In `src/lib/portal/apply-verification-decision.ts`: extend the initial `select` to also read `users.paidAt`, and after the `update` (which sets `verifiedAt`), re-read the row's `verifiedAt` (or pass `new Date()` used in the patch). Then replace the email block:

```ts
  // existing select — add paidAt:
  const [row] = await db
    .select({
      email: users.email,
      doc: users.verificationDocUrl,
      current: users.studentVerification,
      paidAt: users.paidAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
```

```ts
  const decidedAt = new Date();
  await db
    .update(users)
    .set(verificationDecisionPatch(decision, decidedAt))
    .where(eq(users.id, userId));
```

```ts
  const key = process.env.RESEND_API_KEY;
  if (key && row.email) {
    let mail;
    if (decision === "rejected") {
      mail = buildVerificationRejectedEmail("es");
    } else if (row.paidAt) {
      // Already paid (in-portal verificacion path) — confirm portal access.
      mail = buildVerificationApprovedEmail("es");
    } else {
      // Pre-payment approval — send the signed 48h pay link.
      const token = signCheckoutToken({ userId, approvedAt: decidedAt.getTime() });
      const payUrl = `${getSiteUrl()}/api/inscripcion/pagar?token=${encodeURIComponent(token)}`;
      mail = buildCheckoutLinkEmail("es", payUrl);
    }
    try {
      await new Resend(key).emails.send({
        from: FROM_ADDRESS, to: row.email,
        subject: mail.subject, html: mail.html, text: mail.text,
      });
    } catch (err) {
      console.error("[verificacion] student email failed", err);
    }
  }
```

Add imports: `import { getSiteUrl } from "@/lib/siteUrl";`, `import { signCheckoutToken } from "./verification-token";`, and `buildCheckoutLinkEmail` to the existing `@/lib/emails/verificacion` import.

- [ ] **Step 5: Run tests + typecheck + commit**

Run: `pnpm vitest run src/lib/portal/apply-verification-decision.test.ts && pnpm tsc --noEmit`
Expected: PASS.

```bash
git add src/lib/emails/verificacion.ts src/lib/portal/apply-verification-decision.ts src/lib/portal/apply-verification-decision.test.ts
git commit -m "feat(verificacion): approval emails a 48h pay link for unpaid (pre-payment) rows"
```

---

### Task 6: `GET /api/inscripcion/pagar` endpoint

**Files:**
- Create: `src/app/api/inscripcion/pagar/route.ts`
- Test: `src/app/api/inscripcion/pagar/route.test.ts`

**Interfaces:**
- Consumes: `verifyCheckoutToken` (Task 2), `createStudentCheckoutSession` (Task 3), `getSiteUrl`.
- Produces: HTTP 302 to Stripe on success; HTTP 302 to `/es/inscripcion/pago-cerrado?reason=…` on every failure (expired token, bad token, not-approved, already-paid, cohort-closed).

**Constant:** `CHECKOUT_LINK_TTL_MS = 48 * 60 * 60 * 1000`.

- [ ] **Step 1: Write the failing test**

Create `src/app/api/inscripcion/pagar/route.test.ts`. Mock `createStudentCheckoutSession` and `verifyCheckoutToken`:

```ts
it("redirects expired tokens to pago-cerrado?reason=expirado", async () => {
  vi.mocked(verifyCheckoutToken).mockReturnValue({ userId: "u1", approvedAt: 0 }); // ancient
  const res = await GET(new Request("https://x/api/inscripcion/pagar?token=t"));
  expect(res.status).toBe(302);
  expect(res.headers.get("location")).toContain("/inscripcion/pago-cerrado?reason=expirado");
});

it("redirects to Stripe on the happy path", async () => {
  vi.mocked(verifyCheckoutToken).mockReturnValue({ userId: "u1", approvedAt: NOW });
  vi.mocked(createStudentCheckoutSession).mockResolvedValue({ ok: true, url: "https://stripe.test/s" });
  const res = await GET(new Request("https://x/api/inscripcion/pagar?token=t"));
  expect(res.headers.get("location")).toBe("https://stripe.test/s");
});
```

(Inject "now" via a module constant or accept the small epsilon; for `approvedAt: NOW` use `Date.now()` in the test.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/api/inscripcion/pagar/route.test.ts`
Expected: FAIL — route module not found.

- [ ] **Step 3: Implement the endpoint**

Create `src/app/api/inscripcion/pagar/route.ts`:

```ts
import { NextResponse } from "next/server";
import { verifyCheckoutToken } from "@/lib/portal/verification-token";
import { createStudentCheckoutSession } from "@/lib/inscripcion/checkout";
import { getSiteUrl } from "@/lib/siteUrl";

export const runtime = "nodejs";

const CHECKOUT_LINK_TTL_MS = 48 * 60 * 60 * 1000;

/**
 * GET /api/inscripcion/pagar?token=… — the student's emailed "pay now" link.
 * Authorized by the signed token alone (no login). Validates signature → 48h
 * freshness → DB preconditions (approved, unpaid, cohort open) and 302s to
 * Stripe Checkout. Every failure routes to a friendly /pago-cerrado page.
 */
export async function GET(req: Request): Promise<Response> {
  const origin = getSiteUrl();
  const closed = (reason: string) =>
    NextResponse.redirect(`${origin}/es/inscripcion/pago-cerrado?reason=${reason}`, 302);

  const token = new URL(req.url).searchParams.get("token") ?? "";
  const payload = verifyCheckoutToken(token);
  if (!payload) return closed("invalido");

  if (Date.now() - payload.approvedAt > CHECKOUT_LINK_TTL_MS) {
    return closed("expirado");
  }

  const outcome = await createStudentCheckoutSession(payload.userId);
  if (!outcome.ok) {
    const reason =
      outcome.reason === "already-paid" ? "pagado"
      : outcome.reason === "cohort-closed" ? "cerrada"
      : outcome.reason === "not-approved" ? "invalido"
      : "error";
    return closed(reason);
  }
  return NextResponse.redirect(outcome.url, 302);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/api/inscripcion/pagar/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/inscripcion/pagar
git commit -m "feat(inscripcion): GET /pagar validates the emailed token and redirects to Stripe"
```

---

### Task 7: Webhook stamps `paidAt` for the existing student row

**Files:**
- Modify: `src/app/api/webhooks/stripe/route.ts:213-324` (the user-upsert block)
- Test: `src/app/api/webhooks/stripe/route.test.ts` (extend)

**Interfaces:**
- Consumes: `session.metadata.user_id` (set by Task 3 helper for student tier), `session.metadata.tier`.
- Produces: a student-tier `checkout.session.completed` updates the row found by `user_id`, setting `paidAt`/`stripeCustomerId`/`stripePaymentIntent`, leaving `studentVerification` untouched. Profesional tier upsert unchanged.

- [ ] **Step 1: Write the failing test**

Add to the webhook test: a student-tier session with `metadata.user_id = "u1"` updates that row's `paidAt` and does **not** set `studentVerification` to pending. A profesional session still upserts by email as before.

```ts
it("student tier stamps paidAt on the pre-existing row, leaves verification", async () => {
  const res = await POST(makeStripeEvent({ metadata: { user_id: "u1", tier: "student" }, amount_total: 49500 }));
  expect(res.status).toBe(200);
  expect(updateArgs.set).toMatchObject({ paidAt: expect.any(Date) });
  expect(updateArgs.set).not.toHaveProperty("studentVerification");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/app/api/webhooks/stripe/route.test.ts`
Expected: FAIL — current code re-upserts by email and resets student verification.

- [ ] **Step 3: Implement the student branch in the webhook**

In `src/app/api/webhooks/stripe/route.ts`, branch at the start of the `if (email) { … }` user block. When `md.user_id` is present AND tier is student, update by id instead of upserting by email:

```ts
  const userIdFromSession = md.user_id?.trim() || null;

  if (tier === "student" && userIdFromSession) {
    // Pre-payment review path: the row already exists and is approved. Only
    // stamp the payment; never touch verification (it was decided before pay).
    try {
      const [row] = await db
        .update(users)
        .set({
          paidAt: new Date(),
          stripeCustomerId,
          cohortId: cohort.id,
        })
        .where(eq(users.id, userIdFromSession))
        .returning({ id: users.id });
      if (!row) {
        await sendOpsAlert("Pago estudiante sin fila correspondiente", {
          user_id: userIdFromSession,
          stripe_session_id: session.id,
          accion: "Reconciliar manualmente; la fila pendiente no fue hallada.",
        });
      }
    } catch (err) {
      console.error("[stripe-webhook] student paidAt update failed", err);
      try {
        await db.delete(processedStripeEvents).where(eq(processedStripeEvents.eventId, event.id));
      } catch (releaseErr) {
        console.error("[stripe-webhook] failed to release dedup claim", releaseErr);
      }
      await sendOpsAlert("Pago estudiante OK pero falló el sello de pago en DB", {
        user_id: userIdFromSession, stripe_session_id: session.id, error: err,
        accion: "Reenviar el evento desde Stripe sana la DB.",
      });
    }
  } else if (email) {
    // Profesional tier (or legacy student without user_id) — existing upsert.
    // … unchanged existing block …
  }
```

Keep the existing `notifyMatriculaReview` call only inside the legacy `else if (email)` profesional/legacy branch — the pre-payment student path already had its review email at submit time, so it must NOT re-notify here. The Airtable + confirmation/internal emails below the block run for both branches as before (they key off `email`, which is still set from `session.customer_email`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/app/api/webhooks/stripe/route.test.ts`
Expected: PASS (student + profesional cases).

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm tsc --noEmit
git add src/app/api/webhooks/stripe/route.ts src/app/api/webhooks/stripe/route.test.ts
git commit -m "feat(webhook): student tier stamps paidAt on the reviewed row, no verification reset"
```

---

### Task 8: Frontend — review redirect, new pages, resend, i18n

**Files:**
- Modify: `src/components/marketing/inscripcion/InscripcionForm.tsx:165-181`
- Create: `src/app/[locale]/(marketing)/inscripcion/revision/page.tsx`
- Create: `src/app/[locale]/(marketing)/inscripcion/pago-cerrado/page.tsx`
- Create: `src/app/api/inscripcion/reenviar-pago/route.ts`
- Modify: `src/i18n/routing.ts:13-15` (add pathnames)
- Modify: `messages/es.json`, `messages/en.json`

**Interfaces:**
- Consumes: `{ pending: true }` from Task 4; `createStudentCheckoutSession` is NOT reused here — resend re-signs a fresh token via the row's current `verifiedAt`.

- [ ] **Step 1: Add the i18n pathnames**

In `src/i18n/routing.ts`, inside `pathnames`, after the `/inscripcion/cancelada` entry:

```ts
    "/inscripcion/revision": { es: "/inscripcion/revision", en: "/enroll/review" },
    "/inscripcion/pago-cerrado": { es: "/inscripcion/pago-cerrado", en: "/enroll/payment-closed" },
```

- [ ] **Step 2: Redirect the student to the review page**

In `InscripcionForm.tsx`, change the success handling of the `/api/inscripcion` fetch:

```ts
      const json = (await res.json()) as { url?: string; pending?: boolean; error?: string };
      if (!res.ok) {
        setError(json.error ?? t("errors.generic"));
        setSubmitting(false);
        return;
      }
      if (json.pending) {
        window.location.assign(`/${locale}/${locale === "en" ? "enroll/review" : "inscripcion/revision"}`);
        return;
      }
      if (!json.url) {
        setError(t("errors.generic"));
        setSubmitting(false);
        return;
      }
      window.location.assign(json.url);
```

- [ ] **Step 3: Create the review page**

Create `src/app/[locale]/(marketing)/inscripcion/revision/page.tsx` — a static server component reading `inscripcion.revision.*` messages (title + body + contact line). Follow the layout/styling of the existing `inscripcion/exito/page.tsx`.

```tsx
import { getTranslations } from "next-intl/server";

export default async function RevisionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "inscripcion.revision" });
  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="font-heading text-teal-deep text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-4 text-gray-700">{t("body")}</p>
      <p className="mt-6 text-sm text-gray-700">{t("contact")}</p>
    </main>
  );
}
```

- [ ] **Step 4: Create the pago-cerrado page with a resend form**

Create `src/app/[locale]/(marketing)/inscripcion/pago-cerrado/page.tsx`. Reads `?reason=` and renders the matching message; for `reason=expirado` it shows a small form (email input) that POSTs to `/api/inscripcion/reenviar-pago`.

```tsx
import { getTranslations } from "next-intl/server";

const KNOWN = ["expirado", "invalido", "pagado", "cerrada", "error"] as const;

export default async function PagoCerradoPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ reason?: string }> }) {
  const { locale } = await params;
  const { reason } = await searchParams;
  const key = (KNOWN as readonly string[]).includes(reason ?? "") ? reason! : "error";
  const t = await getTranslations({ locale, namespace: "inscripcion.pagoCerrado" });
  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="font-heading text-teal-deep text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-4 text-gray-700">{t(`reasons.${key}`)}</p>
      {key === "expirado" && (
        <form action="/api/inscripcion/reenviar-pago" method="post" className="mt-6 flex flex-col items-center gap-3">
          <input name="email" type="email" required placeholder={t("emailPlaceholder")}
            className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2.5" />
          <button type="submit"
            className="bg-chartreuse text-teal-deep rounded-md px-6 py-2.5 font-semibold">
            {t("resend")}
          </button>
        </form>
      )}
      <p className="mt-6 text-sm text-gray-700">{t("contact")}</p>
    </main>
  );
}
```

- [ ] **Step 5: Create the resend endpoint**

Create `src/app/api/inscripcion/reenviar-pago/route.ts`. Looks up the row by email; if `studentVerification === 'approved'` and `paidAt` is null and the cohort is open, re-sign a fresh token from the row's current `verifiedAt` and email it (reuse `buildCheckoutLinkEmail`). Always redirect back to a neutral "revisa tu correo" state (don't leak whether the email exists).

```ts
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCohort } from "@/lib/cohorts";
import { getSiteUrl } from "@/lib/siteUrl";
import { signCheckoutToken } from "@/lib/portal/verification-token";
import { buildCheckoutLinkEmail } from "@/lib/emails/verificacion";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
const FROM_ADDRESS = process.env.EMAIL_FROM ?? "SCCA <info@sccompoundingacademy.com>";

export async function POST(req: Request): Promise<Response> {
  const origin = getSiteUrl();
  const done = NextResponse.redirect(`${origin}/es/inscripcion/pago-cerrado?reason=reenviado`, 302);

  const ip = clientIp(req);
  const rl = await rateLimit("reenviar-pago", ip, 5, 60);
  if (!rl.success) return done; // silently swallow abuse

  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email) return done;

  const [row] = await db
    .select({
      id: users.id, paidAt: users.paidAt,
      studentVerification: users.studentVerification,
      verifiedAt: users.verifiedAt, cohortId: users.cohortId,
    })
    .from(users).where(eq(users.email, email)).limit(1);

  if (row && !row.paidAt && row.studentVerification === "approved" && row.verifiedAt) {
    const cohort = row.cohortId ? await getCohort(row.cohortId) : undefined;
    const key = process.env.RESEND_API_KEY;
    if (cohort?.openForEnrollment && key) {
      const token = signCheckoutToken({ userId: row.id, approvedAt: row.verifiedAt.getTime() });
      const payUrl = `${origin}/api/inscripcion/pagar?token=${encodeURIComponent(token)}`;
      const mail = buildCheckoutLinkEmail("es", payUrl);
      try {
        await new Resend(key).emails.send({ from: FROM_ADDRESS, to: email, subject: mail.subject, html: mail.html, text: mail.text });
      } catch (err) {
        console.error("[reenviar-pago] email failed", err);
      }
    }
  }
  return done;
}
```

Add a `reenviado` message to `inscripcion.pagoCerrado.reasons` ("Te enviamos un enlace nuevo si tu matrícula está aprobada. Revisa tu correo.").

- [ ] **Step 6: Add i18n copy**

Add to `messages/es.json` under `inscripcion`:

```json
"revision": {
  "title": "Recibimos tu matrícula",
  "body": "La revisaremos y te enviaremos un correo con el enlace para completar tu pago. Esto suele tardar poco.",
  "contact": "¿Dudas? Escríbenos a info@sccompoundingacademy.com"
},
"pagoCerrado": {
  "title": "Enlace de pago no disponible",
  "emailPlaceholder": "tu@correo.com",
  "resend": "Reenviar enlace de pago",
  "contact": "¿Necesitas ayuda? Escríbenos a info@sccompoundingacademy.com",
  "reasons": {
    "expirado": "Tu enlace de pago venció (válido 48 horas). Pide uno nuevo abajo.",
    "invalido": "Este enlace no es válido. Escríbenos para ayudarte.",
    "pagado": "Esta inscripción ya está pagada. ¡Nos vemos en clase!",
    "cerrada": "La cohorte cerró inscripciones. Escríbenos para la próxima fecha.",
    "error": "No pudimos procesar el pago. Intenta más tarde o escríbenos.",
    "reenviado": "Te enviamos un enlace nuevo si tu matrícula está aprobada. Revisa tu correo."
  }
}
```

Add the English equivalents to `messages/en.json` under `inscripcion` (`review`/`paymentClosed`-style copy; translate the strings above).

- [ ] **Step 7: Typecheck, build, commit**

Run: `pnpm tsc --noEmit && pnpm build`
Expected: PASS (new routes compile; i18n keys resolve).

```bash
git add src/components/marketing/inscripcion/InscripcionForm.tsx src/app/[locale]/(marketing)/inscripcion/revision src/app/[locale]/(marketing)/inscripcion/pago-cerrado src/app/api/inscripcion/reenviar-pago src/i18n/routing.ts messages/es.json messages/en.json
git commit -m "feat(inscripcion): review page, expired-link page with resend, student review redirect + i18n"
```

---

### Task 9: Cleanup + full-suite verification

**Files:**
- Modify: `src/lib/portal/notify-matricula-review.ts:22-29` (fix the stale "pre-payment upload" comment — now it's accurate for the student path and the in-portal path)

- [ ] **Step 1: Fix the stale comment**

Update the doc comment to reflect that this is now called from (a) the student-tier enrollment submit (pre-payment) and (b) the in-portal verificacion upload — not the webhook.

- [ ] **Step 2: Run the full test suite**

Run: `pnpm vitest run`
Expected: PASS (all suites).

- [ ] **Step 3: Run lint + typecheck + build**

Run: `pnpm lint && pnpm tsc --noEmit && pnpm build`
Expected: PASS.

- [ ] **Step 4: Manual end-to-end checklist (staging / Stripe test mode)**

- [ ] Student tier: submit form + matrícula photo → lands on `/inscripcion/revision`; admin review email arrives; **no** Stripe redirect.
- [ ] Approve from the email → student gets the "Pagar ahora" email; clicking it reaches Stripe Checkout with the $495 price.
- [ ] Complete Stripe test payment → confirmation email + welcome packet arrive; `users.paidAt` set; portal dashboard unlocks; `studentVerification` stays `approved`.
- [ ] Reject from the email → student gets the simple rejection email; no pay link.
- [ ] Wait past 48h (or hand-edit `verifiedAt`) → pay link → `/pago-cerrado?reason=expirado`; resend form emails a fresh link.
- [ ] Profesional tier: submit → straight to Stripe → pay → confirmation (unchanged).

- [ ] **Step 5: Commit**

```bash
git add src/lib/portal/notify-matricula-review.ts
git commit -m "docs(verificacion): correct notify-matricula-review trigger comment (pre-payment)"
```

---

## Self-Review

**Spec coverage:**
- Flow inversion (student) → Tasks 3,4,5,6,7. Profesional unchanged → asserted in Tasks 4,7.
- Email pay link (48h) → Tasks 2,5; expiry enforced in Task 6; resend in Task 8.
- Simple rejection email → Task 5 (rejected branch unchanged).
- Reuse `users` row (Approach A) → Tasks 4,6.
- Legal-acceptance columns + migration → Task 1.
- Pre-payment upsert with paid-guard + lowercase email → Task 4.
- Token bound to `verifiedAt` → Tasks 2,5.
- Pages (revision, expired/closed) + resend button → Task 8.
- Webhook stamps paidAt only → Task 7.
- Tests for token/endpoint/route/webhook/migration → Tasks 1,2,3,4,5,6,7.
- Out-of-scope items (no profesional offer on reject, no seat hold, no portal Pay button) honored.

**Refinement vs spec:** `applyVerificationDecision` is shared with the in-portal (already-paid) verificacion flow, so Task 5 branches the approval email on `paidAt` (unpaid → pay link; paid → existing portal-access note). This preserves the existing in-portal flow and is the one place the spec under-specified.

**Type consistency:** `signCheckoutToken`/`verifyCheckoutToken` payload `{ userId, approvedAt }` used identically in Tasks 2,5,6,8. `createStudentCheckoutSession` `CheckoutOutcome` reasons consumed in Task 6 map. Webhook reads `md.user_id` (set by Task 3 helper metadata `user_id`). Column names (`aceptoTimestamp` etc.) consistent Tasks 1,4.

**Placeholder scan:** route/webhook/form modifications reference existing surrounding code by exact line ranges; test sketches for the larger route/webhook suites note "match the repo's existing harness" because those suites' mock setup is established — the assertions and behavior are fully specified.
