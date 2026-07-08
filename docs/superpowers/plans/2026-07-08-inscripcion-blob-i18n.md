# Inscripción Blob Cleanup + Locale-Aware Errors — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete orphaned matrícula PII blobs when `/api/inscripcion` rejects a submission, and localize the route's ~12 hardcoded Spanish error strings.

**Architecture:** Two new pure-ish leaf modules — `blob-cleanup.ts` (best-effort `del()` wrapper that never throws, gated on our Blob-store URL pattern) and `api-errors.ts` (es/en message table keyed by error code, ES strings verbatim-identical to today's literals) — then the route imports both: every post-parse rejection calls `discardMatriculaBlob(...)` before returning, and every hardcoded literal becomes `inscripcionApiError(code, locale)`.

**Tech Stack:** Next.js App Router route handler, `@vercel/blob` (`del`), Vitest.

## Global Constraints

- **No DB migration.** Normal deploy.
- **ES strings are VERBATIM today's literals** — zero copy change for Spanish users. EN strings are new translations.
- `discardMatriculaBlob` **never throws** and never changes the API response; it deletes ONLY URLs matching `MATRICULA_BLOB_URL_RE` (our store hosts) — never an arbitrary user-supplied URL.
- The route's local `BLOB_URL_RE` is REPLACED by importing `MATRICULA_BLOB_URL_RE` (single source; the accept-check and the delete-check must be the same pattern).
- The 429 rate-limit path derives locale from the `Accept-Language` header (body unread there); it does NOT get blob cleanup (no URL available). The invalid-JSON 400 keeps its `"Invalid JSON"` literal (client bug, not user copy).
- The client (`InscripcionForm.tsx`) is UNCHANGED.
- Any test file that imports the route (directly or transitively) must mock `@vercel/blob` (`vi.mock("@vercel/blob", () => ({ del: vi.fn().mockResolvedValue(undefined) }))` — same pattern as `tests/unit/apply-verification-decision.test.ts:45`).
- Branch `fix/inscripcion-blob-i18n` (already created; design doc committed). Commands: `pnpm vitest run <path>`; full `pnpm vitest run`; `pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm build` in Task 2.

---

### Task 1: Leaf modules + unit tests

**Files:**
- Create: `src/lib/inscripcion/blob-cleanup.ts`
- Create: `src/lib/inscripcion/api-errors.ts`
- Test: `tests/unit/blob-cleanup.test.ts` (create)
- Test: `tests/unit/inscripcion-api-errors.test.ts` (create)

**Interfaces:**
- Consumes: `del` from `@vercel/blob` (already a dependency).
- Produces:
  - `MATRICULA_BLOB_URL_RE: RegExp`
  - `discardMatriculaBlob(url: string | null | undefined): Promise<void>`
  - `type InscripcionApiErrorCode` (12 codes, below)
  - `inscripcionApiError(code: InscripcionApiErrorCode, locale: "es" | "en"): string`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/blob-cleanup.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@vercel/blob", () => ({ del: vi.fn().mockResolvedValue(undefined) }));

import { del } from "@vercel/blob";
import { discardMatriculaBlob, MATRICULA_BLOB_URL_RE } from "@/lib/inscripcion/blob-cleanup";

const OURS = "https://abc123.private.blob.vercel-storage.com/matricula-x.jpg";
const OURS_PUBLIC = "https://abc123.public.blob.vercel-storage.com/matricula-y.jpg";

describe("discardMatriculaBlob", () => {
  beforeEach(() => {
    vi.mocked(del).mockClear();
    vi.mocked(del).mockResolvedValue(undefined as never);
  });

  it("deletes a private-store URL", async () => {
    await discardMatriculaBlob(OURS);
    expect(del).toHaveBeenCalledWith(OURS);
  });

  it("deletes a public-store URL (legacy uploads)", async () => {
    await discardMatriculaBlob(OURS_PUBLIC);
    expect(del).toHaveBeenCalledWith(OURS_PUBLIC);
  });

  it("no-ops on empty, null, undefined, and foreign URLs", async () => {
    await discardMatriculaBlob("");
    await discardMatriculaBlob(null);
    await discardMatriculaBlob(undefined);
    await discardMatriculaBlob("https://evil.example.com/x.jpg");
    // Same-suffix but wrong shape must not match either.
    await discardMatriculaBlob("https://evil.com/?u=abc.private.blob.vercel-storage.com/");
    expect(del).not.toHaveBeenCalled();
  });

  it("never throws when del rejects", async () => {
    vi.mocked(del).mockRejectedValueOnce(new Error("network"));
    await expect(discardMatriculaBlob(OURS)).resolves.toBeUndefined();
  });
});

describe("MATRICULA_BLOB_URL_RE", () => {
  it("anchors at the start (no substring matches)", () => {
    expect(MATRICULA_BLOB_URL_RE.test(OURS)).toBe(true);
    expect(MATRICULA_BLOB_URL_RE.test(`https://evil.com/${OURS}`)).toBe(false);
  });
});
```

Create `tests/unit/inscripcion-api-errors.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  inscripcionApiError,
  type InscripcionApiErrorCode,
} from "@/lib/inscripcion/api-errors";

const CODES: InscripcionApiErrorCode[] = [
  "rate-limited", "turnstile", "invalid-cohort", "cohort-closed",
  "matricula-required", "already-enrolled", "register-failed", "invalid-tier",
  "price-missing", "cohort-full", "checkout-no-url", "checkout-failed",
];

describe("inscripcionApiError", () => {
  it("returns a non-empty string for every code in both locales", () => {
    for (const code of CODES) {
      expect(inscripcionApiError(code, "es").length).toBeGreaterThan(0);
      expect(inscripcionApiError(code, "en").length).toBeGreaterThan(0);
      expect(inscripcionApiError(code, "es")).not.toBe(inscripcionApiError(code, "en"));
    }
  });

  it("ES strings are verbatim the route's historical literals", () => {
    expect(inscripcionApiError("rate-limited", "es")).toBe(
      "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
    );
    expect(inscripcionApiError("turnstile", "es")).toBe(
      "No pudimos verificar que eres una persona. Recarga la página e inténtalo de nuevo.",
    );
    expect(inscripcionApiError("invalid-cohort", "es")).toBe("Curso o cohorte inválido.");
    expect(inscripcionApiError("cohort-closed", "es")).toBe(
      "Cohorte cerrada para inscripciones.",
    );
    expect(inscripcionApiError("matricula-required", "es")).toBe(
      "Sube una foto de tu matrícula activa para inscribirte como estudiante.",
    );
    expect(inscripcionApiError("already-enrolled", "es")).toBe(
      "Ya tienes una inscripción registrada con este correo. Escríbenos si necesitas ayuda.",
    );
    expect(inscripcionApiError("register-failed", "es")).toBe(
      "No pudimos registrar tu matrícula. Intenta nuevamente o escríbenos.",
    );
    expect(inscripcionApiError("invalid-tier", "es")).toBe("Tier de precio inválido.");
    expect(inscripcionApiError("price-missing", "es")).toBe(
      "Servicio de cobro no configurado. Por favor escríbenos.",
    );
    expect(inscripcionApiError("cohort-full", "es")).toBe(
      "Este cohorte ya está lleno. Escríbenos y te avisamos del próximo cupo disponible.",
    );
    expect(inscripcionApiError("checkout-no-url", "es")).toBe(
      "Stripe no devolvió URL de checkout.",
    );
    expect(inscripcionApiError("checkout-failed", "es")).toBe(
      "No se pudo iniciar el cobro. Intenta nuevamente o escríbenos.",
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/unit/blob-cleanup.test.ts tests/unit/inscripcion-api-errors.test.ts`
Expected: FAIL — both `@/lib/inscripcion/blob-cleanup` and `@/lib/inscripcion/api-errors` unresolved.

- [ ] **Step 3: Implement `src/lib/inscripcion/blob-cleanup.ts`**

```ts
import { del } from "@vercel/blob";

/** Matches our own Blob store hosts only — the same pattern the API route
 *  uses to ACCEPT a matrícula upload. The accept-check and the delete-check
 *  must be one pattern, and we never delete an arbitrary user-supplied URL. */
export const MATRICULA_BLOB_URL_RE =
  /^https:\/\/[a-z0-9]+\.(?:public|private)\.blob\.vercel-storage\.com\//;

/**
 * Best-effort deletion of an orphaned matrícula blob after the server
 * rejects an inscription. The form re-uploads the photo on EVERY submit
 * attempt (the upload lives inside the submit handler), so a rejected
 * attempt's blob is garbage the moment the rejection is sent — deleting it
 * cannot break a retry. Never throws — cleanup must not change the API
 * response. No-op for empty or foreign URLs.
 */
export async function discardMatriculaBlob(
  url: string | null | undefined,
): Promise<void> {
  const candidate = (url ?? "").trim();
  if (!MATRICULA_BLOB_URL_RE.test(candidate)) return;
  try {
    await del(candidate);
  } catch (err) {
    console.warn("[inscripcion] failed to discard orphaned matricula blob", err);
  }
}
```

- [ ] **Step 4: Implement `src/lib/inscripcion/api-errors.ts`**

```ts
/**
 * Locale-aware error copy for /api/inscripcion.
 *
 * The form is `noValidate` and renders `json.error` verbatim, so the server
 * owns ALL user-facing error copy. The ES strings are verbatim the route's
 * historical literals (zero copy change for Spanish users); EN is a faithful
 * translation. Same pattern as `inscripcionErrorMessage` (field validation)
 * and `audienceMismatchMessage` (audience gate).
 */
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
  | "checkout-no-url"
  | "checkout-failed";

const MESSAGES: Record<InscripcionApiErrorCode, { es: string; en: string }> = {
  "rate-limited": {
    es: "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
    en: "Too many attempts. Please wait a moment and try again.",
  },
  turnstile: {
    es: "No pudimos verificar que eres una persona. Recarga la página e inténtalo de nuevo.",
    en: "We couldn't verify you're a person. Reload the page and try again.",
  },
  "invalid-cohort": {
    es: "Curso o cohorte inválido.",
    en: "Invalid course or cohort.",
  },
  "cohort-closed": {
    es: "Cohorte cerrada para inscripciones.",
    en: "This cohort is closed for enrollment.",
  },
  "matricula-required": {
    es: "Sube una foto de tu matrícula activa para inscribirte como estudiante.",
    en: "Upload a photo of your active enrollment document to register as a student.",
  },
  "already-enrolled": {
    es: "Ya tienes una inscripción registrada con este correo. Escríbenos si necesitas ayuda.",
    en: "There is already a registration under this email. Contact us if you need help.",
  },
  "register-failed": {
    es: "No pudimos registrar tu matrícula. Intenta nuevamente o escríbenos.",
    en: "We couldn't register your enrollment. Try again or contact us.",
  },
  "invalid-tier": {
    es: "Tier de precio inválido.",
    en: "Invalid pricing tier.",
  },
  "price-missing": {
    es: "Servicio de cobro no configurado. Por favor escríbenos.",
    en: "Payment service is not configured. Please contact us.",
  },
  "cohort-full": {
    es: "Este cohorte ya está lleno. Escríbenos y te avisamos del próximo cupo disponible.",
    en: "This cohort is full. Contact us and we'll let you know when a seat opens.",
  },
  "checkout-no-url": {
    es: "Stripe no devolvió URL de checkout.",
    en: "Stripe did not return a checkout URL.",
  },
  "checkout-failed": {
    es: "No se pudo iniciar el cobro. Intenta nuevamente o escríbenos.",
    en: "We couldn't start the payment. Try again or contact us.",
  },
};

export function inscripcionApiError(
  code: InscripcionApiErrorCode,
  locale: "es" | "en",
): string {
  return MESSAGES[code][locale];
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/blob-cleanup.test.ts tests/unit/inscripcion-api-errors.test.ts && pnpm exec tsc --noEmit`
Expected: PASS / clean.

- [ ] **Step 6: Commit**

```bash
git add src/lib/inscripcion/blob-cleanup.ts src/lib/inscripcion/api-errors.ts tests/unit/blob-cleanup.test.ts tests/unit/inscripcion-api-errors.test.ts
git commit -m "feat(inscripcion): blob-cleanup + locale-aware api-error leaves"
```

---

### Task 2: Route wiring + test updates + full verification

**Files:**
- Modify: `src/app/api/inscripcion/route.ts`
- Modify: any existing test that imports the route or asserts its ES literals (`tests/unit/inscripcion-student-branch.test.ts` — line ~199 asserts the duplicate string; check for others via `grep -rl "api/inscripcion/route" tests/`)

**Interfaces:**
- Consumes (from Task 1): `discardMatriculaBlob`, `MATRICULA_BLOB_URL_RE` from `@/lib/inscripcion/blob-cleanup`; `inscripcionApiError` from `@/lib/inscripcion/api-errors`.
- Produces: no new exports — route behavior only.

- [ ] **Step 1: Add imports and a request-locale helper to the route**

In `src/app/api/inscripcion/route.ts`, add imports:

```ts
import {
  discardMatriculaBlob,
  MATRICULA_BLOB_URL_RE,
} from "@/lib/inscripcion/blob-cleanup";
import { inscripcionApiError } from "@/lib/inscripcion/api-errors";
```

Add a small helper near the top of the file (module scope, above `POST`):

```ts
/** Locale for the 429 path, where the body is deliberately unread: cheap
 *  sniff of Accept-Language. Everywhere else the parsed body's `locale` wins. */
function headerLocale(req: Request): "es" | "en" {
  const al = req.headers.get("accept-language") ?? "";
  return al.trim().toLowerCase().startsWith("en") ? "en" : "es";
}
```

- [ ] **Step 2: Replace the literals and wire cleanup, path by path**

Work through the route top-to-bottom. `loc` below means the per-path locale expression stated for it. Pattern for each rejection: cleanup first (where a URL exists), then respond with the table message.

1. **429 rate limit (line ~96-101).** No body → no cleanup. Replace the literal:
```ts
  if (!rl.success) {
    return NextResponse.json(
      { error: inscripcionApiError("rate-limited", headerLocale(req)) },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }
```

2. **Invalid JSON (line ~107).** Unchanged (`"Invalid JSON"` stays).

3. **Zod 400 (lines ~110-126).** The block already derives a loose `locale` from the raw body. Before its `return`, add cleanup from the raw body:
```ts
    const rawUrl =
      typeof body === "object" && body !== null
        ? (body as { matricula_doc_url?: unknown }).matricula_doc_url
        : undefined;
    await discardMatriculaBlob(typeof rawUrl === "string" ? rawUrl : undefined);
```
(The existing `inscripcionErrorMessage(flattened, locale)` response is unchanged.)

After this point `data = parsed.data` exists. Define once, right after `const data = parsed.data;`:
```ts
  const loc: "es" | "en" = data.locale === "en" ? "en" : "es";
```
Then use `loc` in the paths below, and REPLACE the existing inline `data.locale === "en" ? "en" : "es"` in the audience-mismatch response with `loc`.

4. **Turnstile 403 (~135-146).** Add `await discardMatriculaBlob(data.matricula_doc_url);` before the return; message → `inscripcionApiError("turnstile", loc)`.

5. **Invalid course/cohort 400 (~153).** Cleanup + `inscripcionApiError("invalid-cohort", loc)`.

6. **Cohort closed 400 (~156).** Cleanup + `inscripcionApiError("cohort-closed", loc)`.

7. **Audience mismatch 400 (~159-164).** Add cleanup before the return (message already locale-aware via `audienceMismatchMessage`; just switch its arg to `loc`).

8. **Matrícula-required 400 (~176-181).** Replace the local `BLOB_URL_RE` const (~171-172) with the imported `MATRICULA_BLOB_URL_RE` (delete the local definition, keep the surrounding comment). Add `await discardMatriculaBlob(matriculaDocUrl);` before the return (no-op by construction — uniformity) and message → `inscripcionApiError("matricula-required", loc)`.

9. **Student duplicate 409 (~225).** Cleanup + `inscripcionApiError("already-enrolled", loc)`.

10. **Student insert-failure 500s (~242 and ~266).** Cleanup + `inscripcionApiError("register-failed", loc)` in both.

11. **Profesional duplicate 409 (~288).** No blob (profesional tier) — no cleanup call; message → `inscripcionApiError("already-enrolled", loc)`.

12. **Invalid tier 400 (~298)** → `inscripcionApiError("invalid-tier", loc)`. **Price missing 503 (~306)** → `inscripcionApiError("price-missing", loc)`. **Cohort full 409 (~334-335)** → `inscripcionApiError("cohort-full", loc)`. **Checkout no-URL 500 (~412)** → `inscripcionApiError("checkout-no-url", loc)`. **Checkout failed 500 (~425)** → `inscripcionApiError("checkout-failed", loc)`. (All profesional-branch: no cleanup calls.)

Line numbers are approximate — locate each by its quoted literal.

- [ ] **Step 3: Update existing route tests**

`grep -rl "inscripcion/route\|api/inscripcion" tests/` to find every test importing the route. In each:
- Add the blob mock at the top (before route import), matching `tests/unit/apply-verification-decision.test.ts:45`:
```ts
vi.mock("@vercel/blob", () => ({ del: vi.fn().mockResolvedValue(undefined) }));
```
- Replace hardcoded ES message assertions with the table, e.g. in `tests/unit/inscripcion-student-branch.test.ts` (~199):
```ts
import { inscripcionApiError } from "@/lib/inscripcion/api-errors";
...
        inscripcionApiError("already-enrolled", "es"),
```
(keep the looser `stringContaining("inscripción registrada")` assertion as-is if present — it still passes).
- Add ONE new behavior test in `tests/unit/inscripcion-student-branch.test.ts`: a rejected student submission (reuse the suite's existing duplicate-409 setup) with a `matricula_doc_url` matching the store pattern asserts `del` was called with that URL; and the same rejection with a foreign URL asserts `del` NOT called. Follow the suite's existing request-builder helpers.

- [ ] **Step 4: Run the touched tests**

Run: `pnpm vitest run tests/unit/inscripcion-student-branch.test.ts tests/unit/blob-cleanup.test.ts tests/unit/inscripcion-api-errors.test.ts`
Expected: PASS.

- [ ] **Step 5: Full suite + typecheck + lint**

Run: `pnpm vitest run`
Then: `pnpm exec tsc --noEmit`
Then: `pnpm lint`
Expected: all green/clean.

- [ ] **Step 6: Production build**

Run: `pnpm build`
Expected: exit 0, route table printed; no page-collection / `invalid-use-server-value` errors.

- [ ] **Step 7: Commit + push**

```bash
git add src/app/api/inscripcion/route.ts tests/
git commit -m "fix(inscripcion): discard orphaned matricula blobs + localize API errors"
```

```bash
git push -u origin fix/inscripcion-blob-i18n
```

---

## Notes for the implementer

- The cleanup call is `await`ed but can never throw (the helper swallows) — do not wrap call sites in extra try/catch.
- Do NOT touch the two SUCCESS paths (pending-student 200 and Stripe-redirect 200) — the blob is referenced by the pending row there.
- Do NOT touch `InscripcionForm.tsx`.
- The audience-mismatch and Zod messages already go through their own locale-aware helpers — only their cleanup wiring (and the `loc` arg swap) changes.
- If a literal in the file differs slightly from the plan's quote, the FILE wins for the ES table string (the table must be verbatim) — update the table + its pin test accordingly and note it.
