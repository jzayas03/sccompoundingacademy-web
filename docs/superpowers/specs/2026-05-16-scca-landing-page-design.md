# SCCA Landing Page & Enrollment Platform — Design Spec

**Date:** 2026-05-16
**Status:** Approved for implementation planning
**Repo:** `~/Desktop/sccompoundingacademy-web`
**Authors:** Jan Zayas + Claude

---

## Context

Santa Cruz Compounding Academy (SCCA) is a Puerto Rico–based pharmacy education provider specializing in **USP 795** (Non-Sterile Compounding) and **USP 800** (Hazardous Drug Handling). USP 797 (Sterile) is explicitly out of scope.

Today the Academy has no web presence, no payment infrastructure, and no admin tooling. This spec defines a single bilingual (ES/EN) site that:

1. Markets the Academy with brand fidelity matching the existing brand sheet
2. Hosts a growing course catalog with cohort-based enrollment
3. Accepts payment, sends receipts + invoices, and stores tax records
4. Is operated by a single instructor with no developer involvement post-launch

The intended outcome: a learner discovers the Academy, picks a course, picks an available cohort, pays, receives Stripe-generated receipt + invoice plus an SCCA-branded confirmation email, and the instructor sees a new paid registration with one click in the admin.

---

## 1. Architecture & Stack

| Concern             | Choice                                                         | Why                                                            |
| ------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| Framework           | Next.js 15 (App Router, TypeScript, RSC)                       | Marketing + dynamic flows in one codebase                      |
| Hosting             | Vercel                                                         | Zero-config for Next.js; free tier covers launch               |
| Styling             | Tailwind CSS + `/lib/brand.ts` tokens                          | No hex literals outside tokens file (lint-enforced)            |
| i18n                | `next-intl` with locale-prefixed routes (`/es/...`, `/en/...`) | App Router native; supports translated slugs                   |
| DB + Auth + Storage | Supabase (Postgres)                                            | Built-in table editor doubles as admin; RLS for security       |
| Payments            | Stripe Checkout (hosted)                                       | Zero PCI scope; auto receipts; invoice PDF; Stripe Tax for IVU |
| Webhooks            | Stripe → Next.js API route → Supabase                          | Single source of truth: seats flip to "sold" only on webhook   |
| Transactional email | Resend + React Email                                           | Branded enrollment confirmation in HTML email                  |
| 3D hero             | Blender (Eevee) → 80 WebP frames, scroll-scrubbed              | Apple-style cinematic, no WebGL, mobile-safe                   |
| Domain              | TBD — to be registered before launch                           | Stripe + email both depend on it                               |

**Runtime cost at zero traffic:** $0/mo. **Recurring:** domain (~$12/yr). **Per-transaction:** Stripe 2.9% + $0.30.

---

## 2. Page Structure & Routes

### Site map

```
/                          → 302 redirect to /es or /en (Accept-Language detection)
/{locale}                  → Landing page
/{locale}/cursos|courses              → Catalog
/{locale}/cursos|courses/[slug]       → Course detail + cohort picker → checkout
/{locale}/checkout/exito|success      → Post-payment confirmation
/{locale}/checkout/cancelado|canceled → User abandoned
/{locale}/contacto|contact            → Contact form
/{locale}/sobre|about                 → Instructor bio (optional v1)
/{locale}/legal/{privacidad|privacy,terminos|terms}
```

Slugs translate per locale. `next-intl` handles the pathname mapping.

### API routes (server-only)

- `POST /api/checkout/session` — creates a Stripe Checkout session for a chosen cohort
- `POST /api/stripe/webhook` — handles `checkout.session.completed`, `charge.refunded`, `checkout.session.expired`
- `POST /api/contact` — contact form → email instructor via Resend

### Landing page sections (top → bottom)

1. **Sticky header** — wordmark, nav, language toggle (ES/EN pill), primary CTA
2. **Hero (Billboard style)** — deep-teal `#225560` background, Blender mortar scrubbing in the back/side, chartreuse headline ("TU PRÓXIMA CERTIFICACIÓN COMIENZA AQUÍ"), instructor/pharmacist photo on teal
3. **Tagline band** — full-bleed deep-teal strip with `EDUCAMOS PARA FORMAR BIENESTAR Y SALUD.` in chartreuse, ALL CAPS, italic emphasis on second clause
4. **Featured courses** — 3 cards on off-white, each with USP standard badge, next cohort date, seats remaining, "Ver detalles"
5. **Why SCCA** — 4 value props (instructor certificado, cohortes pequeñas, certificación al completar, alineado con USP 795/800), chartreuse line icons on sand background
6. **Instructor intro** — photo + bio + credentials on deep-teal
7. **Pattern divider band** — secondary teal `#368798` with low-opacity repeating SCCA monogram pattern
8. **FAQ** — accordion (6–8 questions: payment, cancellation, certification, USP alignment, formats)
9. **Pattern divider band** (same)
10. **Footer CTA band** — sand background, "¿Listo para certificarte?" + primary button
11. **Footer** — contact, legal, social, mark in chartreuse on deep-teal

Mobile order is identical, stacked. The scroll-scrub mortar runs only on the hero.

### Out of v1

Student login, LMS, course materials hosting, coupons (Stripe Checkout supports them natively when needed), blog, multi-instructor.

---

## 3. Data Model

Four tables + one view in Postgres. RLS enabled on every table.

### `courses`

```
id              uuid PK
slug            text UNIQUE
name            jsonb           -- { "es": "...", "en": "..." }
short_desc      jsonb
long_desc       jsonb           -- markdown
duration_hours  int
price_cents     int             -- USD cents
hero_image_url  text NULLABLE
is_published    bool DEFAULT false
sort_order      int DEFAULT 0
created_at, updated_at  timestamptz
```

### `cohorts`

```
id              uuid PK
course_id       uuid FK → courses(id)
starts_on       date
ends_on         date
schedule        jsonb           -- { "es": "Mar/Jue 6–9pm", "en": "Tue/Thu 6–9pm" }
location        jsonb
seats_total     int
status          text DEFAULT 'open'   -- 'open' | 'closed' | 'cancelled'
stripe_price_id text NULLABLE
created_at, updated_at  timestamptz
```

### `registrations`

```
id              uuid PK
cohort_id       uuid FK → cohorts(id)
first_name      text
last_name       text
email           citext
phone           text NULLABLE
locale          text                  -- 'es' | 'en' — drives receipt language
status          text DEFAULT 'pending' -- 'pending' | 'paid' | 'refunded' | 'cancelled'
stripe_session_id         text UNIQUE
stripe_payment_intent_id  text NULLABLE
stripe_customer_id        text NULLABLE
stripe_invoice_id         text NULLABLE
stripe_invoice_url        text NULLABLE  -- Stripe-hosted PDF
stripe_receipt_url        text NULLABLE
invoice_pdf_storage_path  text NULLABLE  -- our cold-backup copy in Supabase Storage
invoice_number            text NULLABLE  -- Stripe's sequential number, denormalized
amount_paid_cents int NULLABLE
tax_cents         int NULLABLE          -- IVU amount
paid_at           timestamptz NULLABLE
notes             text NULLABLE         -- instructor-only
created_at, updated_at  timestamptz
UNIQUE (cohort_id, email)
```

### `contact_messages`

```
id          uuid PK
name        text
email       citext
phone       text NULLABLE
subject     text NULLABLE
message     text
locale      text
ip_hash     text                       -- hashed for rate-limiting
created_at  timestamptz
```

### View: `cohort_seats`

```sql
SELECT
  c.id AS cohort_id,
  c.seats_total,
  COUNT(r.id) FILTER (WHERE r.status = 'paid') AS seats_sold,
  c.seats_total - COUNT(r.id) FILTER (WHERE r.status = 'paid') AS seats_remaining
FROM cohorts c
LEFT JOIN registrations r ON r.cohort_id = c.id
GROUP BY c.id;
```

### Concurrency rule

The Stripe webhook is the **only** writer that flips `registrations.status → 'paid'`. Inside the handler:

```
BEGIN;
  SELECT seats_remaining FROM cohort_seats WHERE cohort_id = $1 FOR UPDATE;
  IF seats_remaining > 0:
    UPDATE registrations SET status='paid', paid_at=now(), ...
  ELSE:
    UPDATE registrations SET status='cancelled', ...
    -- caller triggers Stripe refund
COMMIT;
```

Two simultaneous last-seat checkouts: both create `pending` rows, Stripe processes both payments, only one webhook transaction wins; the loser is auto-refunded. UI shows live seat counts but they are advisory.

### Row Level Security

| Table               | Anonymous                                     | Authenticated instructor | Service role (server)     |
| ------------------- | --------------------------------------------- | ------------------------ | ------------------------- |
| `courses`           | SELECT where `is_published`                   | full                     | full                      |
| `cohorts`           | SELECT where parent published + status='open' | full                     | full                      |
| `registrations`     | none                                          | full                     | full (writes via webhook) |
| `contact_messages`  | none                                          | full                     | full (writes via API)     |
| `cohort_seats` view | SELECT                                        | full                     | full                      |

---

## 4. Enrollment & Payment Flow

### Happy path

```
1. Visitor lands on /es → reads catalog → opens course detail
2. Picks a cohort → modal collects nombre, apellido, email, teléfono
3. Clicks "Continuar al pago ($499)"
4. POST /api/checkout/session
   - server creates a 'pending' registrations row (UNIQUE locks cohort_id+email)
   - creates Stripe Checkout Session with metadata { registration_id }
   - returns Stripe URL
5. Browser redirects to Stripe Checkout (locale-matched, brand-colored)
6. User pays (card / Apple Pay / Google Pay)
7. Stripe redirects to /{locale}/checkout/exito?session_id=...
8. Stripe webhook fires → atomic transaction marks registration 'paid' (or refunds if oversold)
9. Webhook triggers Resend → branded confirmation email with .ics calendar invite
10. User receives 3 emails: Stripe receipt, Stripe invoice PDF, SCCA-branded confirmation
```

### State machine

```
            (new) ──► pending ──► paid ──► refunded
                       │
                       └─► cancelled (oversold, expired, instructor cancel)
```

Pending rows that never receive a webhook are swept by a daily Supabase cron at 24h and marked `cancelled` (frees the unique constraint).

### Stripe Checkout configuration

- Mode: `payment` (one-time)
- `locale`: passed from registration locale → Stripe localizes UI in ES/EN
- `customer_email`: prefilled
- `automatic_tax: { enabled: true }` — Stripe Tax handles PR IVU
- `invoice_creation: { enabled: true }` — Stripe generates PDF invoice tied to the receipt
- `metadata: { registration_id }` — links Stripe session ↔ our row
- Success URL: `/{locale}/checkout/exito?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `/{locale}/checkout/cancelado`
- Session expiry: 24h (Stripe default)

### Webhook handler

Endpoint: `POST /api/stripe/webhook`. Listens to:

- `checkout.session.completed` → flip `paid` (atomic seat check; auto-refund on race)
- `charge.refunded` → flip `refunded`, free seat
- `checkout.session.expired` → flip pending → `cancelled`

**Idempotency:** dedupe by Stripe event ID.
**Signature verification:** required; unsigned → 400.
**Invoice backup:** after success, fetch invoice PDF from Stripe API, store in Supabase Storage at `invoices/{year}/{invoice_number}.pdf`, populate `invoice_pdf_storage_path`.

### Receipts, invoices, and what's stored

**Buyer receives:**

- Stripe receipt email (with hosted receipt page + PDF link)
- Stripe invoice PDF (auto-generated, with IVU breakdown)
- SCCA-branded confirmation email (separate, with cohort details + .ics)

**Academy retains:**

- `stripe_invoice_id`, `stripe_invoice_url`, `stripe_receipt_url` on the registration row
- Cold-backup PDF copy in Supabase Storage (we control)
- Full transaction record in Stripe Dashboard (forever)
- `tax_cents` and `invoice_number` denormalized for reporting

**Tax posture:** Stripe Tax is the calculation engine. The Academy owns its own invoice PDFs (not just Stripe-hosted URLs) for tax-record purposes. No custom tax math; the system supports whatever Stripe Tax determines based on the Academy's PR registration.

### Edge cases

| Case                           | Handling                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| User double-clicks Pay         | Idempotent API: same pending row reused; one Stripe session only                      |
| Last seat sold mid-checkout    | Webhook detects oversold, auto-refunds, sends "sold out" email + offers other cohorts |
| Card declined                  | Stays on Stripe Checkout; no DB change until success                                  |
| User closes Stripe tab         | Pending row expires in 24h via cron; seat released                                    |
| Instructor cancels cohort      | v1: refund manually in Stripe; v1.1: one-click admin action                           |
| Stripe-initiated refund        | `charge.refunded` webhook flips row to `refunded` automatically                       |
| Duplicate email on same cohort | DB UNIQUE blocks; UI shows "Ya estás inscrito en esta cohorte"                        |
| Webhook delayed                | Success page polls every 3s; swaps to confirmation when webhook lands                 |

---

## 5. Instructor Admin

### Login

Instructor uses the Supabase Dashboard (`supabase.com/dashboard`) — **no custom admin UI on the public site in v1**. Email + password, 2FA via TOTP.

### Daily workflows (all in Supabase Table Editor)

| Task                   | How                                                                            |
| ---------------------- | ------------------------------------------------------------------------------ |
| Add a course           | Insert row in `courses`, fill bilingual JSONB, toggle `is_published`           |
| Create a cohort        | Insert row in `cohorts`, set dates, seats, schedule                            |
| View enrolled students | Filter `registrations` by `cohort_id` + `status='paid'`; one-click CSV export  |
| Download an invoice    | Click `invoice_pdf_storage_path` field                                         |
| Handle refund          | Refund in Stripe Dashboard; webhook auto-updates DB                            |
| Cancel a cohort        | Set `cohorts.status='cancelled'`; manually refund registrants (v1.1 automates) |

### Permissions

- Anonymous: read-only on published courses/cohorts + `cohort_seats`
- Authenticated instructor: full CRUD + Storage read on `invoices/`
- Service role (Next.js server): only key allowed to write `registrations`; never exposed to browser

### Onboarding doc

`/docs/instructor-guide.md` (added during implementation) — screenshots + step-by-step for every workflow above. Printable as PDF.

### Triggers for building a custom admin UI later

1. A second instructor or staff member joins (scoped permissions, branded login)
2. Daily admin actions exceed ~5/day (custom buttons start saving real time)
3. Mobile-friendly admin needed
4. In-app "email all students in cohort X" workflows needed

When any triggers, we add `/admin` routes — clean upgrade, no data migration.

---

## 6. Blender Mortar (3D Hero)

### Concept

A glossy white ceramic mortar with a pestle that **grinds inside the bowl** as the user scrolls the hero section. Mortar stays still; pestle does the work. Mortar reads as a real object photographed in the brand world.

### Geometry brief

| Spec          | Value                                                 |
| ------------- | ----------------------------------------------------- |
| Style         | Photoreal-leaning ceramic, soft beveled edges         |
| Mortar        | Wide bowl, slight outward rim flare, smooth foot      |
| Pestle        | Resting at ~30° tilt, full handle visible above rim   |
| Bowl interior | Modeled concave — pestle visibly moves inside it      |
| Topology      | Quad-based, subdivision-surface modifier level 2      |
| Asset         | Modeled from scratch (not traced from any stock file) |

### Materials (two shaders, no textures)

**Mortar body** — warm off-white ceramic

- Base: `#F1ECE2` · Roughness: 0.32 · Specular: 0.55 · Clearcoat: 0.25

**Pestle** — cooler off-white

- Base: `#EAE6DC` · same shader otherwise

No textures, no PBR maps. Pure shaders keep renders fast and crisp.

### Lighting (Eevee-friendly, brand-toned rims)

| Light            | Position               | Color            | Strength |
| ---------------- | ---------------------- | ---------------- | -------- |
| Key              | Upper-front-right, 45° | Warm white 4800K | 700W     |
| Fill             | Lower-front-left       | Cool white 6500K | 250W     |
| Rim (teal)       | Upper-back-left        | `#368798`        | 900W     |
| Rim (chartreuse) | Upper-back-right       | `#E9EA8A`        | 400W     |
| Contact shadow   | Soft area light below  | —                | tuned    |

Background: **transparent** (alpha). Hero deep-teal is a CSS background-color, not baked.

### Animation

4 seconds @ 24fps = 96 keyframes, exported as 80 WebP frames.

**Mortar:** zero motion (the stage).
**Pestle:**

- Tip orbits horizontal circle inside bowl (~1.5cm radius), linear interpolation
- Pestle leans 8° into direction of travel ("hand pressing" feel)
- Handle traces larger ~2.5cm circle inversely-phased to tip (wrist motion)
- Tip rises ~2mm twice per orbit (press-and-release of grinding), eased curve

Combined = visceral "hand grinding" gesture every pharmacist recognizes.

### Render settings

- Engine: **Eevee** (real-time; ~5–15 sec/frame on any modern laptop)
- Samples: 64 (Eevee viewport quality at render)
- Resolution: 1600×1600 px
- Output: PNG with alpha, 8-bit
- Total render time: ~10–20 min on the instructor's laptop
- **Cost: $0** — runs locally in Blender

### Export pipeline

After Blender outputs 80 PNGs, a build script:

1. `cwebp -q 78 frame_NNNN.png → frame_NNNN.webp` (~25–30 KB/frame)
2. Outputs to `/public/hero/mortar/frame_NNNN.webp`
3. Generates `/public/hero/mortar/manifest.json`

**Frames not committed to git** — they're a build artifact, gitignored. The `.blend` file _is_ committed at `/blender/mortar.blend`.

### Web integration: `<HeroMortar />`

```
- Renders <img> at frame 1 (preloaded inline, part of LCP)
- On mount: preloads frames in scroll-progress priority (25/50/75% first)
- IntersectionObserver: animates only while hero is in viewport
- requestAnimationFrame loop:
    progress = clamp(scrollY / heroHeight, 0, 1)
    targetFrame = floor(progress * 79) + 1
    if (targetFrame !== currentFrame && loaded.has(targetFrame))
      img.src = manifest[targetFrame].url
- prefers-reduced-motion: static frame 40 (mid-grind, looks intentional)
- Hero leaves viewport: stop rAF, free CPU
```

### Performance budget (firm)

| Metric                        | Limit                                         |
| ----------------------------- | --------------------------------------------- |
| Total payload                 | ≤ 2.5 MB (all 80 frames)                      |
| Per-frame size                | ≤ 35 KB WebP                                  |
| Frame 1 preload               | inline `<link rel="preload">`, < 100 KB       |
| LCP impact                    | 0 ms (frame 1 IS part of LCP)                 |
| Main-thread CPU during scroll | ≤ 4 ms/frame                                  |
| Memory                        | ≤ 30 MB decoded; capped at ~20 decoded frames |
| Mobile (viewport < 768px)     | Frames downscaled to 800px, half bytes        |

**Fallback:** if budget blown for any reason, single static hero image — page never breaks.

### Deliverables

- [ ] `/blender/mortar.blend` source
- [ ] `/blender/README.md` with re-render instructions
- [ ] 80 PNG frames (build artifact, gitignored)
- [ ] 80 WebP frames in `/public/hero/mortar/`
- [ ] `manifest.json`
- [ ] `/public/hero/mortar-poster.webp` static fallback
- [ ] `<HeroMortar />` React component

### Out of scope

Particle effects, interactive WebGL orbit/drag, separately-animated pestle controls.

---

## 7. Bilingual ES/EN

### Library

**`next-intl`** with locale-prefixed routes and translated slugs.

### URL strategy

```
/es/cursos/usp-795-fundamentos      ↔  /en/courses/usp-795-foundations
```

Translated slugs for SEO + shareability. Mapping declared once in `i18n.config.ts`.

### Content tier split

| Type                              | Location                | Edited by                |
| --------------------------------- | ----------------------- | ------------------------ |
| UI strings (buttons, nav, errors) | `messages/{es,en}.json` | Developer (in Git)       |
| Course/cohort content             | JSONB columns           | Instructor (in Supabase) |

This split is the whole point of Supabase admin: instructor never touches Git to publish a course.

### Language toggle UX

- Persistent header pill: `[ES | EN]`, active locale in deep-teal
- Clicking swaps to the _equivalent translated URL_ (not just home)
- Preference persists in `NEXT_LOCALE` cookie
- Same on mobile, never in a hamburger

### Detection (first visit)

1. `NEXT_LOCALE` cookie if set
2. Accept-Language header (`es-*` or `en-*`)
3. Default: `es`

### SEO

- `<html lang>` per locale
- hreflang tags linking locale pairs
- Self-referential canonical URL
- OG tags translated per locale
- JSON-LD `Course` schema with `inLanguage`
- Sitemap lists both locales of every page

### What's translated

Translated: UI chrome, course names + descriptions, cohort schedules, instructor bio, slogans, legal pages, branded confirmation email, Stripe Checkout (auto), Stripe receipt (auto), Stripe invoice (auto).

Not translated: prices (USD only), USP standard names (`USP 795`, `USP 800` are international identifiers).

### Translation workflow

- UI: developer writes both languages in same PR; CI fails if keys differ between `en.json` and `es.json`
- Content: `zod` validates both keys present; can't `is_published=true` with missing locale

### Future languages

Adding `pt`: add to locales array, add `messages/pt.json`, add `pt` keys to JSONB, add slug mappings. No architectural change.

### Out of v1

Machine translation, per-user locale preferences (no accounts), locale-aware pricing, RTL.

---

## 8. Brand Tokens & Styling

### Single source of truth

**`/lib/brand.ts`** — exports every brand value. Tailwind reads from it. Hex literals forbidden anywhere else (lint-enforced).

```ts
export const brand = {
  colors: {
    tealDeep: "#225560",
    teal: "#368798",
    chartreuse: "#E9EA8A",
    sand: "#EAE2D6",
    offWhite: "#F5F6F7",
    white: "#FFFFFF",
    black: "#000000",
    gray: { 900: "#404040", 700: "#666666", 500: "#BABABA", 300: "#E0E0E0", 100: "#F5F5F5" },
    // Plus tint/shade ramps from brandsheet page 3 for each brand color
  },
  gradient: {
    brand:
      "linear-gradient(90deg, #225560 0%, #368798 25%, #E9EA8A 50%, #EAE2D6 75%, #F5F6F7 100%)",
  },
  radii: { sm: "8px", md: "16px", lg: "20px", xl: "28px", pill: "9999px" },
  shadows: {
    soft: "0 4px 12px rgba(34, 85, 96, 0.08)",
    lift: "0 8px 24px rgba(34, 85, 96, 0.12)",
  },
  type: {
    heading: [
      "ITC Avant Garde Gothic Pro",
      "Century Gothic",
      "Futura",
      "Montserrat",
      "system-ui",
      "sans-serif",
    ],
    body: [
      "ITC Avant Garde Gothic Pro",
      "Century Gothic",
      "Futura",
      "Montserrat",
      "system-ui",
      "sans-serif",
    ],
    accent: ["Khmer MN", "Cormorant Garamond", "Garamond", "serif"],
  },
} as const;
```

Tailwind config reads from `brand.ts`. Components write `bg-teal-deep`, `text-chartreuse`, `font-heading` — never hex.

### Fonts

- **Headings/body:** ITC Avant Garde Gothic Pro (license $200–600 one-time from MyFonts) OR **Montserrat** fallback (Google Fonts, free, indistinguishable for body)
- **Accent:** Khmer MN (macOS-bundled, no web license) → **Cormorant Garamond** fallback (Google Fonts, free)
- **Recommended path:** ship with Montserrat + Cormorant Garamond. License Avant Garde later; swap one config line, zero refactor.

Loaded via `next/font` (Google) or `next/font/local` (when WOFF2s are licensed).

### Logos (inline React SVG components)

```
/components/brand/
  LogoFull.tsx              horizontal: shield + wordmark
  LogoFullInverse.tsx       for chartreuse backgrounds
  LogoShield.tsx            square monogram
  LogoShieldInverse.tsx
  Wordmark.tsx              text-only
  Pattern.tsx               repeating SCCA monogram tile, opacity prop
  index.ts
```

SVGs traced from PDFs, not raster exports. All accept `className` + `aria-label`.

### Favicon, share images

```
/public/
  favicon.ico               16/32 multi-res
  icon.svg                  scalable
  apple-touch-icon.png      180×180
  og-image-es.png           1200×630 with ES slogan
  og-image-en.png           1200×630 with EN slogan
  manifest.json             PWA manifest
```

### Brand application placements on the landing page

Drawn from the existing brand-sheet treatments:

| Application                                                            | Where on landing page                                                 |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Billboard-style hero (pharmacist on teal + chartreuse callout)         | Hero section — section 1 of landing page                              |
| Tagline band (deep teal, chartreuse ALL CAPS, italic emphasis)         | Section 2, full-bleed                                                 |
| SCCA monogram pattern (secondary teal, low opacity)                    | Section 7 + section 9 — thin dividers                                 |
| Letterhead treatment (off-white sheet, teal header, chartreuse accent) | Branded enrollment confirmation email + instructor notification email |
| Logo lockup (full horizontal)                                          | Header, footer, every email                                           |
| Shield monogram                                                        | Favicon, app icon, hero accent, OG images                             |
| Brand gradient                                                         | Hero only (overuse cheapens it)                                       |
| Brand pattern                                                          | Section dividers only (never as primary background)                   |

### Component vocabulary

```
/components/ui/
  Button.tsx              primary | secondary | ghost | inverse
  Card.tsx                radius-lg, soft shadow, off-white or sand background
  Badge.tsx               for "USP 795", "3 plazas restantes"
  Container.tsx           max-w-7xl + responsive padding
  SectionBand.tsx         full-bleed colored band
  Heading.tsx             enforces font-heading + scale
  LocaleSwitch.tsx        ES/EN pill
  Accordion.tsx           FAQ
  FormField.tsx           label + input + error, branded
```

### Lint enforcement

```js
// .eslintrc.js
rules: {
  "no-restricted-syntax": ["error", {
    selector: "Literal[value=/^#[0-9A-Fa-f]{6}$/]",
    message: "No hex literals. Use brand tokens from /lib/brand.ts.",
  }],
}
```

### Slogans (canonical, embedded in i18n messages)

- **Primary ES:** `Educamos para formar bienestar y salud.`
- **Primary EN:** `We educate to build wellness and health.`
- **Secondary ES:** `Tu próxima certificación comienza aquí.`
- **Secondary EN:** `Your next certification starts here.`

Tagline treatment: ALL CAPS bold on first clause, italic on emphasis clause.

### Photography guidance

Documented in `/brand/source/notes.md`. Warm, real pharmacy/lab settings; diverse Latin American professionals; subjects on solid teal `#225560`; paired with chartreuse callout cards. Recommended: 30-min phone shoot of the instructor in white lab coat on teal backdrop, natural window light, three poses. Cost: free.

### Out of v1 (brand work deferred)

- Certificate-of-completion PDF (letterhead template ready, generator deferred)
- Marketing collateral templates (social posts, flyers)
- Animated brand intro / video splash

---

## Verification (post-implementation)

End-to-end test of the system after build:

1. **Brand fidelity check** — open every page; confirm zero hex literals outside `/lib/brand.ts` via `rg "#[0-9A-Fa-f]{6}" --type ts --type tsx --type css | grep -v lib/brand.ts`. Should return empty.
2. **i18n check** — manually visit `/es` and `/en` of every route; verify language toggle preserves the equivalent translated URL; verify no English text leaks into Spanish pages.
3. **Hero mortar check** — load `/es` on a phone (Safari iOS) and a laptop; scroll the hero; verify smooth scrub, no jank, total bytes ≤ 2.5 MB in DevTools Network tab.
4. **Enrollment happy path** — using Stripe test mode (`pk_test_...`): create a test cohort, register as a test learner, complete checkout with `4242 4242 4242 4242`, verify (a) Stripe receipt email arrives, (b) Stripe invoice PDF email arrives, (c) SCCA-branded confirmation email arrives with `.ics`, (d) seat count decrements in admin, (e) `invoice_pdf_storage_path` populated.
5. **Race condition test** — create a cohort with `seats_total=1`; in two browsers simultaneously complete checkout for the same seat; verify one succeeds, one is auto-refunded with the "sold out" email.
6. **Refund flow** — refund a test charge in Stripe Dashboard; verify webhook flips `registrations.status = 'refunded'` and seat is freed.
7. **Stripe Tax** — verify IVU line item appears on the invoice PDF; verify `tax_cents` populated on the registration row.
8. **Lighthouse** — run on `/es` on desktop and mobile; target ≥ 90 Performance, 100 Accessibility, 100 SEO, 100 Best Practices.
9. **RLS test** — using the anon key, attempt to read `registrations` from the browser console; should fail.
10. **Instructor walkthrough** — instructor follows `/docs/instructor-guide.md` to add a course, create a cohort, view enrollments, download an invoice — without developer help.

---

## Critical files to be added during implementation

| Path                                           | Purpose                                       |
| ---------------------------------------------- | --------------------------------------------- |
| `/lib/brand.ts`                                | Brand tokens (only legal home for hex values) |
| `/tailwind.config.ts`                          | Reads from `brand.ts`                         |
| `/i18n.config.ts`                              | Locales + pathname mapping                    |
| `/messages/{es,en}.json`                       | UI strings                                    |
| `/app/[locale]/page.tsx`                       | Landing page                                  |
| `/app/[locale]/cursos/[slug]/page.tsx`         | Course detail                                 |
| `/app/api/checkout/session/route.ts`           | Stripe Checkout session creation              |
| `/app/api/stripe/webhook/route.ts`             | Stripe webhook handler                        |
| `/components/marketing/HeroBillboard.tsx`      | Hero section                                  |
| `/components/marketing/HeroMortar.tsx`         | Scroll-scrub 3D component                     |
| `/components/marketing/TaglineBand.tsx`        | Full-bleed slogan                             |
| `/components/email/EnrollmentConfirmation.tsx` | Branded confirmation email                    |
| `/components/email/InstructorNotification.tsx` | Branded admin notification                    |
| `/supabase/migrations/*.sql`                   | Schema migrations                             |
| `/blender/mortar.blend`                        | 3D source                                     |
| `/blender/README.md`                           | Re-render instructions                        |
| `/docs/instructor-guide.md`                    | Admin walkthrough                             |

---

## Decisions log (for posterity)

- **Approach A chosen** over Astro/Airtable (B) and WordPress (C): brand fidelity + clean upgrade path
- **Supabase admin chosen** over custom admin UI: one instructor doesn't justify the build
- **Stripe Checkout chosen** over custom payment form: PCI scope = 0, native invoices/receipts/tax
- **Image-sequence scrub chosen** over WebGL: mobile reliability + cinematic Blender quality
- **Eevee chosen** over Cycles: free, fast (~20 min total render), visually equivalent for this scene
- **Bilingual from day one** chosen over ES-first: the audience is bilingual; cost is small
- **Stripe Tax chosen** over custom IVU math: regulatory updates are not our problem
- **Cold-backup invoices to Supabase Storage** added when "receipts are for taxes" was specified
- **USP 797 (Sterile) excluded** from all copy after instructor clarified curriculum scope
