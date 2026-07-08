# Inscripción API: orphaned-blob cleanup + locale-aware errors

**Date:** 2026-07-08
**Status:** Approved design — pending implementation plan

## Goal

Close the two remaining Important findings from the enrollment audit
(`docs/bug-reports/2026-07-08-enrollment-cohort-audit.md`):

- **I4** — the matrícula identity-document photo uploads to Vercel Blob
  client-side BEFORE the POST to `/api/inscripcion`; every server rejection
  (Turnstile, invalid/closed cohort, audience mismatch, duplicate 409, insert
  failure…) leaves the blob orphaned — PII with no DB reference and no cleanup.
- **I5** — the route returns hardcoded Spanish strings on ~12 failure paths;
  an EN-locale user sees raw Spanish (the form renders `json.error` verbatim).

## Verified facts the design rests on

- `InscripcionForm.tsx` re-uploads the photo on EVERY submit attempt (the
  upload lives inside the submit handler; `matriculaDocUrl` starts empty each
  time, no previous-URL reuse). Deleting a rejected attempt's blob therefore
  cannot break a retry — the retry mints a fresh blob.
- Route ordering: rate limit → `req.json()` → Zod parse → Turnstile → catalogue
  checks → audience → blob-URL check → tier branches. The 429 fires BEFORE the
  body is read, so no blob URL is available there (accepted leak; every other
  rejection has the URL in hand).
- Precedent: the approve/reject verification flow already calls `del()` from
  `@vercel/blob` server-side (`verificacion/actions.ts`,
  `apply-verification-decision.ts`), so the token/permission path exists.

## Design

### 1. `src/lib/inscripcion/blob-cleanup.ts` (new leaf)

```ts
import { del } from "@vercel/blob";

/** Matches our own Blob store hosts only — the same pattern the API route
 *  uses to accept an upload. Never delete an arbitrary user-supplied URL. */
export const MATRICULA_BLOB_URL_RE =
  /^https:\/\/[a-z0-9]+\.(?:public|private)\.blob\.vercel-storage\.com\//;

/**
 * Best-effort deletion of an orphaned matrícula blob after the server
 * rejects an inscription. The form re-uploads on every submit attempt, so a
 * rejected attempt's blob is garbage the moment the rejection is sent.
 * Never throws — cleanup must not change the API response. No-op for empty
 * or foreign URLs.
 */
export async function discardMatriculaBlob(url: string | null | undefined): Promise<void> {
  const candidate = (url ?? "").trim();
  if (!MATRICULA_BLOB_URL_RE.test(candidate)) return;
  try {
    await del(candidate);
  } catch (err) {
    console.warn("[inscripcion] failed to discard orphaned matricula blob", err);
  }
}
```

The route's local `BLOB_URL_RE` is replaced by importing
`MATRICULA_BLOB_URL_RE` from this module (single source).

### 2. Route wiring (`src/app/api/inscripcion/route.ts`)

`await discardMatriculaBlob(...)` before returning on every post-parse
rejection:

| Rejection | URL source |
|---|---|
| Zod 400 | loose read from the raw `body` (`(body as {matricula_doc_url?: unknown})`, string-guarded) |
| Turnstile 403 | `data.matricula_doc_url` |
| invalid course/cohort 400 | `data.matricula_doc_url` |
| cohort closed 400 | `data.matricula_doc_url` |
| audience mismatch 400 | `data.matricula_doc_url` |
| matrícula-required 400 | no-op by construction (URL failed the RE) — still call for uniformity |
| student duplicate 409 | `data.matricula_doc_url` |
| student insert-failure 500 | `data.matricula_doc_url` |

Not wired: the 429 (body unread) and invalid-JSON 400 (unparseable); the
profesional-branch failures carry no blob (tier gate means
`matricula_doc_url` is empty) — the helper no-ops if called, so wiring them is
optional and NOT required. The success paths obviously keep the blob (it is
now referenced by the pending row).

### 3. `src/lib/inscripcion/api-errors.ts` (new leaf, I5)

Mirrors the existing `inscripcionErrorMessage` pattern:

```ts
export type InscripcionApiErrorCode =
  | "rate-limited"
  | "turnstile"
  | "invalid-cohort"
  | "cohort-closed"
  | "matricula-required"
  | "already-enrolled"
  | "register-failed"
  | "invalid-tier"
  | "price-missing"
  | "cohort-full"
  | "checkout-failed";

export function inscripcionApiError(
  code: InscripcionApiErrorCode,
  locale: "es" | "en",
): string { /* table lookup */ }
```

The ES strings are the EXACT current route strings (verbatim — no copy
change for existing users); the EN strings are faithful translations. The
route replaces each hardcoded literal with `inscripcionApiError(code, locale)`.

Locale resolution per site:
- Post-parse paths: `data.locale === "en" ? "en" : "es"`.
- Zod 400: the existing loose-locale derivation (already in the route).
- 429 (pre-body): derive from the `Accept-Language` header — `en` when the
  header's first language starts with `en`, else `es`.
- Invalid-JSON 400: leave as-is ("Invalid JSON" — a client bug, not user copy).

The client (`InscripcionForm.tsx`) is unchanged — it already renders
`json.error` verbatim.

## Error handling

`discardMatriculaBlob` never throws (all failures logged + swallowed); the
API response is byte-identical in shape, only the message language changes
where the locale is EN.

## Testing

- **Unit — `blob-cleanup`:** valid store URL → `del` called with it; foreign
  URL / empty / null → `del` NOT called; `del` throwing → resolves without
  throwing (mock `@vercel/blob`'s `del` — this is a thin wrapper, mocking the
  SDK boundary is appropriate here).
- **Unit — `api-errors`:** every code returns a non-empty string in BOTH
  locales; ES strings equal the previous route literals (pin verbatim).
- **Existing route tests** (`tests/unit/inscripcion-student-branch.test.ts`
  and any others asserting messages): update to the new source of truth —
  assert via `inscripcionApiError(code, "es")` rather than re-hardcoding.
- `tsc` + `lint` + full suite green; **`pnpm build`** once (App Router change).

## Risks / gates

- **No DB migration.** Normal deploy.
- `del()` requires `BLOB_READ_WRITE_TOKEN` — already present in prod (the
  approve/reject flow uses it).
- Cleanup is fire-and-forget-with-await (awaited, but never throws) — worst
  case a blob survives (status quo today), never a broken response.
- Threat model note: cleanup deletes the client-supplied URL when it matches
  our store host, without proving it was uploaded in this request. Deleting a
  VICTIM's referenced blob would require guessing their URL (random store id +
  random pathname suffix — unguessable without DB/admin-email access), and
  `del()` is scoped to our own token, so foreign stores are unreachable. The
  8/min/IP rate limit caps abuse. Accepted residual risk.
- Copy risk is zero for ES (verbatim strings); EN strings are new copy.

## Files touched

- `src/lib/inscripcion/blob-cleanup.ts` (new).
- `src/lib/inscripcion/api-errors.ts` (new).
- `src/app/api/inscripcion/route.ts` (wire cleanup + replace literals + import RE).
- Tests: `tests/unit/blob-cleanup.test.ts`, `tests/unit/inscripcion-api-errors.test.ts`,
  updates to existing route tests.
