# SCCA visual refresh — Phase 1 (landing) — design

**Date:** 2026-06-30
**Status:** Approved (brainstorming), pending implementation plan
**Scope:** Phase 1 = public landing/marketing surface. Phase 2 (student portal + forms/legal) is a separate spec that reuses the same token system.

## Goal

Modernize the **execution** of the SCCA web aesthetic — keep the brand (logo, Amapola teal/chartreuse palette, ITC Avant Garde type) exactly, but move from the current glassmorphism-heavy look to a **clean, editorial, clinical-premium** treatment. The brand DNA stays; the styling, layout, spacing, depth, and motion are refreshed.

## Guiding principle: eliminate AI slop

Every choice must be specific to SCCA's world (compounding under standard), not a framework default. Banned: centered hero with a gradient blob + two buttons; grids of identical `rounded-2xl` feature cards; uniform shadow/radius/spacing on everything; emoji-as-icons; SaaS gradients; the generic "broadsheet" editorial default (hairlines + dense newspaper columns with no soul). Decisions must read as intentional.

## Concept: "El Formulario" (compounding as a craft of precision)

The landing is treated like a precise compounding formulary: editorial, measured, clinical-premium. Authority comes from **deep teal as a clinical floor**, the **geometry of ITC Avant Garde** in large tight headlines, and **chartreuse as the single "active ingredient"** accent — one precise mark per view, never slathered.

### Signature element — the spec-tag system

Small **monospace** labels annotate content the way a compounded prescription is labeled: `USP ⟨795⟩ · ⟨800⟩`, `18 h`, `ACPE 0151`, `presencial · Bayamón`. These **encode something true** (the curriculum genuinely is standards-driven) — they are structure, not decoration. This is the one memorable element no generic "courses" site would have. Aligned consistently on a left **spec-rail**.

### The one aesthetic risk

A monospace utility face set against the geometric ITC Avant Garde — a deliberate *clinical formulary* contrast. Justified because compounding is measurement + standard. Without this risk, "clean/editorial" slides into the generic broadsheet default; the spec-tags anchor it to the subject.

## Token system

Brand hexes are unchanged (they live in `src/lib/brand.ts` + `globals.css @theme`). What changes is **usage**.

### Color — roles redefined
| Token | Hex | Role |
|---|---|---|
| `teal-deep` | `#195561` | Clinical floor — Hero, footer, 1–2 anchor sections. Authority. |
| `teal` | `#228698` | Links on dark, mid dividers, hover. |
| `chartreuse` | `#E6EA82` | "Active ingredient" — one accent per view: primary CTA, one "measure" mark, focus ring. Used sparingly. |
| `sand` | `#EAE1D6` | Warm editorial neutral — alternates section grounds without glass. |
| `off-white` | `#F3F3F4` | Primary surface (most sections). |
| `ink` (`gray-900`) | `#404040` | Body on light; off-white for body on teal. |
| grays 700/500/300/100 | — | Captions, hairlines, borders (used with restraint). |

**Removed:** translucency/blur, `MeshBackground`, default glass cards. The Amapola gradient survives only as a **2px "measure" rule**, used once or twice — never as a background.

### Type — three roles
- **Display — ITC Avant Garde Gothic**, large, tight tracking (−0.02 / −0.03em). Leans into its geometry; this is the personality.
- **Body — ITC Avant Garde**, `line-height 1.6`, max measure ~65ch (the geometric face tires in long blocks; solved with air + measure, not a new face — brand type is fixed).
- **Utility/data — a monospace (NEW)** for spec-tags and data (hours, dates, ACPE #, USP chapters). Candidate: **IBM Plex Mono** or **Geist Mono** (light, geometric, complements Avant Garde) — final pick during implementation.
- **Accent — Cormorant Garamond** (already in brand) used **once**: the instructor pull-quote. One warm serif breath against the geometry.

### Type scale
```
Display XL (hero)  clamp(3.5rem, 6vw, 6rem)   demi · tracking −0.03em
H2 (section)       clamp(2rem, 3.5vw, 3rem)   demi · tracking −0.02em
H3                 1.375rem
Body               1.0625–1.125rem · lh 1.6 · max 65ch
Spec-tag (mono)    0.78rem · UPPERCASE · tracking +0.08em
Eyebrow            mono or Avant Garde small-caps
```

### Spacing / shape
- Base **8px** scale; generous whitespace.
- Section rhythm via **alternating grounds** (off-white / sand / teal-deep), not identical cards.
- **Tighter radii**: 10–12px on surfaces (the current 20–28px reads soft/generic); `pill` only for tags + CTAs.
- **Depth by restraint**: a hairline (`gray-300`) or a single-direction subtle shadow — never blur.
- Consistent **left spec-rail** alignment for the mono annotations.

### Motion — deliberate, minimal
One orchestrated hero load (spec-tags tick in → headline → the chartreuse "measure" draws once), subtle scroll-reveal on section entrances. `prefers-reduced-motion` fully respected. No scattered effects — over-animation is exactly what reads as AI-generated.

## Component language (replaces glass)

- **Cards** (replace `GlassCard`): solid surface, hairline or single subtle shadow, 10–12px radius, generous padding, a spec-tag header. No translucency.
- **Cursos** (the key anti-slop move): SCCA has ONE integrated course (3 day-modules) + 2 tiers, so render it as a single **formulary entry**, not a 3-card grid:
  - eyebrow spec-rail (`CURSO · USP ⟨795⟩+⟨800⟩ · 18 h · ACPE 0151`)
  - course title in Avant Garde XL + a chartreuse measure
  - the 3 days as a **numbered sequence 01/02/03** (numbering is justified — the days ARE a sequence)
  - the two tiers as a **precise comparison** (Profesional $2,350 / Estudiante $495, hairline-separated), one chartreuse CTA.
- **Nav/Header** (replace `glass-nav`): solid off-white with a bottom hairline, logo + 3–4 links + one chartreuse CTA; solidifies subtly on scroll (no heavy blur).
- **Section bands / dividers** (replace `MeshBackground`): alternating solid grounds; the Amapola gradient appears **once** as a 2px "measure" rule between two key sections.
- **Forms** (inscripción / contacto — they convert, so clinical-premium matters): Avant Garde labels, inputs with hairline + tight radius + a crisp **chartreuse focus ring**, a spec-tag for tier/price, generous spacing. Feels like filling a precise order, not a SaaS form.
- **Footer** (anchor on teal-deep): wordmark, the slogan in Cormorant (the one serif breath), contact/legal in mono spec-tags.

## Landing application (section by section)

The current landing sections (keep the content/IA; restyle): Hero, Aprenderás, Especialidades / ParaQuienEs, CursosGrid → "El curso" formulary entry, Confianza, Instructor (with the Cormorant pull-quote), Galería / InstagramFeatured (photography on solid teal per the brandsheet), Reseñas, Ubicación, FAQ (FaqClean — editorial accordion, generous), CtaFinal (teal-deep ground + one chartreuse CTA), Footer.

Each section picks a ground from the alternation set and carries at most one chartreuse accent. The spec-rail annotations recur where standards/facts exist (course, ACPE, hours, location).

## Accessibility floor (not announced)
Responsive to mobile; `focus-visible` everywhere (chartreuse ring); `prefers-reduced-motion` respected; AA contrast (teal-deep + off-white; teal-deep text on chartreuse CTAs verified).

## What this is NOT
- Not a rebrand: logo, palette hexes, and ITC Avant Garde are untouched.
- Not new IA/copy architecture: same sections and routes; this is visual execution. (Copy may get small clarity edits per the writing principles, but no restructure.)
- Not the portal: Phase 2.

## Implementation notes (for the plan)
- Tokens are CSS-first (Tailwind v4 `@theme` in `globals.css`) + mirrored in `src/lib/brand.ts`; the `scca-brand/no-hex-literal` lint rule stays in force — new values go through tokens.
- Add the monospace utility face via `next/font` with a `--font-mono` variable + a `@theme` token; add a `.spec-tag` component utility.
- Remove/retire the glass utilities (`.glass-card`, `.glass-nav`, `.glass-modal`, `MeshBackground`, `GlassCard`) **only after** their consumers are migrated — track each consumer.
- Build prototypes and self-critique with screenshots before finalizing each section (per frontend-design); compare 2 hero variants before committing one.

## Out of scope / follow-ups
- Phase 2: portal + forms-heavy/legal surfaces (separate spec, same tokens).
- New photography shoot (brand notes call for subjects on solid teal) — use existing assets; flag gaps.
