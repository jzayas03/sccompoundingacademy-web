# Student Matrícula Photo Verification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate student-tier portal access behind an owner-reviewed matrícula photo upload, closing the currently-ungated $495 student price.

**Architecture:** Approach A — new columns on the existing `user` table track a `pending`/`approved`/`rejected` state. After paying, a student-tier user is redirected to `/portal/verificacion` until they upload a matrícula photo (client-side upload straight to Vercel Blob) and the owner approves it in `/portal/admin`. The blob is deleted the moment the owner decides. Profesional tier is untouched; owners (`ADMIN_EMAILS`) bypass every gate.

**Tech Stack:** Next.js 16 (App Router) · next-intl · Drizzle ORM + Neon Postgres · Auth.js · Vercel Blob (`@vercel/blob`) · Resend · Vitest · pnpm.

**Spec:** `docs/superpowers/specs/2026-06-02-student-matricula-verification-design.md`

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/lib/db/schema.ts` | Add `studentVerificationStatus` enum + 4 columns on `user` | Modify |
| `drizzle/00XX_*.sql` | Generated migration | Create (via `pnpm db:generate`) |
| `src/lib/portal/verification-gate.ts` | Pure decision: must a student verify before seeing content? | Create |
| `tests/unit/verification-gate.test.ts` | Exhaustive tests for the gate | Create |
| `src/lib/portal/verification.ts` | Shared constants (accepted MIME types, max size, blob path prefix) | Create |
| `src/app/api/webhooks/stripe/route.ts` | Set `studentVerification='pending'` for student-tier upserts | Modify |
| `src/app/api/portal/verificacion/upload/route.ts` | Issue Vercel Blob client-upload token (auth-gated) | Create |
| `src/app/[locale]/(portal)/portal/verificacion/page.tsx` | Upload page (server component, state-driven) | Create |
| `src/app/[locale]/(portal)/portal/verificacion/VerificacionForm.tsx` | Client upload widget | Create |
| `src/app/[locale]/(portal)/portal/verificacion/actions.ts` | `submitVerificationDoc` server action | Create |
| `src/app/[locale]/(portal)/portal/page.tsx` | Redirect unverified student to `/portal/verificacion` | Modify |
| `src/app/[locale]/(portal)/portal/modulos/[id]/page.tsx` | Same gate (defense in depth) | Modify |
| `src/app/[locale]/(portal)/portal/admin/actions.ts` | `approveStudentVerification` / `rejectStudentVerification` | Modify |
| `tests/unit/student-verification-actions.test.ts` | Action field/auth/ blob-delete behavior | Create |
| `src/app/[locale]/(portal)/portal/admin/page.tsx` | "Verificación de estudiantes" review queue | Modify |
| `src/lib/emails/verificacion.ts` | Owner-notify + student approve/reject emails | Create |
| `src/messages/es.json`, `src/messages/en.json` | `portal.verificacion` keys + privacy policy line | Modify |

---

## Task 1: Schema + migration

**Files:**
- Modify: `src/lib/db/schema.ts`
- Create: generated migration under `drizzle/`

- [ ] **Step 1: Add the enum next to `tierEnum`**

In `src/lib/db/schema.ts`, immediately after the `tierEnum` declaration (line ~42), add:

```ts
/**
 * Student-tier verification state. Set to "pending" by the Stripe webhook
 * when a student-tier enrollment is upserted; the owner moves it to
 * "approved" or "rejected" from /portal/admin. Null for the profesional
 * tier (no verification required) and for rows created before this column
 * existed.
 */
export const studentVerificationStatus = pgEnum("student_verification_status", [
  "pending",
  "approved",
  "rejected",
]);
```

- [ ] **Step 2: Add the columns to the `users` table**

In the `users = pgTable("user", { ... })` block, after the `professionalType` column (line ~66), add:

```ts
  /** Student-tier identity verification. Null for profesional tier. */
  studentVerification: studentVerificationStatus("student_verification"),
  /** Vercel Blob URL of the uploaded matrícula photo. Cleared (null) the
   * moment the owner approves or rejects — the document is not retained. */
  verificationDocUrl: text("verification_doc_url"),
  verificationSubmittedAt: timestamp("verification_submitted_at", { mode: "date" }),
  verifiedAt: timestamp("verified_at", { mode: "date" }),
  rejectedAt: timestamp("rejected_at", { mode: "date" }),
```

- [ ] **Step 3: Generate the migration**

```bash
pnpm db:generate
```

Expected: a new `drizzle/00XX_<name>.sql` file is created containing `CREATE TYPE "public"."student_verification_status"` and `ALTER TABLE "user" ADD COLUMN ...` statements. No prompts (these are additive nullable columns).

- [ ] **Step 4: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS (no type errors).

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
```

```bash
git commit -m "feat(db): add student_verification columns to user table"
```

> **Deploy note:** `pnpm db:migrate` runs against the Neon DB at deploy time (requires `DATABASE_URL`). It is NOT part of this local task.

---

## Task 2: Pure verification gate helper (TDD)

**Files:**
- Create: `src/lib/portal/verification-gate.ts`
- Test: `tests/unit/verification-gate.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/verification-gate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  resolveVerificationGate,
  type VerificationGateInput,
} from "@/lib/portal/verification-gate";

const base: VerificationGateInput = {
  isOwner: false,
  tier: "student",
  studentVerification: "approved",
};

describe("resolveVerificationGate", () => {
  it("allows an approved student-tier user", () => {
    expect(resolveVerificationGate(base)).toBe("allow");
  });

  it("blocks a pending student-tier user", () => {
    expect(
      resolveVerificationGate({ ...base, studentVerification: "pending" }),
    ).toBe("redirect-verificacion");
  });

  it("blocks a rejected student-tier user (they may re-upload)", () => {
    expect(
      resolveVerificationGate({ ...base, studentVerification: "rejected" }),
    ).toBe("redirect-verificacion");
  });

  it("blocks a student-tier user whose status is still null", () => {
    expect(
      resolveVerificationGate({ ...base, studentVerification: null }),
    ).toBe("redirect-verificacion");
  });

  it("always allows the profesional tier regardless of status", () => {
    expect(
      resolveVerificationGate({ ...base, tier: "profesional", studentVerification: null }),
    ).toBe("allow");
  });

  it("always allows when tier is null (legacy / pre-tier rows)", () => {
    expect(
      resolveVerificationGate({ ...base, tier: null, studentVerification: null }),
    ).toBe("allow");
  });

  it("always allows an owner, even an unverified student", () => {
    expect(
      resolveVerificationGate({
        isOwner: true,
        tier: "student",
        studentVerification: "pending",
      }),
    ).toBe("allow");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/verification-gate.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/portal/verification-gate'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/portal/verification-gate.ts`:

```ts
/**
 * Pure access-policy for the student-tier matrícula verification gate.
 *
 * The contract:
 *   1. Owners (ADMIN_EMAILS) bypass — same rule as every other portal gate.
 *   2. Only the "student" tier is gated; "profesional"/"pharmacist"/null
 *      tiers are never asked to verify.
 *   3. A student-tier user may see portal content ONLY when their
 *      verification is "approved". Any other state (pending / rejected /
 *      null) routes them to /portal/verificacion to upload (or re-upload).
 *
 * The page component owns the I/O (auth, the users row); this just decides.
 */
export type VerificationGateInput = {
  /** Email is on the ADMIN_EMAILS allowlist. */
  isOwner: boolean;
  /** `users.tier`. */
  tier: "pharmacist" | "profesional" | "student" | null;
  /** `users.studentVerification`. */
  studentVerification: "pending" | "approved" | "rejected" | null;
};

export type VerificationGateDecision = "allow" | "redirect-verificacion";

export function resolveVerificationGate(
  input: VerificationGateInput,
): VerificationGateDecision {
  // (1) Owner bypass.
  if (input.isOwner) return "allow";

  // (2) Only the student tier is gated.
  if (input.tier !== "student") return "allow";

  // (3) Student must be approved to proceed.
  return input.studentVerification === "approved"
    ? "allow"
    : "redirect-verificacion";
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm vitest run tests/unit/verification-gate.test.ts
```

Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/portal/verification-gate.ts tests/unit/verification-gate.test.ts
```

```bash
git commit -m "feat(portal): pure student-verification gate helper + tests"
```

---

## Task 3: Shared verification constants

**Files:**
- Create: `src/lib/portal/verification.ts`

- [ ] **Step 1: Write the constants**

Create `src/lib/portal/verification.ts`:

```ts
/**
 * Shared constants for the matrícula verification upload, used by both the
 * client form and the Blob token-issuing route so the limits stay in sync.
 */
export const VERIFICATION_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

/** 8 MB — comfortably above a phone photo, below anything abusive. */
export const VERIFICATION_MAX_BYTES = 8 * 1024 * 1024;

/** Blob pathname prefix so all verification docs share a folder. */
export const VERIFICATION_BLOB_PREFIX = "matricula";
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/portal/verification.ts
```

```bash
git commit -m "feat(portal): shared matrícula upload constants"
```

---

## Task 4: Webhook sets `pending` for student tier (TDD on the mapping)

The webhook already derives `tier`. We extract the "what verification status does a freshly-paid user get?" rule into a tiny pure helper so it is testable, then use it in the upsert.

**Files:**
- Create: `src/lib/portal/initial-verification.ts`
- Test: `tests/unit/initial-verification.test.ts`
- Modify: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/initial-verification.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { initialVerificationFor } from "@/lib/portal/initial-verification";

describe("initialVerificationFor", () => {
  it("makes a student-tier enrollee pending verification", () => {
    expect(initialVerificationFor("student")).toBe("pending");
  });

  it("leaves the profesional tier with no verification requirement", () => {
    expect(initialVerificationFor("profesional")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/initial-verification.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/portal/initial-verification.ts`:

```ts
/**
 * The verification status a newly-paid enrollee starts with. Student-tier
 * enrollees must verify their matrícula before accessing content; everyone
 * else has no verification requirement (null).
 */
export function initialVerificationFor(
  tier: "profesional" | "student",
): "pending" | null {
  return tier === "student" ? "pending" : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm vitest run tests/unit/initial-verification.test.ts
```

Expected: PASS.

- [ ] **Step 5: Wire it into the webhook upsert**

In `src/app/api/webhooks/stripe/route.ts`, add the import near the other `@/lib` imports at the top of the file:

```ts
import { initialVerificationFor } from "@/lib/portal/initial-verification";
```

Then, inside the `if (email) { ... }` block (around line 174), compute the status once before the `db.insert`:

```ts
    const studentVerification = initialVerificationFor(tier);
```

Add `studentVerification` to BOTH the `.values({...})` object and the `.onConflictDoUpdate({ set: {...} })` object (alongside `tier`). For the update path, only set it when the row is becoming student-tier — guard so an already-approved student who somehow re-triggers the webhook is not reset to pending:

In `.values({...})`:
```ts
          tier,
          studentVerification,
          paidAt: new Date(),
```

In `.onConflictDoUpdate({ set: {...} })`, replace the `tier,` line with:
```ts
            tier,
            // Only (re)assign verification on conflict when this is a
            // student enrollment; never clobber an existing approval.
            ...(tier === "student" ? { studentVerification: "pending" as const } : {}),
            paidAt: new Date(),
```

- [ ] **Step 6: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/portal/initial-verification.ts tests/unit/initial-verification.test.ts src/app/api/webhooks/stripe/route.ts
```

```bash
git commit -m "feat(webhook): student-tier enrollees start as pending verification"
```

---

## Task 5: Add the Vercel Blob dependency

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install `@vercel/blob`**

```bash
pnpm add @vercel/blob
```

Expected: `@vercel/blob` appears in `dependencies`; lockfile updates.

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
```

```bash
git commit -m "build: add @vercel/blob for matrícula uploads"
```

> **Deploy note:** create a Blob store on the Vercel project and add `BLOB_READ_WRITE_TOKEN` to Production + Preview. Document in STATUS at the end.

---

## Task 6: Blob client-upload token route

**Files:**
- Create: `src/app/api/portal/verificacion/upload/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/portal/verificacion/upload/route.ts`:

```ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  VERIFICATION_ACCEPTED_TYPES,
  VERIFICATION_MAX_BYTES,
} from "@/lib/portal/verification";

/**
 * Issues a short-lived client-upload token so the browser can upload the
 * matrícula photo DIRECTLY to Vercel Blob (bypassing the ~4.5 MB serverless
 * body limit). Only authenticated portal users may request a token. The
 * blob URL is persisted afterwards by the `submitVerificationDoc` action —
 * we do NOT rely on `onUploadCompleted`, which does not fire in local dev.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [...VERIFICATION_ACCEPTED_TYPES],
        maximumSizeInBytes: VERIFICATION_MAX_BYTES,
        addRandomSuffix: true,
      }),
      // No-op: persistence happens in submitVerificationDoc.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/portal/verificacion/upload/route.ts
```

```bash
git commit -m "feat(portal): Vercel Blob client-upload token route"
```

---

## Task 7: Owner-notify + student emails

**Files:**
- Create: `src/lib/emails/verificacion.ts`

- [ ] **Step 1: Write the email builders**

Create `src/lib/emails/verificacion.ts` (mirrors the plain-text style of `inscripcion-interna.ts`):

```ts
/**
 * Emails for the matrícula verification flow. One internal notification to
 * the ops inbox when a student submits, and two student-facing notes for the
 * owner's approve / reject decisions. Bilingual (es/en) by the `locale` arg.
 */
type Locale = "es" | "en";

const PORTAL_URL = "https://sccompoundingacademy.com";

export function buildVerificationSubmittedEmail(p: {
  nombre: string;
  email: string;
}): { subject: string; text: string; html: string } {
  const subject = `Verificación pendiente · ${p.nombre || p.email}`;
  const text = `NUEVA MATRÍCULA PARA REVISAR

Estudiante: ${p.nombre || "(sin nombre)"}
Email:      ${p.email}

Revisa y aprueba/rechaza en el panel:
${PORTAL_URL}/es/portal/admin
`;
  const html = `<pre style="font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.5;">${text.replace(/</g, "&lt;")}</pre>`;
  return { subject, text, html };
}

export function buildVerificationApprovedEmail(
  locale: Locale,
): { subject: string; text: string; html: string } {
  const es = {
    subject: "Verificación aprobada · SCCA",
    body: `Tu matrícula fue verificada. Ya tienes acceso completo al portal del curso.\n\nEntra aquí: ${PORTAL_URL}/es/portal`,
  };
  const en = {
    subject: "Verification approved · SCCA",
    body: `Your student ID was verified. You now have full access to the course portal.\n\nSign in here: ${PORTAL_URL}/en/portal`,
  };
  const c = locale === "en" ? en : es;
  const html = `<p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;">${c.body.replace(/\n/g, "<br>")}</p>`;
  return { subject: c.subject, text: c.body, html };
}

export function buildVerificationRejectedEmail(
  locale: Locale,
): { subject: string; text: string; html: string } {
  const es = {
    subject: "No pudimos verificar tu matrícula · SCCA",
    body: `No pudimos verificar la foto de matrícula que subiste. Por favor sube una foto clara y vigente desde el portal.\n\nSubir de nuevo: ${PORTAL_URL}/es/portal/verificacion`,
  };
  const en = {
    subject: "We couldn't verify your student ID · SCCA",
    body: `We couldn't verify the student-ID photo you uploaded. Please upload a clear, current photo from the portal.\n\nUpload again: ${PORTAL_URL}/en/portal/verificacion`,
  };
  const c = locale === "en" ? en : es;
  const html = `<p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;">${c.body.replace(/\n/g, "<br>")}</p>`;
  return { subject: c.subject, text: c.body, html };
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/emails/verificacion.ts
```

```bash
git commit -m "feat(emails): matrícula verification submit/approve/reject templates"
```

---

## Task 8: Submit server action

**Files:**
- Create: `src/app/[locale]/(portal)/portal/verificacion/actions.ts`

- [ ] **Step 1: Write the action**

Create `src/app/[locale]/(portal)/portal/verificacion/actions.ts`:

```ts
"use server";

import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { buildVerificationSubmittedEmail } from "@/lib/emails/verificacion";

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "SCCA <info@sccompoundingacademy.com>";
const OPS_RECIPIENT =
  process.env.EMAIL_REPLY_TO ?? "info@sccompoundingacademy.com";

/**
 * Persists the Blob URL of a freshly-uploaded matrícula photo against the
 * signed-in student, resets their state to "pending", and notifies the
 * owner. Called by VerificacionForm AFTER the client upload to Blob
 * succeeds. Deletes any previous doc so re-uploads don't orphan blobs.
 */
export async function submitVerificationDoc(blobUrl: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  // Guard: only accept our own Blob URLs.
  if (!/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(blobUrl)) {
    throw new Error("Invalid upload URL");
  }

  const [user] = await db
    .select({ id: users.id, prev: users.verificationDocUrl, tier: users.tier })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
  if (!user || user.tier !== "student") throw new Error("Not a student enrollment");

  // Drop the previous upload (best-effort) before recording the new one.
  if (user.prev && user.prev !== blobUrl) {
    try {
      await del(user.prev);
    } catch (err) {
      console.error("[verificacion] failed to delete previous blob", err);
    }
  }

  await db
    .update(users)
    .set({
      verificationDocUrl: blobUrl,
      studentVerification: "pending",
      verificationSubmittedAt: new Date(),
      rejectedAt: null,
    })
    .where(eq(users.id, user.id));

  const key = process.env.RESEND_API_KEY;
  if (key) {
    const mail = buildVerificationSubmittedEmail({
      nombre: session.user.name ?? "",
      email: session.user.email,
    });
    try {
      await new Resend(key).emails.send({
        from: FROM_ADDRESS,
        to: OPS_RECIPIENT,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    } catch (err) {
      console.error("[verificacion] owner notification failed", err);
    }
  }

  revalidatePath("/es/portal/verificacion");
  revalidatePath("/en/portal/verificacion");
  revalidatePath("/es/portal/admin");
}
```

> **Note on `Resend`/`FROM_ADDRESS`:** the webhook uses a private `getResend()` helper and module-local `FROM_ADDRESS`. Those are not exported, so this file constructs `Resend` directly from `RESEND_API_KEY` and reads the same env vars — matching the webhook's defaults. If a later refactor exports a shared mailer, swap to it.

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(portal)/portal/verificacion/actions.ts"
```

```bash
git commit -m "feat(portal): submitVerificationDoc server action"
```

---

## Task 9: Upload page + client form + i18n copy

**Files:**
- Create: `src/app/[locale]/(portal)/portal/verificacion/page.tsx`
- Create: `src/app/[locale]/(portal)/portal/verificacion/VerificacionForm.tsx`
- Modify: `src/messages/es.json`, `src/messages/en.json`

- [ ] **Step 1: Add i18n keys**

In `src/messages/es.json`, inside the existing `"portal"` object, add a `"verificacion"` key:

```json
    "verificacion": {
      "eyebrow": "Verificación de estudiante",
      "title": "Sube tu matrícula",
      "intro": "Para activar tu acceso con la tarifa de estudiante, sube una foto o PDF de tu matrícula vigente. La revisamos manualmente y te avisamos por correo.",
      "instructions": "Acepta JPG, PNG o PDF, hasta 8 MB. Asegúrate de que se lea con claridad tu nombre y la institución.",
      "chooseFile": "Seleccionar archivo",
      "submit": "Enviar para revisión",
      "submitting": "Subiendo…",
      "pendingTitle": "Matrícula en revisión",
      "pendingBody": "Recibimos tu documento. Te avisaremos por correo en cuanto lo verifiquemos. Puedes cerrar esta página.",
      "rejectedTitle": "No pudimos verificar tu matrícula",
      "rejectedBody": "La foto anterior no nos sirvió. Por favor sube una foto clara y vigente.",
      "errorType": "Formato no válido. Usa JPG, PNG o PDF.",
      "errorSize": "El archivo supera el límite de 8 MB.",
      "errorUpload": "No pudimos subir el archivo. Verifica tu conexión e intenta de nuevo."
    }
```

In `src/messages/en.json`, inside `"portal"`, add the parallel block:

```json
    "verificacion": {
      "eyebrow": "Student verification",
      "title": "Upload your student ID",
      "intro": "To activate your student-rate access, upload a photo or PDF of your current student ID (matrícula). We review it manually and email you the result.",
      "instructions": "Accepts JPG, PNG, or PDF, up to 8 MB. Make sure your name and institution are clearly legible.",
      "chooseFile": "Choose file",
      "submit": "Submit for review",
      "submitting": "Uploading…",
      "pendingTitle": "Student ID under review",
      "pendingBody": "We received your document. We'll email you as soon as it's verified. You can close this page.",
      "rejectedTitle": "We couldn't verify your student ID",
      "rejectedBody": "The previous photo didn't work. Please upload a clear, current photo.",
      "errorType": "Invalid format. Use JPG, PNG, or PDF.",
      "errorSize": "The file exceeds the 8 MB limit.",
      "errorUpload": "We couldn't upload the file. Check your connection and try again."
    }
```

- [ ] **Step 2: Verify i18n parity**

```bash
pnpm check:i18n
```

Expected: PASS (es/en key sets match).

- [ ] **Step 3: Write the client form**

Create `src/app/[locale]/(portal)/portal/verificacion/VerificacionForm.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { upload } from "@vercel/blob/client";
import {
  VERIFICATION_ACCEPTED_TYPES,
  VERIFICATION_MAX_BYTES,
  VERIFICATION_BLOB_PREFIX,
} from "@/lib/portal/verification";
import { submitVerificationDoc } from "./actions";

export function VerificacionForm() {
  const t = useTranslations("portal.verificacion");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    if (!VERIFICATION_ACCEPTED_TYPES.includes(file.type as never)) {
      setError(t("errorType"));
      return;
    }
    if (file.size > VERIFICATION_MAX_BYTES) {
      setError(t("errorSize"));
      return;
    }

    setBusy(true);
    try {
      const blob = await upload(`${VERIFICATION_BLOB_PREFIX}/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/portal/verificacion/upload",
      });
      await submitVerificationDoc(blob.url);
      router.refresh();
    } catch {
      setError(t("errorUpload"));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <input
        ref={inputRef}
        type="file"
        required
        accept={VERIFICATION_ACCEPTED_TYPES.join(",")}
        className="block w-full text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-teal-deep file:px-4 file:py-2 file:text-sm file:font-semibold file:text-off-white hover:file:bg-teal"
      />
      <p className="text-gray-700 text-xs">{t("instructions")}</p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="bg-chartreuse text-teal-deep focus-visible:ring-chartreuse font-heading inline-flex h-11 items-center rounded-md px-5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
      >
        {busy ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Write the page**

Create `src/app/[locale]/(portal)/portal/verificacion/page.tsx`:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/glass/GlassCard";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isAdminEmail } from "@/lib/admin";
import { VerificacionForm } from "./VerificacionForm";

export const metadata: Metadata = {
  title: "Verificación · SCCA Portal",
  robots: { index: false, follow: false },
};

export default async function VerificacionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("portal.verificacion");

  const session = await auth();
  if (!session?.user?.email) redirect(`/${locale}/portal/login`);

  // Owners and any approved/non-student user belong on the dashboard, not here.
  if (isAdminEmail(session.user.email)) redirect(`/${locale}/portal`);

  const [user] = await db
    .select({
      tier: users.tier,
      status: users.studentVerification,
      doc: users.verificationDocUrl,
    })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user || user.tier !== "student" || user.status === "approved") {
    redirect(`/${locale}/portal`);
  }

  // "pending WITH a doc already submitted" → awaiting-review state, no form.
  const awaitingReview = user.status === "pending" && Boolean(user.doc);

  return (
    <Container className="max-w-lg py-16 sm:py-20">
      <GlassCard className="p-8 sm:p-10">
        <p className="font-heading text-teal-deep/80 text-xs font-semibold tracking-[0.18em] uppercase">
          {t("eyebrow")}
        </p>
        {awaitingReview ? (
          <>
            <h1 className="font-heading text-teal-deep mt-3 text-2xl font-bold sm:text-3xl">
              {t("pendingTitle")}
            </h1>
            <p className="text-gray-900 mt-3 text-base leading-relaxed">
              {t("pendingBody")}
            </p>
          </>
        ) : (
          <>
            <h1 className="font-heading text-teal-deep mt-3 text-2xl font-bold sm:text-3xl">
              {user.status === "rejected" ? t("rejectedTitle") : t("title")}
            </h1>
            <p className="text-gray-900 mt-3 text-base leading-relaxed">
              {user.status === "rejected" ? t("rejectedBody") : t("intro")}
            </p>
            <VerificacionForm />
          </>
        )}
      </GlassCard>
    </Container>
  );
}
```

- [ ] **Step 5: Typecheck + lint**

```bash
pnpm typecheck
```

```bash
pnpm lint
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(portal)/portal/verificacion/page.tsx" "src/app/[locale]/(portal)/portal/verificacion/VerificacionForm.tsx" src/messages/es.json src/messages/en.json
```

```bash
git commit -m "feat(portal): matrícula upload page, form, and copy"
```

---

## Task 10: Wire the gate into the dashboard + module page

**Files:**
- Modify: `src/app/[locale]/(portal)/portal/page.tsx`
- Modify: `src/app/[locale]/(portal)/portal/modulos/[id]/page.tsx`

- [ ] **Step 1: Gate the dashboard**

In `src/app/[locale]/(portal)/portal/page.tsx`, add the import:

```ts
import { resolveVerificationGate } from "@/lib/portal/verification-gate";
```

Then, immediately after the `if (!user) { redirect(...) }` block (line ~61) and before the `isOwner` cert logic, insert:

```ts
  // Student-tier users must pass matrícula verification before the
  // dashboard renders. Owners and the profesional tier are unaffected.
  if (
    resolveVerificationGate({
      isOwner: isAdminEmail(session.user.email),
      tier: user.tier,
      studentVerification: user.studentVerification,
    }) === "redirect-verificacion"
  ) {
    redirect(`/${locale}/portal/verificacion`);
  }
```

> Note: `isAdminEmail` is already imported in this file. The existing `const isOwner = isAdminEmail(...)` on line ~68 can stay; this block runs before it.

- [ ] **Step 2: Gate the module page (defense in depth)**

Open `src/app/[locale]/(portal)/portal/modulos/[id]/page.tsx`. It already fetches the user row and computes `isOwner` for `resolveModuleAccess`. Add the import:

```ts
import { resolveVerificationGate } from "@/lib/portal/verification-gate";
```

Immediately after the user row is fetched and `isOwner` is known (and before/alongside the `resolveModuleAccess` call), insert:

```ts
  if (
    resolveVerificationGate({
      isOwner,
      tier: user.tier,
      studentVerification: user.studentVerification,
    }) === "redirect-verificacion"
  ) {
    redirect(`/${locale}/portal/verificacion`);
  }
```

> If the local variable names differ (e.g. the user row is `me` or `isOwner` is inlined), adapt the field accesses to the names already in that file. The `redirect` and `locale` are already in scope on every portal page.

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 4: Run the full unit suite**

```bash
pnpm test
```

Expected: PASS (includes the new gate + initial-verification tests).

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(portal)/portal/page.tsx" "src/app/[locale]/(portal)/portal/modulos/[id]/page.tsx"
```

```bash
git commit -m "feat(portal): redirect unverified student-tier users to verificación"
```

---

## Task 11: Admin approve/reject actions (TDD on field logic)

The actions do I/O (DB, Blob, email), so we test the **pure state transition** they apply and assert the action calls it. Extract a tiny pure helper for the field patch, test it, then write the actions using it.

**Files:**
- Create: `src/lib/portal/verification-decision.ts`
- Test: `tests/unit/verification-decision.test.ts`
- Modify: `src/app/[locale]/(portal)/portal/admin/actions.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/verification-decision.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { verificationDecisionPatch } from "@/lib/portal/verification-decision";

describe("verificationDecisionPatch", () => {
  it("approves: status approved, verifiedAt set, doc cleared", () => {
    const now = new Date("2026-06-02T12:00:00Z");
    expect(verificationDecisionPatch("approved", now)).toEqual({
      studentVerification: "approved",
      verifiedAt: now,
      rejectedAt: null,
      verificationDocUrl: null,
    });
  });

  it("rejects: status rejected, rejectedAt set, doc cleared", () => {
    const now = new Date("2026-06-02T12:00:00Z");
    expect(verificationDecisionPatch("rejected", now)).toEqual({
      studentVerification: "rejected",
      verifiedAt: null,
      rejectedAt: now,
      verificationDocUrl: null,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run tests/unit/verification-decision.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/portal/verification-decision.ts`:

```ts
/**
 * The column patch applied to a `user` row when the owner approves or
 * rejects a matrícula. In both cases the document URL is cleared — we keep
 * only the outcome and a timestamp, never the document itself.
 */
export function verificationDecisionPatch(
  decision: "approved" | "rejected",
  now: Date,
) {
  return {
    studentVerification: decision,
    verifiedAt: decision === "approved" ? now : null,
    rejectedAt: decision === "rejected" ? now : null,
    verificationDocUrl: null,
  } as const;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm vitest run tests/unit/verification-decision.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add the actions**

In `src/app/[locale]/(portal)/portal/admin/actions.ts`, add imports at the top:

```ts
import { del } from "@vercel/blob";
import { Resend } from "resend";
import { users } from "@/lib/db/schema";
import { verificationDecisionPatch } from "@/lib/portal/verification-decision";
import {
  buildVerificationApprovedEmail,
  buildVerificationRejectedEmail,
} from "@/lib/emails/verificacion";
```

> The file already imports `eq` from drizzle-orm, `revalidatePath`, `db`, `auth`, `isAdminEmail`, and has `requireAdmin()`. Reuse them.

Append these two functions to the file:

```ts
const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "SCCA <info@sccompoundingacademy.com>";

/**
 * Shared internals for the two decisions: verify admin, look up the row,
 * apply the field patch, delete the document blob (best-effort), and email
 * the student. `locale` decides the email language; default es.
 */
async function decideVerification(
  userId: string,
  decision: "approved" | "rejected",
): Promise<void> {
  await requireAdmin();

  const [row] = await db
    .select({ email: users.email, doc: users.verificationDocUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) throw new Error("User not found");

  await db
    .update(users)
    .set(verificationDecisionPatch(decision, new Date()))
    .where(eq(users.id, userId));

  // Best-effort blob cleanup — DB status is the source of truth.
  if (row.doc) {
    try {
      await del(row.doc);
    } catch (err) {
      console.error("[verificacion] blob delete failed", err);
    }
  }

  const key = process.env.RESEND_API_KEY;
  if (key && row.email) {
    const mail =
      decision === "approved"
        ? buildVerificationApprovedEmail("es")
        : buildVerificationRejectedEmail("es");
    try {
      await new Resend(key).emails.send({
        from: FROM_ADDRESS,
        to: row.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    } catch (err) {
      console.error("[verificacion] student email failed", err);
    }
  }

  revalidatePath("/es/portal/admin");
}

export async function approveStudentVerification(userId: string): Promise<void> {
  await decideVerification(userId, "approved");
}

export async function rejectStudentVerification(userId: string): Promise<void> {
  await decideVerification(userId, "rejected");
}
```

> **Locale note:** the student's preferred locale is not stored on `users`. The decision emails default to Spanish (the academy's primary language). A future column `users.locale` could make this exact — out of scope here.

- [ ] **Step 6: Typecheck + run unit suite**

```bash
pnpm typecheck
```

```bash
pnpm test
```

Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/portal/verification-decision.ts tests/unit/verification-decision.test.ts "src/app/[locale]/(portal)/portal/admin/actions.ts"
```

```bash
git commit -m "feat(admin): approve/reject student verification actions"
```

---

## Task 12: Admin review queue UI

**Files:**
- Modify: `src/app/[locale]/(portal)/portal/admin/page.tsx`

- [ ] **Step 1: Query pending verifications**

In `src/app/[locale]/(portal)/portal/admin/page.tsx`, update the import on line 14 to include the new actions:

```ts
import {
  approveReview,
  archiveReview,
  approveStudentVerification,
  rejectStudentVerification,
} from "./actions";
```

After the `certRows` query block (around line 116), add:

```ts
  const pendingVerifications = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      docUrl: users.verificationDocUrl,
      submittedAt: users.verificationSubmittedAt,
    })
    .from(users)
    .where(
      and(
        eq(users.studentVerification, "pending"),
        isNotNull(users.verificationDocUrl),
      ),
    )
    .orderBy(desc(users.verificationSubmittedAt));
```

Update the drizzle import on line 3 to include `and`:

```ts
import { and, desc, eq, isNotNull } from "drizzle-orm";
```

- [ ] **Step 2: Render the queue section**

Insert this section in the JSX immediately after the closing `)}` of the "Pending reviews" section (around line 230), before the `{/* Reviews */}` card:

```tsx
      {/* Pending student verifications — matrícula uploaded, awaiting decision */}
      {pendingVerifications.length > 0 && (
        <section aria-labelledby="verif-pendientes-heading" className="mt-12">
          <h2
            id="verif-pendientes-heading"
            className="font-heading text-teal-deep text-xl font-semibold sm:text-2xl"
          >
            Verificación de estudiantes ({pendingVerifications.length})
          </h2>
          <p className="text-gray-700 mt-2 text-sm">
            Estos estudiantes subieron su matrícula. Aprueba para darles acceso,
            o rechaza para pedir otra foto. La imagen se elimina al decidir.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pendingVerifications.map((v) => (
              <li
                key={v.id}
                className="border-gray-300 rounded-lg border bg-white p-5 shadow-sm"
              >
                <p className="font-heading text-teal-deep text-base font-semibold">
                  {v.name ?? "Estudiante"}
                </p>
                <p className="text-gray-700 text-xs">{v.email}</p>
                <p className="text-gray-700 mt-1 text-xs">
                  Subida: {fmtDate(v.submittedAt)}
                </p>
                {v.docUrl && (
                  <a
                    href={v.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block"
                  >
                    {/* Image OR a PDF link, depending on the upload. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.docUrl}
                      alt={`Matrícula de ${v.name ?? v.email}`}
                      className="border-gray-300 max-h-64 w-full rounded-md border object-contain"
                    />
                  </a>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <form action={approveStudentVerification.bind(null, v.id)}>
                    <button
                      type="submit"
                      className="bg-chartreuse text-teal-deep focus-visible:ring-chartreuse font-heading inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      Aprobar
                    </button>
                  </form>
                  <form action={rejectStudentVerification.bind(null, v.id)}>
                    <button
                      type="submit"
                      className="border-gray-300 text-gray-900 hover:bg-gray-100 focus-visible:ring-teal-deep font-heading inline-flex h-10 items-center rounded-md border bg-white px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      Rechazar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
```

> **PDF caveat:** an uploaded PDF won't render in `<img>`. The wrapping `<a>` link still opens it in a new tab, which is acceptable for review. A `.pdf`-aware preview is out of scope.

- [ ] **Step 3: Typecheck + lint**

```bash
pnpm typecheck
```

```bash
pnpm lint
```

Expected: both PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(portal)/portal/admin/page.tsx"
```

```bash
git commit -m "feat(admin): student matrícula verification review queue"
```

---

## Task 13: Privacy policy copy

**Files:**
- Modify: `src/messages/es.json`, `src/messages/en.json`

- [ ] **Step 1: Extend the data-collection disclosure**

Locate the privacy-policy "information we collect" body (es.json line ~92, en.json line ~92 — the section starting "Recopilamos la información…" / "We collect the information…"). Append one sentence to that `body` string, before the closing newline of the first paragraph:

ES — add to the list of collected data: ` Para estudiantes que solicitan la tarifa reducida, una foto o copia de la matrícula estudiantil, que se utiliza únicamente para verificar su elegibilidad y se elimina una vez completada la verificación.`

EN — add the parallel sentence: ` For students requesting the reduced rate, a photo or copy of the student ID (matrícula), used solely to verify eligibility and deleted once verification is complete.`

- [ ] **Step 2: Verify i18n parity (structure unchanged, values edited)**

```bash
pnpm check:i18n
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/messages/es.json src/messages/en.json
```

```bash
git commit -m "docs(legal): disclose matrícula collection + deletion in privacy policy"
```

---

## Task 14: Final verification + STATUS update

**Files:**
- Modify: `STATUS.md`

- [ ] **Step 1: Run the full check suite**

```bash
pnpm typecheck
```

```bash
pnpm lint
```

```bash
pnpm test
```

```bash
pnpm check:i18n
```

Expected: all PASS.

- [ ] **Step 2: Build (catches App Router issues the above miss)**

```bash
pnpm build
```

Expected: build succeeds; `/[locale]/portal/verificacion` and `/api/portal/verificacion/upload` appear in the route list.

- [ ] **Step 3: Update STATUS.md**

In `STATUS.md`, change the "Student-tier verification" row (line ~125) to reflect that Phase B shipped: matrícula photo upload gating student-tier access, owner review in `/portal/admin`, Vercel Blob storage deleted on decision. Add a note that `BLOB_READ_WRITE_TOKEN` and a Blob store are required envs.

- [ ] **Step 4: Commit**

```bash
git add STATUS.md
```

```bash
git commit -m "docs(status): student matrícula verification shipped (Phase B)"
```

- [ ] **Step 5: Push the branch**

```bash
git push -u origin feat/student-matricula-verification
```

> **Manual deploy checklist (owner, in Vercel):**
> 1. Create a Blob store on `sccompoundingacademy-web`; add `BLOB_READ_WRITE_TOKEN` to Production + Preview.
> 2. Confirm `pnpm db:migrate` ran (Neon has the new columns).
> 3. Smoke test: pay as a student (or flip a test row to `tier='student', student_verification='pending'`), confirm redirect to `/portal/verificacion`, upload, approve in admin, confirm access.

---

## Manual QA script (post-deploy)

1. **Profesional tier unaffected:** sign in as a profesional enrollee → dashboard renders, no verification redirect.
2. **Student gate:** student-tier user with `pending` + no doc → `/portal` redirects to `/portal/verificacion`; form shown.
3. **Upload:** upload a JPG → "en revisión" state; owner gets the notification email; admin queue shows the image.
4. **Approve:** owner approves → student gets approval email, `/portal/verificacion` now redirects to dashboard, content accessible; blob deleted (admin image link 404s).
5. **Reject:** owner rejects → student gets re-upload email; `/portal/verificacion` shows the "rejected" copy + form; re-upload returns them to `pending`.
6. **Owner bypass:** `ADMIN_EMAILS` user never sees the verification gate.

---

## Self-Review

- **Spec coverage:** §1 data model → Task 1; §2 blob storage → Tasks 5/6/8 + delete in 8/11; §3 upload page → Task 9; §4 access gate → Tasks 2/10; §5 admin review → Tasks 11/12; §6 emails → Tasks 7/8/11; §7 error handling → best-effort blob deletes (8/11), inline form errors (9), idempotent webhook (4); §8 testing → Tasks 2/4/11 + QA script; §9 privacy/retention → doc cleared on decision (11) + Task 13; §10 i18n → Task 9 + 13. All covered.
- **Placeholder scan:** no TBD/TODO; every code step has complete code.
- **Type consistency:** `resolveVerificationGate` input shape matches the columns from Task 1; `verificationDecisionPatch` keys match the schema columns; action names (`approveStudentVerification`/`rejectStudentVerification`) match between Tasks 11 and 12; `submitVerificationDoc` matches between Tasks 8 and 9.
