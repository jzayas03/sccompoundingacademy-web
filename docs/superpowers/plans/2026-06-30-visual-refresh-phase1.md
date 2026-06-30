# SCCA Visual Refresh — Phase 1 (Landing) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Each section task is **design-iterative**: build → screenshot → self-critique against the spec's acceptance bullets → refine, per the **frontend-design** skill. The foundation tasks (1–3) are deterministic and carry full code.

**Goal:** Refresh the SCCA public landing from a glassmorphism look to the clean, editorial, *precise-but-warm* "El Formulario" direction — keeping the brand (logo, Amapola palette, ITC Avant Garde) — per `docs/superpowers/specs/2026-06-30-visual-refresh-phase1-design.md`.

**Architecture:** Tokens are CSS-first (Tailwind v4 `@theme` in `src/app/globals.css`) mirrored in `src/lib/brand.ts`. Phase 1 adds a self-hosted ITC Avant Garde + a monospace utility face, refreshes token *usage* (radii, depth, the spec-tag / slogan-lockup / shield-pattern signature utilities), builds shared primitives, then restyles each `src/components/marketing/*` section + Header/Footer + the two forms. The portal's glass utilities are **untouched** (Phase 2 owns them).

**Tech Stack:** Next.js 16 (App Router, RSC), Tailwind CSS v4 (CSS-first `@theme`), `next/font/local` + `next/font/google`, next-intl, Vitest, Playwright (screenshots).

## Global Constraints

- Keep the brand: logo, palette hex values, and ITC Avant Garde / Amapola DNA are **unchanged**. This is execution, not rebrand.
- `scca-brand/no-hex-literal` lint rule stays in force — every color goes through a token (`var(--color-*)` / Tailwind `*-teal-deep` etc.), never a raw hex outside `globals.css` + `src/lib/brand.ts`.
- **No glass in the landing**: no `backdrop-filter`/blur, no `GlassCard`/`MeshBackground`/`glass-*` in `src/components/marketing/*`, Header, or Footer. Do **not** modify or delete the glass utilities/components themselves — the portal (Phase 2) still uses them.
- Color roles: `teal-deep #195561` clinical floor; `teal #228698` links/dividers; `chartreuse #E6EA82` the ONE accent per view; `sand #EAE1D6` warm neutral; `off-white #F3F3F4` primary surface; `gray-900 #404040` body.
- Type roles: ITC Avant Garde (display + body, tracking −0.02/−0.03em on display), a monospace utility (spec-tags/data), Khmer MN→Cormorant italic accent (slogan lockup + one pull-quote only).
- Radii: 12–14px surfaces; `pill` only for tags + CTAs. Depth by hairline (`gray-300`) or single-direction subtle shadow — never blur.
- Accessibility floor: responsive to mobile; `focus-visible` (chartreuse ring) on every interactive; `prefers-reduced-motion` respected; AA contrast.
- Same IA, routes, and content; copy only gets small clarity edits (no restructure). i18n parity (`pnpm check:i18n`) must stay green for any `messages/*` change.
- Verify each task with: `pnpm typecheck`, `pnpm lint`, `pnpm vitest run`, `pnpm build`, and (section tasks) a desktop + mobile **screenshot** reviewed against the spec.

---

## File Structure

- `src/app/fonts.ts` — **modify**: replace Montserrat heading stand-in with self-hosted ITC Avant Garde (`next/font/local`); add the monospace utility face.
- `public/fonts/` — **create**: the licensed ITC Avant Garde `.woff2` files (provided by the owner).
- `src/app/globals.css` — **modify**: `--font-mono` + `--radius-card` tokens; `.spec-tag`, `.spec-rail`, `.slogan-lockup`, `.shield-pattern`, `.editorial-card` component utilities. (Glass `@layer components` block untouched.)
- `src/lib/brand.ts` — **modify**: mirror the new radii usage + a `mono` type role (keep as the TS reference; no hex changes).
- `src/components/ui/SpecTag.tsx`, `SpecRail.tsx`, `SloganLockup.tsx` — **create**: shared signature primitives.
- `src/components/ui/Card.tsx` — **modify**: editorial (solid, hairline, 12–14px) variant.
- `src/components/marketing/*` (Hero, CursosGrid, Aprenderas, Especialidades, ParaQuienEs, Confianza, Galeria, InstagramFeatured, Resenas, Ubicacion, Instructor, FaqClean, CtaFinal) — **modify**: restyle.
- `src/components/layout/Header.tsx`, `Footer.tsx` — **modify**: solid nav + teal-deep footer with slogan lockup.
- `src/components/marketing/inscripcion/InscripcionForm.tsx`, `src/components/marketing/ContactForm.tsx` — **modify**: premium-clinical form styling.
- `tests/unit/spec-primitives.test.tsx` — **create**: render tests for the primitives.

**Prerequisite (Task 1 blocker):** the owner provides the licensed ITC Avant Garde Gothic web font files (`.woff2`, ideally Book/Demi/Bold + italics). Until then, Task 1 cannot complete; the rest of the plan can be drafted but the type personality depends on it.

---

### Task 1: Self-host ITC Avant Garde + add the monospace utility face

**Files:**
- Create: `public/fonts/itc-avant-garde-*.woff2` (owner-provided)
- Modify: `src/app/fonts.ts`

**Interfaces:**
- Produces: `heading` (CSS var `--font-heading-loaded` = ITC Avant Garde), `mono` (CSS var `--font-mono-loaded`), `accent` (unchanged, Cormorant).

- [ ] **Step 1: Place the font files**

Put the owner-provided files in `public/fonts/`, e.g. `itc-avant-garde-book.woff2`, `itc-avant-garde-demi.woff2`, `itc-avant-garde-bold.woff2`.

- [ ] **Step 2: Replace Montserrat with local ITC Avant Garde + add mono**

`src/app/fonts.ts`:

```ts
import localFont from "next/font/local";
import { IBM_Plex_Mono, Cormorant_Garamond } from "next/font/google";

// Brand heading/body face, self-hosted (licensed). Replaces the Montserrat
// stand-in so the web renders the real ITC Avant Garde geometry.
export const heading = localFont({
  src: [
    { path: "../../public/fonts/itc-avant-garde-book.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/itc-avant-garde-demi.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/itc-avant-garde-bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-heading-loaded",
});

// Utility/data face for spec-tags + figures (hours, dates, ACPE #, USP chapters).
export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono-loaded",
});

export const accent = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-accent-loaded",
});
```

- [ ] **Step 3: Wire the mono variable on `<html>`**

In `src/app/layout.tsx` (or wherever `heading.variable`/`accent.variable` are applied to the root element), add `mono.variable` to the className list. Read the file first; append `${mono.variable}` alongside the existing `${heading.variable} ${accent.variable}`.

- [ ] **Step 4: Verify build + fonts load**

Run: `pnpm build`
Expected: builds clean. Then `pnpm dev`, open `/es`, confirm headings render in ITC Avant Garde (not Montserrat) via DevTools computed `font-family`.

- [ ] **Step 5: Commit**

```bash
git add public/fonts src/app/fonts.ts src/app/layout.tsx
git commit -m "feat(design): self-host ITC Avant Garde heading + add IBM Plex Mono utility face"
```

---

### Task 2: Token refresh + signature utilities (globals.css)

**Files:**
- Modify: `src/app/globals.css`, `src/lib/brand.ts`

**Interfaces:**
- Produces: `--font-mono`, `--radius-card` tokens; `.spec-tag`, `.spec-rail`, `.slogan-lockup`, `.shield-pattern`, `.editorial-card` utilities.

- [ ] **Step 1: Add tokens to the `@theme` block**

In `src/app/globals.css` `@theme`, after `--font-accent`:

```css
  --font-mono: var(--font-mono-loaded), "IBM Plex Mono", ui-monospace, "SF Mono", monospace;
  --radius-card: 13px;
```

- [ ] **Step 2: Add the signature component utilities**

Append a NEW `@layer components` block (do NOT touch the existing glass block):

```css
@layer components {
  /* Monospace standards annotation — the brandsheet "spec-tag". */
  .spec-tag {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    line-height: 1;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-teal);
  }
  /* A horizontal rail of spec-tags separated by middots. */
  .spec-rail {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    align-items: center;
  }
  /* Brand slogan device: chartreuse uppercase + accent italic, on teal. */
  .slogan-lockup {
    font-family: var(--font-heading);
    text-transform: uppercase;
    color: var(--color-chartreuse);
    letter-spacing: -0.01em;
    line-height: 1.05;
  }
  .slogan-lockup em {
    font-family: var(--font-accent);
    font-style: italic;
    text-transform: none;
    font-weight: 600;
  }
  /* Solid editorial card — replaces glass for the landing. */
  .editorial-card {
    background: var(--color-white, #fff);
    border: 1px solid var(--color-gray-300);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-soft);
  }
  /* Subtle tonal SCCA-shield texture (used ONCE, low contrast). The svg is a
     teal-on-teal shield tile in public/patterns/shield-tile.svg. */
  .shield-pattern {
    background-color: var(--color-teal-deep);
    background-image: url("/patterns/shield-tile.svg");
    background-size: 220px;
    background-repeat: repeat;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
  }
}
```

- [ ] **Step 3: Mirror in brand.ts**

In `src/lib/brand.ts`, add `card: "13px"` to `radii` and a `mono` entry to `type` (the IBM Plex Mono stack). No hex changes. This keeps the TS reference in lockstep (per the file's own contract).

- [ ] **Step 4: Create the shield tile asset**

Create `public/patterns/shield-tile.svg` — a single low-contrast SCCA shield glyph (derive from `src/components/brand/LogoShield.tsx`'s path) filled `#228698` at ~12% opacity on transparent, sized for a 220px tile. Keep it subtle.

- [ ] **Step 5: Verify**

Run: `pnpm lint && pnpm build`
Expected: clean (no-hex-literal passes — utilities use `var(--color-*)`). `pnpm dev`, add a throwaway `<span className="spec-tag">USP ⟨795⟩</span>` to a page, confirm it renders mono/uppercase/teal; remove the throwaway.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/lib/brand.ts public/patterns/shield-tile.svg
git commit -m "feat(design): radius-card + mono tokens, spec-tag/slogan-lockup/editorial-card/shield-pattern utilities"
```

---

### Task 3: Shared signature primitives (components + render tests)

**Files:**
- Create: `src/components/ui/SpecTag.tsx`, `SpecRail.tsx`, `SloganLockup.tsx`
- Modify: `src/components/ui/Card.tsx` (editorial variant)
- Test: `tests/unit/spec-primitives.test.tsx`

**Interfaces:**
- Produces: `<SpecTag>{children}</SpecTag>`, `<SpecRail items={string[]} />`, `<SloganLockup roman={string} italic={string} />`, `<Card variant="editorial">`.

- [ ] **Step 1: Write the failing render test**

`tests/unit/spec-primitives.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SpecTag } from "@/components/ui/SpecTag";
import { SpecRail } from "@/components/ui/SpecRail";
import { SloganLockup } from "@/components/ui/SloganLockup";

describe("signature primitives", () => {
  it("SpecTag renders its label with the spec-tag class", () => {
    render(<SpecTag>USP ⟨795⟩</SpecTag>);
    const el = screen.getByText("USP ⟨795⟩");
    expect(el).toHaveClass("spec-tag");
  });
  it("SpecRail renders each item", () => {
    render(<SpecRail items={["18 h", "ACPE 0151"]} />);
    expect(screen.getByText("18 h")).toBeInTheDocument();
    expect(screen.getByText("ACPE 0151")).toBeInTheDocument();
  });
  it("SloganLockup renders roman + italic parts", () => {
    render(<SloganLockup roman="Educamos para formar" italic="bienestar y salud." />);
    expect(screen.getByText("Educamos para formar")).toBeInTheDocument();
    expect(screen.getByText("bienestar y salud.").tagName.toLowerCase()).toBe("em");
  });
});
```

- [ ] **Step 2: Run it (RED)**

Run: `pnpm vitest run tests/unit/spec-primitives.test.tsx`
Expected: FAIL — modules not found. (Confirm `@testing-library/react` is installed; if not, the repo's component tests like `cert-render`/portal use a render harness — match it. If missing, `pnpm add -D @testing-library/react @testing-library/jest-dom` and import `@testing-library/jest-dom` in `vitest.setup.ts`.)

- [ ] **Step 3: Implement the primitives**

`src/components/ui/SpecTag.tsx`:
```tsx
export function SpecTag({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`spec-tag ${className}`}>{children}</span>;
}
```
`src/components/ui/SpecRail.tsx`:
```tsx
import { SpecTag } from "./SpecTag";
export function SpecRail({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <div className={`spec-rail ${className}`} role="list">
      {items.map((it) => (
        <SpecTag key={it}>{it}</SpecTag>
      ))}
    </div>
  );
}
```
`src/components/ui/SloganLockup.tsx`:
```tsx
export function SloganLockup({ roman, italic, className = "" }: { roman: string; italic: string; className?: string }) {
  return (
    <p className={`slogan-lockup ${className}`}>
      {roman} <em>{italic}</em>
    </p>
  );
}
```
In `src/components/ui/Card.tsx`, add an `editorial` variant that applies the `.editorial-card` class + `p-6 sm:p-8` (read the file; follow its existing variant pattern).

- [ ] **Step 4: Run it (GREEN)**

Run: `pnpm vitest run tests/unit/spec-primitives.test.tsx`
Expected: PASS (3/3).

- [ ] **Step 5: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/ui/SpecTag.tsx src/components/ui/SpecRail.tsx src/components/ui/SloganLockup.tsx src/components/ui/Card.tsx tests/unit/spec-primitives.test.tsx
git commit -m "feat(design): SpecTag/SpecRail/SloganLockup primitives + editorial Card variant"
```

---

## Section tasks (4–10): the design-iterative loop

Each section task follows the SAME loop (not repeated per task — read it once here):

1. **Read** the spec section + the current component. Identify its content/props (don't change the data, only the presentation).
2. **Design + build** the restyle using ONLY the tokens + primitives from Tasks 1–3. Honor the section's acceptance bullets below.
3. **Screenshot** at desktop (1280) and mobile (390): run `pnpm dev`, then capture with Playwright — e.g. `npx playwright screenshot --viewport-size=1280,2400 http://localhost:3000/es shot-desktop.png` and `--viewport-size=390,2400` for mobile (or use the project's browser tooling). Save to a scratch dir, do not commit screenshots.
4. **Self-critique** against the spec + the no-AI-slop checklist: is there exactly ONE chartreuse accent in view? Is depth a hairline/subtle shadow (no blur)? Are radii 12–14px? Does it avoid the generic 3-card-grid / centered-gradient-blob? Did the spec-rail annotate real facts? Fix what fails. A second screenshot after fixes.
5. **Verify**: `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm build`; if `messages/*` changed, `pnpm check:i18n`. Existing tests must stay green.
6. **Commit** the section.

> The plan does not pre-write final JSX for sections — designing the pixels IS the work, done in the loop above. The acceptance bullets are the contract a reviewer checks.

### Task 4: Hero (the thesis)
**File:** `src/components/marketing/Hero.tsx`
Acceptance: deep-teal ground; left `SpecRail` (`USP ⟨795⟩ · ⟨800⟩`, `ACPE 0151`, `18 h`, `presencial · Bayamón`); ITC Avant Garde XL headline (tracking −0.03em) with ONE chartreuse "measure" mark; real pharmacist photo on solid teal (right/asymmetric), one chartreuse CTA + one quiet text link; NOT a centered gradient blob + two buttons. **Build 2 hero variants, screenshot both, pick one, delete the other** (per frontend-design). One orchestrated load-in (spec-rail → headline → measure), reduced-motion respected.

### Task 5: Header + Footer
**Files:** `src/components/layout/Header.tsx`, `Footer.tsx`
Acceptance: Header = solid off-white, bottom hairline, logo + 3–4 links + one chartreuse CTA; subtle solidify on scroll (no blur). Footer = teal-deep ground, wordmark, the `SloganLockup` (`Educamos para formar` / *bienestar y salud.*), contact/legal as `SpecTag`s. `focus-visible` rings on all links.

### Task 6: "El curso" formulary entry (replaces the 3-card grid)
**File:** `src/components/marketing/CursosGrid.tsx`
Acceptance: render the single integrated course as ONE editorial entry — eyebrow `SpecRail`, Avant Garde XL title + chartreuse measure, the 3 days as a **numbered 01/02/03 sequence**, the two tiers (Profesional $2,350 / Estudiante $495 + "matrícula requerida") as a hairline-separated **comparison**, one chartreuse CTA. No grid of identical cards. Keep the existing cohort data/props.

### Task 7: Content sections A
**Files:** `Aprenderas.tsx`, `Especialidades.tsx`, `ParaQuienEs.tsx`, `Confianza.tsx`
Acceptance: each picks a ground from the alternation set (off-white / sand / teal-deep), carries at most one chartreuse accent, uses `editorial-card`/hairlines (no glass), generous whitespace, `SpecTag`s where real facts exist. No identical-card grids — vary rhythm.

### Task 8: Content sections B
**Files:** `Galeria.tsx`, `InstagramFeatured.tsx`, `Resenas.tsx`, `Ubicacion.tsx`
Acceptance: Galeria/InstagramFeatured = real pharmacist photography with chartreuse callouts on solid teal/sky (brandsheet billboard treatment), no glass frames. Resenas = editorial testimonial layout (not uniform cards). Ubicacion = clean map/address block with `SpecTag` for hours/location.

### Task 9: Instructor + FAQ + CtaFinal
**Files:** `Instructor.tsx`, `FaqClean.tsx`, `CtaFinal.tsx`
Acceptance: Instructor = clean bio + ONE Cormorant-italic pull-quote (the single serif breath). FaqClean = editorial accordion, generous spacing, hairline dividers, clear focus/expanded states. CtaFinal = teal-deep ground textured with `shield-pattern`, the `SloganLockup`, one chartreuse CTA — the brand's signature moment.

### Task 10: Forms (premium-clinical)
**Files:** `src/components/marketing/inscripcion/InscripcionForm.tsx`, `src/components/marketing/ContactForm.tsx`
Acceptance: Avant Garde labels, inputs with hairline + 12–14px radius + crisp chartreuse `focus-visible` ring, a `SpecTag` for tier/price, generous spacing. **Do NOT change form logic** (the matrícula upload block, the `{pending}`/`{url}` handling, validation) — presentation only. i18n untouched.

---

### Task 11: Coherence pass + accessibility audit + full verification

**Files:** any landing component needing reconciliation.

- [ ] **Step 1: Whole-page screenshot review**

`pnpm dev`; screenshot the full `/es` and `/en` home pages at desktop + mobile. Review for coherence: consistent radii (12–14px), the chartreuse-once rule per viewport, consistent spec-rail treatment, alternating grounds reading as rhythm (not random), the ONE serif moment, the ONE shield-pattern moment. Fix drift.

- [ ] **Step 2: Accessibility audit**

- Keyboard-tab the full page: every interactive has a visible chartreuse `focus-visible` ring.
- Toggle OS reduced-motion: confirm animations are suppressed.
- Contrast-check (DevTools or a contrast tool): teal-deep + off-white, teal-deep text on chartreuse CTAs, gray-700 captions — all ≥ AA. Fix any below.
- Confirm no `backdrop-filter`/blur leaked into the landing: `grep -rn "backdrop\|glass-" src/components/marketing src/components/layout` returns nothing.

- [ ] **Step 3: Full verification**

Run: `pnpm typecheck && pnpm lint && pnpm vitest run && pnpm check:i18n && pnpm build`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "polish(design): landing coherence pass + a11y audit (focus-visible, reduced-motion, AA)"
```

---

## Self-Review

**Spec coverage:** concept/signature → Tasks 2–4,6,9 (spec-tags, slogan-lockup, shield-pattern, mortar via Hero/CTA); tokens (color roles, type roles, scale, radii, depth, motion) → Tasks 1–2; Khmer MN→Cormorant accent → Tasks 1,9; component language (cards, Cursos formulary, nav, bands, forms, footer) → Tasks 3,5,6,10,5; section-by-section landing → Tasks 4–9; a11y floor → Task 11; "no glass removal in Phase 1 / portal untouched" → Global Constraints + the grep in Task 11; self-host ITC Avant Garde (decision) → Task 1.

**Placeholder scan:** foundation Tasks 1–3 carry full code; section Tasks 4–10 intentionally carry acceptance bullets + the shared design loop instead of pre-written pixels (designing the final markup IS the deliverable for a visual refresh — pre-writing it would be fabrication). The loop + bullets are the complete contract a reviewer gates on.

**Type consistency:** `SpecTag`/`SpecRail`/`SloganLockup` signatures defined in Task 3 are consumed verbatim in Tasks 4–9; token names (`--font-mono`, `--radius-card`, `.spec-tag`, `.slogan-lockup`, `.editorial-card`, `.shield-pattern`) defined in Task 2 are used consistently downstream.

**Open dependency:** Task 1 needs the owner's licensed ITC Avant Garde files before it can complete.
