# SCCA — Project Status

> **Last updated**: 2026-05-19
>
> **What this is**: Single-source-of-truth status doc for handoff between
> sessions or contributors. Read this first to pick up cleanly.

---

## Project

**Santa Cruz Compounding Academy** — bilingual (ES/EN) landing page +
inscription + Stripe payment + student portal (Phase A SHIPPED) with
ACPE-sponsored compounding courses aligned to USP 〈795〉 and USP 〈800〉.

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
- Bilingual ES/EN routing (`/es` and `/en`) — 299 i18n keys parity
- Inscripción form → Stripe Checkout (code ready, awaits Price IDs)
- Legal docs attorney-approved (Privacy, Terms, Refund) — updated address + ACPE Provider 0151 wording
- Schema.org JSON-LD: EducationalOrganization + LocalBusiness + Course (with `educationalCredentialAwarded` + `numberOfCredits`)

**Student portal (Phase A — `/portal/*`)**
- Magic-link sign-in via Auth.js v5 + Resend custom email template
- Dashboard with InstructorHero glass card + payment-pending / cert-ready / reviews banners
- Module pages (`/portal/modulos/[id]`) with native PDF viewer + Canva-template auto-detection
- Quiz engine: 45 real questions (15 × 3 days) transcribed from owner PDFs, one-at-a-time UX with progress bar
- Results page with "show correct answers" toggle
- Certificate generation: `pdf-lib` dual-mode (Canva PNG overlay OR primitive layout), QR code, sequential `SCCA-{YYYY}-{NNN}` numbering, ACPE 0151 ribbon
- Public verification at `/verificar/[certNo]` — no auth, no locale prefix
- Reviews collection with 5-star ratings + 2 textareas + public consent
- GlassNav with sticky blur + sign-out
- Middleware gates `/portal/*` and `/modulos/*.pdf` for anonymous traffic
- 23/23 e2e tests passing (locale routing, contact form, brand-lint, portal public, portal gating, axe accessibility scans)

### ⏸ Blocked on owner setup

| Item | Blocker | Notes |
|---|---|---|
| Real Stripe payment | LLC activation + Price IDs | `STRIPE_PRICE_ID_PROFESIONAL` + `STRIPE_PRICE_ID_STUDENT` env vars empty in Vercel |
| Tier enum migration | Manual SQL | Run `ALTER TYPE "tier" ADD VALUE 'profesional'` once in Neon SQL Editor (drizzle/0001_tired_wilson_fisk.sql) |
| Module PDF content | Owner produces in Gamma | Drop to `public/modulos/dia-{1,2,3}.pdf` — viewer auto-flips from "coming soon" to inline render |
| Certificate Canva PNG | Owner designs in Canva, exports PNG | Drop to `public/certificate/template.png` — renderer auto-flips from primitive layout to Canva overlay |
| Lcdo. Reyes signature scan | Owner provides transparent PNG | Drop to `public/instructor/firma-jorge-reyes.png` (wiring in follow-up PR) |
| Instagram auto-refresh | FB Developer App + GitHub Secrets | See `.github/workflows/README-IG-AUTO-REFRESH.md` |

### 🔵 Phase B (designed, not built)

- Public reviews display with consent filter on homepage
- Admin dashboard (`/admin`): students table, CSV export, individual responses, cohort management
- Automated email sequences (welcome post-payment, pre-quiz reminder, certificate-issued notification)
- Portal i18n parity (Phase A is ES-only)
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
| Pricing model | **2-tier under 1 Stripe Product** | Profesional $2,350 (RPh + licensed techs) · Estudiante $495 (pre-licensure) |
| Student-tier verification | **Hybrid pragmatic** — institutional email allowlist + manual Stripe coupon | Phase A trusts honor system + 28 PR institutional domains; Phase B adds Student ID upload UI if abuse appears |
| Cert format | **PDF server-generated** via pdf-lib | Local generation, no external dep; Canva PNG overlay when owner provides template |
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
| **Neon Postgres** | ✅ Active | Portal DB (users, accounts, sessions, quiz_attempts, certificates, reviews) | $0 (Free tier) |
| **Stripe** | ⏸ Pending Price IDs | Inscripción + Coupon-based student discount | 2.9% + $0.30/tx |
| **Airtable** | ⏸ Pending owner setup | Operational triage view of paid inscriptions | $0 (1k records free) |
| **Gamma Plus** | ✅ Owner pays | Module slide production (PDFs) | $10/mo |
| **Canva Pro** | ✅ Owner pays | Brand kit + certificate template + brochure | $13/mo |
| **Facebook Dev App** | ⏸ Pending owner setup | Instagram auto-refresh (v2) | $0 |

**Mux Video**: dropped (was planned for AI-narrated module videos; owner decided PDFs + quizzes are sufficient).

---

## Owner action items (priority order)

### Blocking first paid inscription
1. **Run Drizzle migration** in Neon SQL Editor:
   ```sql
   ALTER TYPE "public"."tier" ADD VALUE 'profesional' BEFORE 'student';
   ```
2. **Activate Stripe** under SCCA LLC (3–5 days)
3. **Create 1 Stripe Product** "Basic Compounding No Estéril" with 2 Prices:
   - Profesional: $2,350 one-time → `STRIPE_PRICE_ID_PROFESIONAL`
   - Estudiante: $495 one-time → `STRIPE_PRICE_ID_STUDENT`
4. **Configure Stripe webhook** endpoint `https://sccompoundingacademy.com/api/webhooks/stripe` listening to `checkout.session.completed` → copy signing secret to `STRIPE_WEBHOOK_SECRET`
5. **Set Stripe env vars** in Vercel (Production, Preview, Development)
6. **Create Airtable base** "SCCA Inscripciones" with `Inscripciones` table mirroring `lib/airtable.ts` schema → set `AIRTABLE_TOKEN` + `AIRTABLE_BASE_ID`

### Blocking portal content quality
7. **Produce 3 module PDFs** in Gamma → export → drop at `public/modulos/dia-{1,2,3}.pdf`
8. **Design certificate** in Canva → export as 300 DPI PNG → drop at `public/certificate/template.png`
9. **Scan signature** (transparent PNG) → drop at `public/instructor/firma-jorge-reyes.png`

### Optional — Instagram auto-refresh (v2)
10. Convert `@santacruzpharmacare` to IG Business + connect to FB Page
11. Create FB Developer App + obtain long-lived token + IG Business User ID
12. Create fine-grained GitHub PAT + add 3 secrets to repo (see `.github/workflows/README-IG-AUTO-REFRESH.md`)

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
│   │   │       ├── modulos/[id]/{page.tsx, post-test/{page.tsx, resultados/page.tsx}}
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
│   │   ├── portal/   (GlassNav, InstructorHero)
│   │   ├── certificate/ (reserved — currently render is in lib/)
│   │   └── ui/       (Button, Container, Accordion, etc.)
│   ├── lib/
│   │   ├── auth.ts, auth.config.ts     ← Auth.js v5 (split for Edge runtime)
│   │   ├── brand.ts                     ← color tokens (no-hex-literal allowlist)
│   │   ├── courses.ts                   ← course catalogue + 2-tier pricing + ACPE
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
│   ├── messages/     (es.json + en.json, 299 keys parity)
│   ├── middleware.ts                    ← next-intl + Auth.js gating
│   └── eslint-rules/no-hex-literal.js   ← custom ESLint rule
├── drizzle/                              ← migrations (0000_initial, 0001_tier_enum)
├── public/
│   ├── brand/, photos/, instagram/, instructor/
│   ├── certificate/ (template.png pending)
│   └── modulos/ (dia-*.pdf pending)
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
- **i18n parity** — `pnpm check:i18n` must pass (299 identical keys ES/EN as of 2026-05-19).
- **Route groups** — `(marketing)/` and `(portal)/portal/` split the chrome; URLs unchanged.
- **PR cycle**: branch → commit → push → `gh pr create` → `gh pr merge --squash --delete-branch`.
- **Co-author tag**: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` on every commit.
- **Full gauntlet** before merge: `pnpm typecheck && pnpm lint && pnpm check:i18n && pnpm test && pnpm test:e2e && pnpm build`.
- **Drizzle migrations** are committed to git. Apply them in Neon SQL Editor (no CI migration runner yet — Vercel CLI not installed locally).
- **Canonical URL** — never trust `NEXT_PUBLIC_SITE_URL` blindly; `lib/siteUrl.ts` rejects `.vercel.app` hostnames and falls back to the custom domain in production.

---

## How to pick up in a new session

Drop this in the prompt:

```
Read STATUS.md in the SCCA repo for full context. The path is
/Users/jan.zayas1/Desktop/scca_landing_components/sccompoundingacademy-web.

Long-form plan with all design decisions:
~/.claude/plans/resumen-para-humming-comet.md

What's the next owner blocker we can unblock today?
```

### Critical path to first paid student

1. Owner runs the tier migration in Neon SQL Editor (1 command)
2. Owner provisions Stripe Prices + sets env vars in Vercel
3. Test purchase with `4242 4242 4242 4242` → webhook updates user row → student signs in → dashboard unlocks → completes 3 post-tests → downloads cert → owner reviews `reviews` table for feedback

---

## PR history (Phase A complete: PRs #32–#47)

```
PR #6-#31   Phase 0 — landing page, brand, legal, instagram, single-course collapse
            (see prior git history)

PR #32     feat(content): single course + instructor + branded contact
PR #34     fix(seo): reject .vercel.app hostname in NEXT_PUBLIC_SITE_URL
PR #35     feat(course): 2-tier pricing + instructor portrait + ACPE
PR #36     content(instructor): expand bio + credentials from CV
PR #37     feat(portal) PR 1 — Drizzle + Auth.js + glass design tokens
PR #38     feat(portal) PR 2 — magic-link login + verify + locked dashboard
PR #39     feat(portal) PR 3 — Stripe webhook upserts users.paidAt + portal CTA
PR #40     feat(portal) PR 4 — module PDF viewer + middleware auth gating
PR #41     feat(portal) PR 5 — quiz engine (30 real questions + per-module post-test)
PR #42     content(quiz): populate Día 3 question bank from owner's PDF
PR #43     chore(content): brochure + CV review corrections (address, phones, tier, bio, ACPE)
PR #44     feat(portal) PR 6 — certificate generation + public verification
PR #45     feat(portal) PR 7 — course reviews collection (form-only Phase A)
PR #46     feat(portal) PR 8 — brand parity, GlassNav, InstructorHero on dashboard
PR #47     feat(portal) PR 9 — e2e + axe scans + this STATUS.md refresh (Phase A complete)
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
