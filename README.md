# Santa Cruz Compounding Academy — Web

Bilingual (ES/EN) landing site and enrollment platform for **Santa Cruz Compounding Academy (SCCA)**, a Puerto Rico–based pharmacy education provider specializing in **USP 795** (Non-Sterile Compounding) and **USP 800** (Hazardous Drug Handling).

> **Educamos para formar bienestar y salud.**
> *We educate to build wellness and health.*

## Status

Pre-implementation. See [`docs/superpowers/specs/`](docs/superpowers/specs/) for the design spec. Implementation plan lives in `docs/superpowers/plans/` (added next).

## Stack (planned)

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Hosting:** Vercel
- **Database + Auth + Storage:** Supabase (Postgres)
- **Payments:** Stripe Checkout + Stripe Tax (for PR IVU)
- **Transactional email:** Resend (with React Email)
- **i18n:** `next-intl` with translated slugs
- **Styling:** Tailwind CSS, brand tokens centralized in `/lib/brand.ts`
- **3D hero:** Blender (Eevee) → 80 WebP frames, scroll-driven scrub (no WebGL)

## Repo layout

```
/brand/source/        — original brand reference PDFs (single source of truth)
/docs/superpowers/    — spec & implementation plans
/                     — Next.js app (added during implementation)
```

## Brand reference

The canonical brand specs live in [`/brand/source/`](brand/source/). Any contributor must read those before touching styling. Hex literals outside `/lib/brand.ts` are blocked by lint.
