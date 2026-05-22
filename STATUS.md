# SCCA — Project Status

> **Last updated**: 2026-05-22
>
> **What this is**: Single-source-of-truth status doc for handoff between
> sessions or contributors. Read this first to pick up cleanly.

---

## Project

**Santa Cruz Compounding Academy** — bilingual (ES/EN) landing page +
inscription + Stripe payment + student portal (Phase A SHIPPED, Phase B
in progress) with ACPE-sponsored compounding courses aligned to USP
〈795〉 and USP 〈800〉.

SCCA is a Puerto Rico LLC affiliated with Santa Cruz Pharma Care
(pharmacy in Bayamón, PR).

| | |
|---|---|
| **Repo** | `github.com/jzayas03/sccompoundingacademy-web` |
| **Prod URL** | `https://sccompoundingacademy.com` |
| **Stack** | Next.js 16 · React 19 · Tailwind 4 · next-intl · Auth.js 5 · Drizzle ORM · Neon Postgres · Stripe · Resend · Airtable · pdf-lib |
| **Hosting** | Vercel (Hobby) |
| **Local path** | `/Users/jan.zayas1/Desktop/scca_landing_components/sccompoundingacademy-web` |

---

## Current state

### ✅ Live in production

**Public site (sccompoundingacademy.com)**
- Domain registered + Vercel custom domain + TLS
- Cloudflare Email Routing catch-all → `sccapr2025@gmail.com`
- Resend domain verified (DKIM + SPF + MX + DMARC)
- Landing page (Hero + slogan, Confianza, CursosGrid with modules + Inclusiones + pricing + ACPE row, Instructor section with portrait + bio + credentials, Aprenderás, ParaQuienEs, Especialidades, Galería, FAQ, Ubicación, Instagram, CtaFinal)
- Bilingual ES/EN routing (`/es` and `/en`) — 315 i18n keys parity
- Inscripción form → Stripe Checkout — **live**: both Price IDs configured, webhook active, promotion-code field enabled
- Legal docs attorney-approved (Privacy, Terms, Refund) — updated address + ACPE Provider 0151 wording; tiered refund policy 100/50/0 (PR #57)
- Schema.org JSON-LD: EducationalOrganization + LocalBusiness + Course (with `educationalCredentialAwarded` + `numberOfCredits`)

**Student portal (Phase A — `/portal/*`)**
- Magic-link sign-in via Auth.js v5 + Resend custom email template
- Dashboard with InstructorHero glass card + payment-pending / cert-ready / reviews banners
- Module pages (`/portal/modulos/[id]`) with native PDF viewer + ES/EN language toggle (PR #61)
- Diagnostic pre-test before each module (PR #59) + quiz engine: 45 real questions (15 × 3 days), one-at-a-time UX with progress bar
- Results page with "show correct answers" toggle
- Certificate generation: `pdf-lib` — vector PDF template (`template.pdf`) → Canva PNG overlay → primitive layout fallback, QR code, sequential `SCCA-{YYYY}-{NNN}` numbering, ACPE 0151 ribbon
- Public verification at `/verificar/[certNo]` — no auth, no locale prefix
- Reviews collection with 5-star ratings + 2 textareas + public consent
- GlassNav with sticky blur + sign-out
- Middleware gates `/portal/*` and `/modulos/*.pdf` for anonymous traffic

**Owner admin (`/portal/admin`)**
- Roster, reviews, certificates view (PR #58)
- ACPE registry data capture + export (PR #60)
- Owner-managed cohort scheduling (PR #62)

### ⏸ Blocked on owner setup

| Item | Status | Notes |
|---|---|---|
| Día 2 + Día 3 module PDFs | ⏸ Pending | Owner exports from Gamma → drop at `public/modulos/dia-{2,3}.pdf`. Día 1 is published (PR #64); viewer auto-flips from "coming soon" to inline render. |
| Airtable base | ⏸ Pending (optional) | `AIRTABLE_TOKEN` + `AIRTABLE_BASE_ID` empty in Vercel — operational triage view only; Postgres is system-of-record, so this is non-blocking. |
| Instagram auto-refresh | ⏸ Pending | FB Developer App + GitHub Secrets. See `.github/workflows/README-IG-AUTO-REFRESH.md`. |

### ✅ Resolved in the 2026-05-22 session

- **Stripe is live** — account activated; 2 Products created ($495 Estudiante, $2,350 Profesional); webhook endpoint configured at `https://sccompoundingacademy.com/api/webhooks/stripe` (event `checkout.session.completed`); `STRIPE_WEBHOOK_SECRET` + both `STRIPE_PRICE_ID_*` set in Vercel. The full payment → webhook → `paidAt` → portal-unlock flow was verified end-to-end with a 100%-off coupon.
- **Webhook 307 bug fixed** — the Vercel apex domain was redirecting (307) to `www`, so Stripe could not deliver webhooks (Stripe does not follow redirects). Fixed by making the apex the primary domain (see Repo conventions → Domain config).
- **Price-ID misconfig fixed** — `STRIPE_PRICE_ID_PROFESIONAL` had been pointing at the $495 price; corrected to the $2,350 price and verified at checkout.
- **DB migrations 0001–0004** confirmed applied in Neon.
- **Día 1 module PDF** published (PR #64).
- **Instructor signature** `public/instructor/firma-jorge-reyes.png` present.

### 🔵 Phase B

**Built**
- Admin dashboard (`/portal/admin`) — roster, reviews, certificates (PR #58)
- ACPE registry data capture + export (PR #60)
- Owner-managed cohort scheduling from the admin panel (PR #62)
- Diagnostic pre-test before each module (PR #59)
- ES/EN language toggle on the module PDF viewer (PR #61)

**Not yet built**
- Public reviews display with consent filter on homepage
- Automated email sequences (welcome post-payment, pre-quiz reminder, certificate-issued notification)
- Full portal i18n parity (portal UI is still ES-only; only the PDF viewer toggles ES/EN)
- Mobile PWA: installable + offline PDF cache
- Analytics dashboard (pass rates, time-on-module, drop-off per question)
- Digital signature canvas on cert (student signs instead of using a signature image)

---

## Major architectural decisions

| Decision | Value | Why |
|---|---|---|
| Legal entity | SCCA LLC, separate from pharmacy | Owner accounting + Stripe activation |
| Payment processor | **Stripe** | $570/year cheaper than Shopify + full form control |
| Portal DB | **Neon Postgres via Drizzle** (not Airtable) | Transactions needed for cert numbering + portal auth; rate limits matter at scale |
| Operational triage DB | **Airtable** (parallel write) | Owner reads Inscripciones via Airtable UI; Postgres is system-of-record |
| Domain | `sccompoundingacademy.com` via Cloudflare | $10/year, best free DNS, included Email Routing |
| Transactional email | **Resend** | Branded sender on verified domain |
| Portal auth | **NextAuth (Auth.js v5) magic-link via Resend** | No passwords, magic-link flow, JWT session strategy (Edge-compatible middleware) |
| Module content format | **PDF presentations** (was AI-narrated video → dropped Mux) | Simpler ship, $45/year saved, easier to revise mid-cohort |
| Pricing model | **2-tier, 2 Stripe Products** | Profesional $2,350 (RPh + licensed techs) · Estudiante $495 (pre-licensure). Each tier is its own Stripe Product; the route resolves the Price ID by tier. |
| Student-tier verification | **Hybrid pragmatic** — institutional email allowlist + manual Stripe coupon | Phase A trusts honor system + 28 PR institutional domains; Phase B adds Student ID upload UI if abuse appears |
| Cert format | **PDF server-generated** via pdf-lib | Local generation, no external dep; vector PDF template overlay when owner provides one |
| Cert numbering | `SCCA-{YYYY}-{NNN}` sequential per year | Human-readable, traceable, year-resets |
| Quiz passing score | **70 %** (env-configurable via `QUIZ_PASSING_THRESHOLD`) | Threshold for participation certificate, owner can change without deploy |
| Quiz retries | **Unlimited** | Reduces abandonment; only the most recent attempt counts |
| ACPE accreditation | **Colegio de Farmacéuticos PR sponsorship** (Provider 0151, 18 hrs / 1.8 CEUs, Knowledge-based Level 1) | SCCA itself is not ACPE-accredited; the Colegio sponsors specific cohorts |

---

## Brand specs (locked)

**Palette** (active hex values, in `src/lib/brand.ts`):

```
#195561  teal-deep      (titles, signatures, accent stripes)
#228698  teal           (secondary surfaces, mid-band dividers)
#E6EA82  chartreuse     (CTAs, eyebrow bars, brand-mark fills)
#EAE1D6  sand           (warm neutral, paper tints)
#F3F3F4  off-white      (cool surfaces, light text on dark)
#404040  ink (gray-900) (body text)
#666666  muted (gray-700)
```

**Brand-lint rule**: `tests/e2e/brand-lint.spec.ts` + `src/eslint-rules/no-hex-literal.js` together enforce that *no file in `src/` declares a 6/3/8-char hex literal except `src/lib/brand.ts`* (or test fixtures). Components reference colors via Tailwind tokens or `brand.colors.*` interpolation.

**Typography**:
- Heading + body: **ITC Avant Garde Gothic Pro** (fallback: Century Gothic, Futura, Montserrat, system-ui)
- Accent: **Khmer MN** italic (fallback: Cormorant Garamond, Garamond, serif) — used for the institutional slogan above the Hero eyebrow

**Glassmorphism tokens** (in `globals.css` `@layer components`):
- `.glass-card` — `rgba(255,255,255,0.08)` + `backdrop-filter: blur(20px)` + 1pt translucent border
- `.glass-nav` — `rgba(245,246,247,0.7)` + `blur(16px)`
- `.glass-modal` — `rgba(245,246,247,0.85)` + `blur(24px)`

---

## Vendor stack

| Service | Status | Purpose | Cost |
|---|---|---|---|
| **Cloudflare** | ✅ Active | Domain + DNS + Email Routing catch-all | $10/year |
| **Vercel** | ✅ Active | Hosting, edge functions | $0 (Hobby) |
| **Resend** | ✅ Active | Transactional email (Stripe receipts, magic links, contact form) | $0 (3k/mo free) |
| **Neon Postgres** | ✅ Active | Portal DB (users, accounts, sessions, quiz_attempts, certificates, reviews, cohorts) | $0 (Free tier) |
| **Stripe** | ✅ Active | Inscripción + Coupon-based student discount; webhook live | 2.9% + $0.30/tx |
| **Airtable** | ⏸ Pending owner setup | Operational triage view of paid inscriptions | $0 (1k records free) |
| **Gamma Plus** | ✅ Owner pays | Module slide production (PDFs) | $10/mo |
| **Canva Pro** | ✅ Owner pays | Brand kit + certificate template + brochure | $13/mo |
| **Facebook Dev App** | ⏸ Pending owner setup | Instagram auto-refresh (v2) | $0 |

**Mux Video**: dropped (was planned for AI-narrated module videos; owner decided PDFs + quizzes are sufficient).

---

## Owner action items

### Remaining
1. **Produce Día 2 + Día 3 module PDFs** in Gamma → export → drop at `public/modulos/dia-{2,3}.pdf` (Día 1 already published).
2. **Clean up test data** before launch — remove test enrollment rows from the Neon `user` table (e.g. the 2026-05-22 verification rows).
3. **Create Airtable base** "SCCA Inscripciones" with an `Inscripciones` table mirroring `lib/airtable.ts` schema → set `AIRTABLE_TOKEN` + `AIRTABLE_BASE_ID` (optional — operational triage only; non-blocking).

### Optional — Instagram auto-refresh (v2)
4. Convert `@santacruzpharmacare` to IG Business + connect to FB Page
5. Create FB Developer App + obtain long-lived token + IG Business User ID
6. Create fine-grained GitHub PAT + add 3 secrets to repo (see `.github/workflows/README-IG-AUTO-REFRESH.md`)

---

## Plans archived

Long-form planning lives in **`~/.claude/plans/resumen-para-humming-comet.md`** (1100+ lines, 6 UPDATE sections from 2026-05-18 to 2026-05-19).

Key UPDATEs to read first:
- **2026-05-19 — Design: Portal de Estudiantes v1.5 Phase A** (the canonical Phase A spec)
- **2026-05-19 (PM tarde)** — Brochure + CV cross-check (address/phones, "Manejo del Dolor" gap, tier rename, ACPE classification)

---

## Repo key structure

```
sccompoundingacademy-web/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx              ← html/body + i18n provider only
│   │   │   ├── (marketing)/             ← route group (Header + Footer)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx (landing)
│   │   │   │   ├── cursos/, courses/
│   │   │   │   ├── contacto/, contact/
│   │   │   │   ├── inscripcion/{exito,cancelada}, enroll/{success,cancelled}
│   │   │   │   └── legal/{privacidad,terminos,reembolso} + EN aliases
│   │   │   └── (portal)/portal/         ← route group (MeshBackground + GlassNav)
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx (dashboard)
│   │   │       ├── login/, verify/
│   │   │       ├── admin/{page.tsx, cohortes/}
│   │   │       ├── modulos/[id]/{page.tsx, pre-test/, post-test/{page.tsx, resultados/}}
│   │   │       ├── certificado/
│   │   │       └── reseñas/
│   │   ├── verificar/[certNo]/page.tsx  ← public cert verification (no locale)
│   │   └── api/
│   │       ├── auth/[...nextauth]/      ← Auth.js handler
│   │       ├── contact/                  ← contact form
│   │       ├── inscripcion/              ← Stripe Checkout session creator
│   │       ├── certificate/              ← PDF generation
│   │       └── webhooks/stripe/          ← payment confirmation → DB + Airtable + emails
│   ├── components/
│   │   ├── layout/   (Header, Footer, SkipLink)
│   │   ├── marketing/ (Hero, CursosGrid, Instructor, etc.)
│   │   ├── brand/    (LogoFull, LogoShield, Pattern)
│   │   ├── glass/    (GlassCard, MeshBackground)
│   │   ├── portal/   (GlassNav, InstructorHero, ModulePdfViewer)
│   │   ├── certificate/ (reserved — currently render is in lib/)
│   │   └── ui/       (Button, Container, Accordion, etc.)
│   ├── lib/
│   │   ├── auth.ts, auth.config.ts     ← Auth.js v5 (split for Edge runtime)
│   │   ├── brand.ts                     ← color tokens (no-hex-literal allowlist)
│   │   ├── courses.ts                   ← course catalogue + 2-tier pricing + ACPE
│   │   ├── cohorts.ts                   ← cohort data layer (DB-backed)
│   │   ├── stripe.ts                    ← Stripe SDK instance
│   │   ├── siteUrl.ts                   ← canonical URL helper (rejects .vercel.app)
│   │   ├── structuredData.ts            ← JSON-LD graph builder
│   │   ├── student-email-allowlist.ts   ← 28 PR institutional domains
│   │   ├── airtable.ts                  ← Airtable client (graceful degradation)
│   │   ├── db/{index.ts, schema.ts}    ← Drizzle (Neon Postgres)
│   │   ├── certificates/{index.ts, render.ts}  ← cert numbering + pdf-lib renderer
│   │   ├── quizzes/{types,dia-1,dia-2,dia-3,index}.ts  ← 45 questions + scoring
│   │   └── emails/                      ← inscripcion-confirmacion, interna, magic-link
│   ├── i18n/         (routing.ts, request.ts)
│   ├── messages/     (es.json + en.json, 315 keys parity)
│   ├── middleware.ts                    ← next-intl + Auth.js gating
│   └── eslint-rules/no-hex-literal.js   ← custom ESLint rule
├── drizzle/                              ← migrations 0000–0004 (committed; applied manually in Neon)
├── public/
│   ├── brand/, photos/, instagram/, instructor/
│   ├── certificate/template.pdf          ← vector cert template
│   └── modulos/dia-1.pdf                 ← Día 1 published; dia-2/3 pending
├── docs/modules/refined-module-prompts.md
├── .github/workflows/{refresh-ig.yml, refresh-ig-token.yml}
├── scripts/{check-i18n-parity.mjs, fetch-ig-feed.mjs, refresh-ig-{thumbs,token}.mjs}
├── drizzle.config.ts
├── playwright.config.ts                  ← webServer injects test AUTH_SECRET
└── tests/
    ├── unit/ (vitest)
    ├── components/ (vitest)
    └── e2e/ (playwright + axe-core)
```

---

## Repo conventions

- **No-hex-literal rule** — all hex must come from `src/lib/brand.ts`. Component code uses Tailwind tokens or interpolates from `brand.colors`. The `qrcode` lib + email templates are the rare exception (they need raw hex strings and import them from `brand.ts` by reference).
- **i18n parity** — `pnpm check:i18n` must pass (315 identical keys ES/EN as of 2026-05-22).
- **Route groups** — `(marketing)/` and `(portal)/portal/` split the chrome; URLs unchanged.
- **PR cycle**: branch → commit → push → `gh pr create` → `gh pr merge --squash --delete-branch`.
- **Co-author tag**: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` on every commit.
- **Full gauntlet** before merge: `pnpm typecheck && pnpm lint && pnpm check:i18n && pnpm test && pnpm test:e2e && pnpm build`.
- **Drizzle migrations** are committed to git. Apply them manually in the Neon SQL Editor (no CI migration runner). Migrations 0001–0004 are applied as of 2026-05-22.
- **Canonical URL** — never trust `NEXT_PUBLIC_SITE_URL` blindly; `lib/siteUrl.ts` rejects `.vercel.app` hostnames and falls back to the custom domain in production.
- **Domain config** — the Vercel **primary domain must be the apex** `sccompoundingacademy.com` ("Connect to environment / Production" — serves directly); `www.sccompoundingacademy.com` and the `*.vercel.app` domain **redirect to the apex**. The Stripe webhook URL, `AUTH_URL`, `NEXT_PUBLIC_SITE_URL` and `siteUrl.ts` all assume the apex. ⚠️ If `www` is ever made primary, the apex 307-redirects and **Stripe webhook delivery silently breaks** — Stripe does not follow redirects, so payments never get marked `paid_at`. (This bug occurred and was fixed 2026-05-22.)

---

## How to pick up in a new session

Drop this in the prompt:

```
Read STATUS.md in the SCCA repo for full context. The path is
/Users/jan.zayas1/Desktop/scca_landing_components/sccompoundingacademy-web.

Long-form plan with all design decisions:
~/.claude/plans/resumen-para-humming-comet.md

What's the next thing to ship?
```

### Critical path to first paid student — UNBLOCKED (2026-05-22)

The payment → portal flow is live and verified end-to-end. A real
professional enrollment now runs: inscription form → Stripe Checkout
($2,350) → pay → `checkout.session.completed` webhook → `users.paidAt`
set → magic-link sign-in → dashboard unlocks → 3 post-tests →
certificate. The Estudiante tier ($495) is gated by the institutional-
email allowlist or a manually-issued Stripe coupon. Remaining for a
polished launch: Día 2/3 module PDFs and test-data cleanup.

---

## PR history

Phase A complete at **PR #47**. Phase B and polish from **#48**:

```
PR #6-#31   Phase 0 — landing page, brand, legal, instagram, single-course collapse
PR #32-#47  Phase A — single course + instructor, 2-tier pricing, portal
            (Drizzle + Auth.js, magic-link, Stripe webhook, module viewer,
            quiz engine, certificates, reviews, brand parity, e2e + axe)

PR #48     chore(instructor): refresh Lcdo. Reyes portrait
PR #49     feat(checkout): hide tier prices until Stripe Checkout
PR #50     feat(nav): add Portal sign-in link to marketing header
PR #51     feat(portal): use dark logo variant on light mesh background
PR #52     feat(cert): vector PDF template + English overlay + signature slot
PR #53     fix(ig): graceful skip when Instagram API credentials are absent
PR #54     feat(email): add SCCA logo header + update what-to-bring copy
PR #55     fix(inscripcion): show readable message on form validation failure
PR #56     fix(content): swap primary/secondary phone numbers
PR #57     chore(legal): tiered refund policy (100/50/0) per owner
PR #58     feat(admin): owner admin view — roster, reviews, certificates (Phase A)
PR #59     feat(portal): diagnostic pre-test before each module
PR #60     feat(admin): ACPE registry data capture + export (Phase B)
PR #61     feat(portal): ES/EN language toggle on module PDF viewer
PR #62     feat(cohorts): owner-managed cohort scheduling from admin panel
PR #63     feat(inscripcion): "Otro" profession option in the enrollment form
PR #64     content(portal): publish Día 1 module PDF
PR #65     feat(checkout): enable promotion codes on Stripe Checkout
```

---

## Known accessibility findings (axe scan, 2026-05-19)

The CI a11y scan in `tests/e2e/accessibility.spec.ts` asserts no
`impact: "critical"` violations. Serious / moderate findings logged
but not blocking, for incremental triage:

- **Landing /es** — 2 serious `color-contrast` violations on
  `text-teal-deep/70` over white backgrounds (regulatory eyebrow rows
  + sticky LocaleSwitch hover state). Fix: bump opacity to /80 or
  switch to a darker stop. 1 minor `image-redundant-alt` on three
  next/image fill containers where the alt repeats nearby copy.
- **Other surfaces** — no critical or serious findings on `/cursos`,
  `/contacto`, `/portal/login`.

Fix in a Phase B polish PR. The current state is WCAG 2.1 AA-compatible
except for those flagged contrast adjustments.
