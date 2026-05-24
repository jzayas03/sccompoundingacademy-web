# SCCA — Reviews collection + ACPE compliance (Standards 3 & 5.1)

> **Date:** 2026-05-24
> **Status:** Design approved by owner. Ready for implementation planning.
> **Repo:** `sccompoundingacademy-web` (Next.js 16, Auth.js 5, Drizzle / Neon, Resend, Tailwind 4)

## Context

The student portal already captures course reviews via `/portal/reseñas/` (PR #45). Submissions land in the `reviews` table and are visible to the owner in `/portal/admin` (PR #58). **What is missing** is the rest of the end-to-end loop: a nudge to actually fill the form, an approval step before reviews appear publicly, and a public display surface on the marketing landing.

Separately, the academy operates under the Colegio de Farmacéuticos de Puerto Rico's ACPE Provider 0151 sponsorship. ACPE Standards for Integrity and Independence impose two requirements that are **distinct from student reviews** but landed in the same conversation:

- **Standard 3** — collect, mitigate, and disclose **faculty financial relationships** with ineligible companies. Disclosure to learners must happen **before** they engage in the activity.
- **Standard 5.1** — ensure **clinical content validity**, typically via external peer review of the course materials.

This spec covers all three so the owner can ship a complete, ACPE-aligned post-course flow in one coordinated effort.

## Goals

- Increase review submission rate by adding an automated nudge.
- Give the owner approval control over which reviews appear publicly.
- Surface social proof on the marketing landing.
- Make the academy compliant with ACPE Standard 3 (learner-facing disclosure shipped as UI; faculty intake and content peer review documented as offline paper forms in the repo).

## Out of scope

- Dedicated `/reseñas` public page with all approved reviews (Phase B+ once volume justifies).
- Aggregate stats (e.g. "⭐ 4.8 from N students") — owner explicitly opted out.
- Edit / unpublish flows for already-published reviews — minor; can be added later.
- Second-chance reminder email if the first invite is ignored.
- Portal i18n parity (English version of the disclosure block) — portal is ES-only until separate Phase B work.
- Building UI for the faculty financial-disclosure intake form — kept as a paper template, signed and filed by the owner once per year (or per cohort if anything changes).
- Building UI for the content-validity peer-review form — paper template, signed by an external reviewer per cohort.

---

## Design

### A. Student reviews

#### A.1 Capture (no change)

Existing `/portal/reseñas/` form keeps its current schema: overall ⭐ 1-5, per-module ⭐ (m1/m2/m3), `best_comment`, `improve_comment`, `public_consent`, `submitted_at`.

#### A.2 Trigger — dashboard card + 24h email

- **Card in dashboard** (existing): the `reviewPromptTitle` / `reviewPromptCta` card on `/portal` is shown when the student is cert-eligible (passed all 3 post-tests). Keep as-is.
- **NEW — automated email**: 24 hours after the student becomes cert-eligible, send a single email inviting them to leave a review. Send via Resend. No second reminder.
  - **Trigger source of truth**: the timestamp of the 3rd passed post-test (the moment of cert-eligibility), looked up via `quiz_attempts`.
  - **Deduplication**: a new `review_invites` table (or a column on `users`) records the moment the invite is sent. The cron skips users that already have an invite recorded or already have a row in `reviews`.
  - **Schedule mechanism**: GitHub Actions workflow on a daily cron (mirrors the existing `refresh-ig.yml` pattern, since the repo has no Vercel Cron set up). A new workflow `.github/workflows/send-review-invites.yml` triggers a Next.js API route `POST /api/cron/review-invites` protected by a shared secret. The route does the DB scan, sends emails, and records the invites.
  - **Email content**: a new Resend template `lib/emails/review-invite.ts`, mirroring the existing `inscripcion-confirmacion.ts` style — branded header, short body in the educator-warm voice, single CTA button to `/portal/reseñas`. ES only (portal is ES-only).

#### A.3 Approval flow — admin

- A new section **"Reseñas pendientes"** in `/portal/admin` lists submitted reviews where `public_consent = true AND published_at IS NULL AND archived_at IS NULL`.
- Each card shows: overall ⭐, per-module ⭐, both comments, the student's tier and cohort (joined from `users`).
- Two server actions per card:
  - **Aprobar** → sets `published_at = NOW()`. Review becomes eligible to appear on the landing.
  - **Archivar** → sets `archived_at = NOW()`. Review is retained in DB but excluded from the public surface and from the "pending" list. Reversible by a future "unarchive" action if needed.
- Reviews with `public_consent = false` continue to show in a separate "Sin consentimiento (internas)" admin sub-section as today; they are never aprobable.

#### A.4 Public display — landing

- **New marketing component**: `components/marketing/Resenas.tsx`. Rendered between `Galeria` and `FaqClean` in the landing route group.
- **Data fetch** (server component): pull the 3-5 most recent reviews where `published_at IS NOT NULL`, ordered by `published_at DESC LIMIT 5`. If fewer than 3 results, **return null** — the section is hidden entirely (better invisible than empty).
- **Card layout** per review:
  - Top row: 5-star visual + the student's display name as `{firstName} {lastInitial}.` (computed in the query or component), small text with tier (Profesional / Estudiante) and cohort label.
  - Body: `best_comment` (the positive comment). The `improve_comment` is **not** shown publicly.
  - No photos, no profession-specific badges in v1.
- **No aggregate stat** anywhere — explicitly opted out by owner.
- **Eyebrow**: "Lo que dicen los estudiantes" (ES) / "What our students say" (EN — when portal/landing i18n parity ships; for now i18n key with ES content for both locales).

### B. ACPE Standard 3 — Faculty financial relationship disclosure

#### B.1 Learner-facing disclosure block — NEW UI

ACPE requires the disclosure to be visible to learners **before they engage in the educational activity**. The simplest and most defensible implementation:

- A persistent section at the top of the **portal dashboard** (`src/app/[locale]/(portal)/portal/page.tsx`), rendered **above the "modules" strip and above any payment-pending banner**, with a clear heading and the disclosure body.
- Content driven by two env vars to allow per-year/per-cohort updates without code changes:
  - `ACPE_DISCLOSURE_HEADING_ES` (default: "Divulgación de relaciones financieras")
  - `ACPE_DISCLOSURE_BODY_ES` (default: "El Lcdo. Jorge L. Reyes Quiñones, RPh, FACA, FACVP — instructor de esta actividad de educación continua — no tiene relaciones financieras relevantes con compañías inelegibles que reportar. Ningún miembro del equipo de planificación de esta actividad tiene relaciones financieras relevantes que reportar.")
- Default rendered if the env vars are not set, so the disclosure is **always present**.
- Visual treatment: a `GlassCard` with a small ACPE / Colegio reference at the bottom of the card ("Conforme con ACPE Standards for Integrity and Independence, Standard 3").
- Heading and body are kept short enough to fit above the fold on mobile.

#### B.2 Faculty intake form — paper template

- New file `docs/acpe/financial-disclosure-form-es.md` containing a Spanish-language adaptation of the ACPE template (page 3 of `IdentificationMitigationDisclosureTools ACPE.pdf`).
- The owner / Lcdo. Reyes prints, fills, signs once per year (or per cohort if anything changes), and files the PDF in the cohort's archive (outside the repo).
- No UI for this. If/when the academy adds additional faculty, a thin admin UI can be considered as Phase B+.

### C. ACPE Standard 5.1 — Content validity peer review

#### C.1 Peer review template — paper template

- New file `docs/acpe/content-validity-peer-review-es.md` containing a Spanish-language adaptation of the ACPE template (page 2 of `CONTENT VALIDITY 2024.pdf`).
- An external pharmacist (not Lcdo. Reyes, no financial conflict) reviews the course materials and signs the template per cohort or when content changes materially.
- Signed PDF lives in the cohort archive. No UI.

---

## Data model changes

A single new Drizzle migration `drizzle/0005_reviews_publishing.sql`:

```sql
-- Add publishing + archive timestamps to reviews
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "published_at" timestamp;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "archived_at" timestamp;

-- Track sent review invites so the cron does not double-send
CREATE TABLE IF NOT EXISTS "review_invites" (
  "user_id" text PRIMARY KEY,
  "sent_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "review_invites_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade
);
```

Schema mirror in `src/lib/db/schema.ts`:

```ts
export const reviews = pgTable("reviews", {
  // ...existing columns...
  publishedAt: timestamp("published_at"),
  archivedAt: timestamp("archived_at"),
});

export const reviewInvites = pgTable("review_invites", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});
```

The migration is committed to git and applied in the Neon SQL Editor per the repo convention.

---

## Implementation outline

Files to add or modify (high-level — the full task ordering is the next skill's job):

**Reviews**

- `drizzle/0005_reviews_publishing.sql` — migration above.
- `src/lib/db/schema.ts` — add new columns + new `reviewInvites` table.
- `src/lib/emails/review-invite.ts` — new Resend template (mirrors `inscripcion-confirmacion.ts`).
- `src/app/api/cron/review-invites/route.ts` — new API route. Guarded by `CRON_SECRET` header. Selects cert-eligible users without an invite, sends emails, records invites.
- `.github/workflows/send-review-invites.yml` — daily cron (mirrors `refresh-ig.yml`), calls the route with the secret.
- `src/app/[locale]/(portal)/portal/admin/page.tsx` — add "Reseñas pendientes" section + server actions for approve / archive. Update the existing reviews section to filter by `published_at` / `archived_at`.
- `src/components/marketing/Resenas.tsx` — new server component that fetches and renders 3-5 approved reviews.
- `src/app/[locale]/(marketing)/page.tsx` — render `<Resenas />` between `<Galeria />` and `<FaqClean />`.
- `src/messages/{es,en}.json` — new i18n keys: section eyebrow / heading, "no aprobadas todavía" empty state (used only by admin), tier labels, etc.
- Tests: a Playwright spec asserting the section appears / disappears based on approved-review count; a unit test for the `firstName + lastInitial` formatter.

**ACPE Standard 3**

- `src/components/portal/AcpeDisclosure.tsx` — new server component, reads env vars, renders the disclosure card.
- `src/app/[locale]/(portal)/portal/page.tsx` — render `<AcpeDisclosure />` above the module strip and above the payment-pending banner.
- `.env.example` — add `ACPE_DISCLOSURE_HEADING_ES`, `ACPE_DISCLOSURE_BODY_ES` (with the default values above, commented).
- `docs/acpe/financial-disclosure-form-es.md` — paper template.

**ACPE Standard 5.1**

- `docs/acpe/content-validity-peer-review-es.md` — paper template.

**STATUS.md**

- Update the "Phase B" subsection (move "Public reviews display with consent filter on homepage" out of "Not yet built" and into "Built").
- Mention ACPE Standard 3 disclosure block under "Live in production".

---

## Open questions / dependencies

- **ACPE disclosure text wording** — the proposed default is the most-common "no relevant relationships" template from ACPE's sample language. The owner has confirmed this is the correct disclosure for the current cohort. If a future cohort brings in additional faculty with relevant relationships, the env-var design supports an update without redeploy.
- **Cron secret** — `CRON_SECRET` must be added to Vercel Production and to the GitHub Actions secrets. Same pattern as the existing IG refresh workflow.
- **Email send-from address** — uses the same `EMAIL_FROM` env var that the inscription confirmation already uses. No new sender setup needed.
- **Time zone** — "24 hours after cert-eligible" is measured server-side in UTC. The cron job runs once per day in UTC; in the worst case the email arrives 24-48h after the cert-eligible moment, which is acceptable.
- **Cohort label in public cards** — pulled from `cohorts.id` via `formatCohortLabel(cohort, locale)` to keep the existing locale-aware formatting (June 2026, July 2026, etc.).

---

## Acceptance criteria

The work is done when, on a fresh test enrollment:

1. The student passes the 3rd post-test → within 24–48 hours they receive the review-invite email (cron runs once daily; verifiable end-to-end with a real Resend send).
2. The student fills the review form with `public_consent = true` → the review shows up in the admin's "Reseñas pendientes" list with both Aprobar and Archivar buttons.
3. The owner clicks Aprobar → the review's `published_at` is set, the card disappears from "pendientes", and the review appears on the marketing landing within the next page render.
4. Once at least 3 reviews are approved, the "Lo que dicen los estudiantes" section renders on `/es`. Before then, the section is absent (no empty state).
5. Any anonymous visitor to `/portal` is redirected to `/portal/login` (no change). Any authenticated student sees the ACPE disclosure block at the top of `/portal` before any module content.
6. `pnpm test:e2e` passes including the new Playwright spec for the public review section. `pnpm check:i18n` passes with the new keys mirrored in both locales.
7. `docs/acpe/financial-disclosure-form-es.md` and `docs/acpe/content-validity-peer-review-es.md` exist with the Spanish-language ACPE templates, suitable for printing.
