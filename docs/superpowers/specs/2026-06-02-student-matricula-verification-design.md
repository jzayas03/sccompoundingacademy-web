# Student tier verification via matrícula photo — design

**Date:** 2026-06-02
**Status:** Approved (brainstorming) — pending implementation plan
**Scope:** Add a mandatory student-ID ("matrícula") photo verification step that
gates portal access for every student-tier enrollee.

---

## Problem

The student price tier ($495 vs the $2,350 profesional price) is currently
**ungated**. Anyone can select "Estudiante" at `/inscripcion` and pay the
reduced price — the client choice is trusted and only persisted to Stripe
metadata (`InscripcionForm.tsx:147`). The institutional-email allowlist
(`src/lib/student-email-allowlist.ts`) exists but is **not wired** into the
flow, and the "Path B" manual Student-ID check is described in comments but
never implemented. `STATUS.md:125` lists "Student ID upload UI" as deferred
Phase B work.

This is the missing control: require a photo of the student's matrícula as
evidence of active student status before they can access course content.

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| **When** | After payment, inside the portal. Access is blocked until the photo is uploaded **and** the owner approves. |
| **Storage** | Vercel Blob (simple public-with-random-suffix), reviewed in `/portal/admin`. Blob deleted immediately on the approve/reject decision. |
| **Rejection** | Student stays blocked and may re-upload; refund / charge-the-difference is handled manually by the owner in Stripe. |
| **Scope** | Every student-tier enrollee must upload — no exemption for institutional (`.edu`) emails. Profesional tier is untouched. |
| **Data model** | New columns on the existing `user` table (Approach A), not a separate table. |

### Vercel Blob privacy note

Vercel Blob does **not** offer private/signed URLs — blobs are technically
public but addressed by an unguessable random-suffixed URL. Mitigations:

1. Random suffix on the pathname (`addRandomSuffix`).
2. The URL is rendered **only** inside the admin server component (already
   gated by session + `isAdminEmail`); it is never returned to the student
   after upload.
3. The blob is **deleted immediately** when the owner approves or rejects, so
   the document lives minutes-to-hours, never permanently.

A stronger-privacy alternative (authenticated route that proxies the blob
bytes) was considered and deferred as unnecessary for the academy's scale.

---

## Architecture

### 1. Data model (Drizzle migration)

Add to the existing `user` table (`src/lib/db/schema.ts`):

```ts
export const studentVerificationStatus = pgEnum("student_verification_status", [
  "pending",
  "approved",
  "rejected",
]);

// on users:
studentVerification: studentVerificationStatus("student_verification"), // null = profesional tier
verificationDocUrl: text("verification_doc_url"),       // blob URL; cleared (null) on decision
verificationSubmittedAt: timestamp("verification_submitted_at", { mode: "date" }),
verifiedAt: timestamp("verified_at", { mode: "date" }),
rejectedAt: timestamp("rejected_at", { mode: "date" }),
```

- Nullable everywhere: existing rows and profesional-tier rows have no values.
- The Stripe webhook (`src/app/api/webhooks/stripe/route.ts`) sets
  `studentVerification = 'pending'` when it persists `tier = 'student'`;
  profesional → leaves it `null`. Idempotent (re-running on the same event is
  a no-op for an already-set value).

### 2. Storage — Vercel Blob

- New dependency `@vercel/blob`; env var `BLOB_READ_WRITE_TOKEN` (prod +
  preview). Owner creates the Blob store in the Vercel dashboard.
- File uploaded **client-side, directly to Blob** via `@vercel/blob/client`
  `upload()`, using a server route `/api/portal/verificacion/upload` that
  issues the client token via `handleUpload`. This bypasses the ~4.5 MB
  serverless function body limit (phone photos routinely exceed it).
- Accepted types: `image/jpeg`, `image/png`, `application/pdf`. Max ~8 MB.
  Single file. Validated both client-side (UX) and in the token-issuing
  route (`allowedContentTypes`, `maximumSizeInBytes`).

### 3. Upload page — `/portal/verificacion`

- ASCII directory name `verificacion` (no accent) — honors the known
  next-intl/Vercel routing gotcha where non-ASCII `app/` dir names 404 in
  production. Spanish-native URL, if desired, is mapped via next-intl
  `pathnames` (same fix used for `resenas`).
- Server component resolves the student's state:
  - `approved` → redirect to `/portal`.
  - `pending` with a doc already submitted → "en revisión" state (no form).
  - `pending` with no doc, or `rejected` → render `VerificacionForm`.
- On successful upload: persist `verificationDocUrl`, keep status `pending`,
  stamp `verificationSubmittedAt`, send the owner notification email.
- Re-upload while `pending`/`rejected`: delete the previous blob first to
  avoid orphans, then store the new one and reset status to `pending`.

### 4. Access gate

- Add a pure helper `resolveVerificationGate(user, isOwner)` →
  `"allow" | "redirect-verificacion"`, tested in isolation.
- Wire it into the existing portal guard (`resolveModuleAccess` in
  `src/lib/portal/module-access.ts` + the portal layout/dashboard) so any
  student-tier user who is not `approved` is redirected to
  `/portal/verificacion` from the dashboard, modules, pre/post-tests, and the
  certificate route.
- Owner emails (`ADMIN_EMAILS` via `isAdminEmail`) bypass, matching every
  existing gate. No redirect loop: `/portal/verificacion`, `/portal/login`,
  and the magic-link verify page are excluded.

### 5. Admin review — `/portal/admin`

New "Verificación de estudiantes" section: a queue of student-tier users with
status `pending` and a submitted document. Each row shows name, email, the
rendered image, and **Aprobar / Rechazar** buttons. Server actions mirror the
existing `approveReview` / `archiveReview` pattern (both call `requireAdmin()`):

- `approveStudentVerification(userId)` → status `approved`, `verifiedAt = now`,
  delete blob, clear `verificationDocUrl`, send approval email, `revalidatePath`.
- `rejectStudentVerification(userId)` → status `rejected`, `rejectedAt = now`,
  delete blob, clear `verificationDocUrl`, send "re-upload" email, revalidate.

### 6. Notifications (Resend, bilingual es/en)

Reuse `src/lib/emails/` infrastructure and per-locale rendering:

- **To owner:** "Nuevo estudiante subió matrícula para revisión" + admin link.
- **To student (approved):** "Verificación aprobada — ya tienes acceso" +
  portal link.
- **To student (rejected):** "No pudimos verificar — vuelve a subir" +
  verificacion link.

### 7. Error handling

- Upload failures (type, size, network) surfaced inline in `VerificacionForm`.
- Blob delete failure on approve/reject is logged but does **not** block the
  status change — the DB status is the source of truth (a stray blob is
  acceptable and self-limited by the random URL).
- Webhook stays idempotent when setting `pending`.

### 8. Testing

- **Unit:** `resolveVerificationGate` (pending → block, approved → allow,
  rejected → block, owner → bypass) and the extended `resolveModuleAccess`,
  in the style of `tests/unit/module-access.test.ts`.
- **Unit:** admin server actions set the right fields and enforce
  `requireAdmin()`.
- **e2e (optional, Playwright):** an unverified student hitting `/portal` is
  redirected to `/portal/verificacion`.

### 9. Privacy / retention

- The document blob is deleted on the approve/reject decision; only booleans
  and timestamps persist. `verificationDocUrl` is nullable and cleared.
- **Update the Privacy Policy** (`messages/es.json` + `en.json`) to declare
  collection of the student-verification document and its deletion after
  verification.

### 10. i18n / copy

- New keys under `portal.verificacion` (es + en): title, instructions, upload
  button, "en revisión" state, "rechazada — vuelve a subir" state, success,
  and error strings.
- Admin section labels (es-first, the admin UI's convention).

---

## New / changed surface (summary)

| Area | File(s) |
|---|---|
| Schema + migration | `src/lib/db/schema.ts`, new `drizzle/` migration |
| Webhook sets `pending` | `src/app/api/webhooks/stripe/route.ts` |
| Blob token route | `src/app/api/portal/verificacion/upload/route.ts` |
| Upload page + form | `src/app/[locale]/(portal)/portal/verificacion/page.tsx`, `VerificacionForm.tsx` |
| Gate helper | `src/lib/portal/verification-gate.ts`, `module-access.ts` |
| Admin queue + actions | `portal/admin/page.tsx`, `portal/admin/actions.ts` |
| Emails | `src/lib/emails/*` |
| Copy | `src/messages/{es,en}.json` (portal + privacy) |
| Tests | `tests/unit/*`, optional `tests/e2e/*` |
| Dep + env | `@vercel/blob`, `BLOB_READ_WRITE_TOKEN` |

## Operational steps (owner)

1. Create a Vercel Blob store on the `sccompoundingacademy-web` project.
2. Add `BLOB_READ_WRITE_TOKEN` to Production and Preview environments.

## Out of scope (YAGNI)

- Per-attempt audit history (Approach B's separate table) — revisit if abuse
  appears.
- Automated OCR / authenticity checks on the document.
- Institutional-email auto-approval — explicitly rejected; all student-tier
  enrollees upload.
