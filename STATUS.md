# SCCA — Project Status

> **Last updated**: 2026-05-18
>
> **What this is**: Single-source-of-truth status doc for handoff between
> sessions or contributors. Read this first to pick up cleanly.

---

## Project

**Santa Cruz Compounding Academy** — bilingual (ES/EN) landing page +
inscription + payment platform + (future) student portal with
compounding courses aligned to USP 〈795〉 and USP 〈800〉.

SCCA is a Puerto Rico LLC affiliated with Santa Cruz Pharma Care
(pharmacy in Bayamón, PR).

| | |
|---|---|
| **Repo** | `github.com/jzayas03/sccompoundingacademy-web` |
| **Stack** | Next.js 16 · React 19 · Tailwind 4 · next-intl · Stripe · Resend · Airtable · Mux (v1.5) |
| **Hosting** | Vercel |
| **Local path** | `/Users/jan.zayas1/Desktop/scca_landing_components/sccompoundingacademy-web` |

---

## Current state

### ✅ Live in production
- Complete landing page (10 sections: Hero, Confianza, Cursos, Aprenderás,
  Para quién es, Especialidades, Galería, FAQ, Ubicación, IG destacado, CtaFinal)
- Bilingual ES/EN routing (`/es` and `/en`)
- Inscription + Stripe Checkout (code ready, waiting on owner keys)
- Stripe webhook + confirmation emails + Airtable persistence (idem)
- Legal docs approved by attorney (Privacy, Terms, Refund)
- Instagram section with 4 curated educational posts from
  @santacruzpharmacare
- Footer with real contact info (Bayamón address, phone, email, hours)
- All brand assets verified (logo full + shield, favicons all resolutions)

### ⏸ Blocked on owner setup
- Real payment processing (Stripe activation + Price IDs)
- Inscription persistence (Airtable base + tokens)
- Custom domain `sccompoundingacademy.com` (register + Vercel DNS)
- Branded email (Resend sender domain verification)
- Instagram auto-refresh (FB Developer App + 3 GitHub Secrets)

### 🔵 Documented but not built (v1.5/v2)
- Student portal (NextAuth magic-link + quiz engine)
- Post-test with auto-generated certificate PDF
- 11 AI-narrated complementary modules (Gamma + Canva → Mux)
- Public verification page `/verificar/[certNo]`
- Auto-refresh IG via GitHub Actions

---

## Major architectural decisions

| Decision | Value | Why |
|---|---|---|
| Legal entity | SCCA LLC, separate from pharmacy | Confirmed by owner; accounting reasons |
| Payment processor | **Stripe** (not Shopify) | $570/year cheaper + full form control |
| Persistence | **Airtable** (no server DB) | 12-36 students/year doesn't justify DB |
| Domain | `sccompoundingacademy.com` via Cloudflare | $10/year, best free DNS |
| Transactional email | **Resend** | Already in use |
| Portal auth (v1.5) | **NextAuth magic-link via Resend** (no passwords) | Simpler, better UX |
| Portal video hosting | **Mux Video** | Premium feel, native React, ~$45/year |
| Video production | **Gamma Plus + Canva Pro** (owner already pays) | $0 incremental |
| IG auto-refresh | **GitHub Action every 6h** | $0 infra, git-versioned |
| Certificate format | **PDF** server-generated | Professional standard |
| Cert numbering | `SCCA-{courseId}-{YYYY}-{NNN}` | Traceable |
| Post-test passing score | **80%** | Healthcare CE standard |
| Quiz retries | **Unlimited until pass** | Reduces abandonment |

---

## Brand specs (locked)

**Canonical palette** (from refined `SC Compounding Academy.pdf`):

```
#225560  deep teal       (titles, signatures)
#368798  mid teal         (reserved)
#E9EA8A  chartreuse        (CTAs, eyebrow bars, accents)
#EAE2D6  sand              (warm neutral)
#F5F6F7  off-white         (cool surfaces)
#404040  ink               (body text)
#666666  muted             (captions)
```

> Site currently uses original brandsheet hexes (`#195561`, `#E6EA82`,
> `#EAE1D6`, `#F3F3F4`) — visual difference minimal. TODO: align if
> owner wants. ~5 lines in `lib/brand.ts` + `globals.css`.

**Typography**:
- Heading + body: ITC Avant Garde Gothic Pro → fallback Montserrat (Canva-friendly)
- Accent: Khmer MN → fallback Cormorant Garamond Italic

**Brand assets** (in `/public/brand/`):
- `logo-full.png` — horizontal lockup (transparent)
- `logo-mark.png` — chartreuse SCCA shield only
- `pattern-tile.png` — brand wallpaper pattern
- `icon.svg` + favicons all resolutions

---

## Vendor stack

| Service | Status | Purpose | Cost |
|---|---|---|---|
| **Cloudflare** | ⏸ Pending | Domain + DNS + email forwarding | $10/year |
| **Stripe** | ⏸ Pending (LLC required) | Inscription payment | 2.9% + $0.30/tx |
| **Resend** | ✅ Active | Transactional email | $0 (3k/mo free) |
| **Airtable** | ⏸ Pending | DB inscriptions + cohorts + certs | $0 (1k records free) |
| **Vercel** | ✅ Active | Hosting | $0 (Hobby) |
| **Gamma Plus** | ✅ Owner pays | Slides + AI narration | $10/mo |
| **Canva Pro** | ✅ Owner pays | Brand kit + video editing | $13/mo |
| **Mux Video** | ⏸ Pending (v1.5) | Module video hosting | ~$45/year |
| **Facebook Dev App** | ⏸ Pending (v2) | IG auto-refresh | $0 |

---

## Owner action items (priority order)

### Blocking v1 (cobro soft-launch)
1. **Register domain** `sccompoundingacademy.com` in Cloudflare (~5 min)
2. **Confirm/activate SCCA LLC** + bank account for Stripe
3. **Create Stripe account** under SCCA LLC → activation (3-5 days)
4. **Create 3 Products + Prices** in Stripe Dashboard (USP 795 / 800 / Combinado)
5. **Define final pricing** per course
6. **Create Airtable base** "SCCA Inscripciones" with 3 tables (Estudiantes, Cohortes, Inscripciones)
7. **Paste env vars** in Vercel: STRIPE_*, AIRTABLE_*, NEXT_PUBLIC_SITE_URL

### Blocking v1.5 (student portal)
8. **Write 20-30 question bank** USP 795 with explanations + references
9. **Write 20-30 question bank** USP 800 with explanations + references
10. **Produce 11 videos** AI-narrated (Gamma → Canva → Mux) — pilot Module 2 first
11. **Create Mux account** + tokens

### Blocking IG auto-refresh (v2)
12. **Convert @santacruzpharmacare to IG Business** + connect to FB Page
13. **Create FB Developer App** + obtain long-lived token + IG Business User ID
14. **Create fine-grained GitHub PAT** + add 3 secrets to repo

See `.github/workflows/README-IG-AUTO-REFRESH.md` for step-by-step
guide on items 12-14.

---

## Plans archived

Long-form planning lives in **`~/.claude/plans/scca-landing-page-virtual-snowglobe.md`** (~570 lines, 3 extensions documented):

1. **v1.5 ext #1 — Auto-cert on post-test pass**: server-side builder + numbering + email + Airtable + `/verificar/[certNo]`
2. **v1.5 ext #2 — Portal with AI-narrated video + Mux**: production workflow + `<ModuleVideo>` component + progress tracking
3. **v2 — IG real-time via GitHub Action**: workflow every 6h + monthly token refresh

---

## Repo key structure

```
sccompoundingacademy-web/
├── src/
│   ├── app/[locale]/          ← pages (home, cursos, contacto, inscripción, legal/*)
│   ├── app/api/
│   │   ├── contact/route.ts    ← contact form
│   │   ├── inscripcion/route.ts ← Stripe Checkout session creator
│   │   └── webhooks/stripe/    ← post-payment handler
│   ├── components/
│   │   ├── layout/             (Header, Footer, SkipLink)
│   │   ├── marketing/          (Hero, CursosGrid, Aprenderas, ParaQuienEs, etc.)
│   │   ├── brand/              (LogoFull, LogoShield)
│   │   └── ui/                 (Button, Reveal, Container, Accordion, etc.)
│   ├── lib/
│   │   ├── brand.ts            ← color tokens (no-hex-literal lint enforces)
│   │   ├── courses.ts          ← COURSES + COHORTS catalogue
│   │   ├── stripe.ts           ← Stripe SDK instance
│   │   ├── airtable.ts         ← Airtable client
│   │   └── emails/             (inscripcion-confirmacion, interna)
│   └── messages/               (es.json + en.json, 152 keys parity)
├── public/
│   ├── brand/                  (logos + pattern)
│   ├── photos/                 (5 lab photos)
│   └── instagram/              (4 post thumbnails)
├── docs/
│   └── modules/refined-module-prompts.md  ← 15 modules with 2025-2026 evidence
├── .github/workflows/
│   ├── refresh-ig.yml          ← cron every 6h (dormant until secrets set)
│   ├── refresh-ig-token.yml    ← cron monthly
│   └── README-IG-AUTO-REFRESH.md (owner setup guide)
├── scripts/
│   ├── fetch-ig-feed.mjs       ← Graph API → thumbnails + i18n
│   ├── refresh-ig-token.mjs    ← extends long-lived token
│   ├── refresh-ig-thumbs.mjs   ← manual override
│   └── check-i18n-parity.mjs
└── tests/                      (vitest unit + playwright e2e)
```

Plus auxiliary folder at `/Desktop/scca_landing_components/certificate/`:
- `certificate-template.png/svg` — final certificate visual
- `build-certificate.mjs` — Sharp-based renderer
- `CANVA-GUIDE.md` — owner guide to reconstruct in Canva
- `assets/` — brand assets for upload

---

## Repo conventions

- **No-hex-literal rule** (`tests/e2e/brand-lint.spec.ts`) — all hex must
  come from `src/lib/brand.ts`, except in `/public/*` and emails that
  interpolate from `brand.ts`
- **i18n parity** — `pnpm check:i18n` must pass (152+ identical keys ES/EN)
- **PR cycle**: branch → commit → push → `gh pr create` → `gh pr merge --squash --delete-branch`
- **Co-author in commits**: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`
- **Full gauntlet** before merge: `pnpm typecheck && pnpm lint && pnpm check:i18n && pnpm test && pnpm test:e2e && pnpm build`

---

## How to pick up in a new session

Drop this in the prompt:

```
Read STATUS.md in the SCCA repo for full context. The path is
/Users/jan.zayas1/Desktop/scca_landing_components/sccompoundingacademy-web.

The plan with v1.5 + v2 extensions lives at
~/.claude/plans/scca-landing-page-virtual-snowglobe.md.

What's the next owner blocker we can unblock today?
```

### Critical path to first cobro

1. Owner registers domain → I configure Vercel custom domain + Resend
   sender (15 min)
2. Owner activates Stripe + shares test keys → I wire it, test purchase
   with `4242 4242 4242 4242` card (30 min)
3. Owner creates Airtable + shares token → I wire it, validate
   persistence (15 min)
4. Soft-launch to first 5 WhatsApp prospects

---

## PR history (30 PRs)

```
PR #6-#8   Apothecary Editorial direction (retired in PR #13)
PR #9-#12  Polish editorial: typography, Bayamón, §07 Ubicación, transparent logos
PR #13     COMPLETE RESTYLE → clean medical-pharma (8 deletes + 7 new components)
PR #14     Brand accent vocabulary (chartreuse eyebrow bars, hover stripes, shield seal)
PR #15-#17 Address precision, brand favicons regenerated
PR #18-#19 Logo update + Instagram featured section
PR #20     IG real posts wired (4 educational posts + refresh-ig-thumbs script)
PR #21     Precise address + hours from IG post
PR #22     Section title includes @username
PR #23     Favicons regenerated from real shield
PR #24-#26 Anti-slop polish, mobile hero fix, compact header, course cards refined
PR #25     Inscripción + Stripe Checkout + webhook + Airtable + emails
PR #27     Legal counsel review (drafts v2, 15 critical corrections)
PR #28     Legal attorney-approved (draft notice removed)
PR #29     IG auto-refresh GitHub Action (workflows + scripts, dormant without secrets)
PR #30     Module prompts archived (15 modules with 2025-2026 evidence)
```
