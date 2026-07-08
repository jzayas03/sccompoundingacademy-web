# Per-audience cohort meters on the landing

**Date:** 2026-07-07
**Status:** Approved design — pending implementation plan

## Goal

The landing "#cohort" band shows a block **per open audience** (Farmacéuticos y
Técnicos / Otros Profesionales / Estudiantes) — each with the audience label, the
next open cohort's date, and a seat meter — instead of a single cohort. The
featured cohort's audience block goes **first and highlighted**. One shared
waitlist form on the right (unchanged).

Today `(marketing)/page.tsx` computes `next = pickFeaturedCohort(openCohorts)` and
passes `{total, remaining, cohortLabel, audience}` (one cohort) to
`<CohortWaitlist>`, which renders one heading + one meter + the form.

## Owner decisions

- One block per open audience (label + date + seat meter); featured audience
  first + emphasized; the rest by date. One shared waitlist form.
- Band heading becomes generic "Próximas cohortes" / "Upcoming cohorts".

## 1. Data — pure block builder

New DB-free module `src/lib/cohorts/blocks.ts`:

```ts
import type { CohortAudience } from "@/lib/cohorts/audience";

/** Ordered per-audience blocks for the landing band: the earliest OPEN cohort
 *  of each audience, featured audience first, then by start date. `openCohorts`
 *  is already ordered earliest-first (listOpenCohorts). Pure + DB-free. */
export function cohortBlocks<
  T extends { id: string; audience: CohortAudience; startDate: Date; endDate: Date; capacity: number },
>(
  openCohorts: readonly T[],
  counts: Map<string, number>,
  featuredAudience: CohortAudience | null,
): Array<T & { remaining: number; featured: boolean }> {
  const seen = new Set<CohortAudience>();
  const earliestPerAudience: T[] = [];
  for (const c of openCohorts) {
    if (!seen.has(c.audience)) {
      seen.add(c.audience);
      earliestPerAudience.push(c);
    }
  }
  return earliestPerAudience
    .map((c) => ({
      ...c,
      remaining: Math.max(0, c.capacity - (counts.get(c.id) ?? 0)),
      featured: c.audience === featuredAudience,
    }))
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.startDate.getTime() - b.startDate.getTime();
    });
}
```

## 2. Landing page wiring

`src/app/[locale]/(marketing)/page.tsx`:

- Keep `const next = pickFeaturedCohort(openCohorts)` — the JSON-LD Course schema
  still uses `next`'s start/end dates (unchanged).
- Build the band's blocks:

```ts
  let cohortBlockProps: CohortBlock[] = [];
  try {
    const counts = await enrollmentCountByCohort();
    cohortBlockProps = cohortBlocks(openCohorts, counts, next?.audience ?? null).map((b) => ({
      audience: b.audience,
      cohortLabel: formatCohortLabel(b, locale as "es" | "en"),
      total: b.capacity,
      remaining: b.remaining,
      featured: b.featured,
    }));
  } catch {
    cohortBlockProps = [];
  }
```

- Pass `<CohortWaitlist blocks={cohortBlockProps} />`. Remove the old
  `seatTotal`/`seatRemaining`/`cohortLabel` prep that fed the single-cohort props
  (the JSON-LD `next` block stays).

`CohortBlock` (exported from `CohortWaitlist.tsx`):

```ts
export type CohortBlock = {
  audience: CohortAudience;
  cohortLabel: string;
  total: number;
  remaining: number;
  featured: boolean;
};
```

## 3. Component — `CohortWaitlist`

`src/components/marketing/CohortWaitlist.tsx`:

- Props change from `{total, remaining, cohortLabel, audience}` to `{blocks: CohortBlock[]}`.
- Left column: an eyebrow (unchanged) + heading `blocks.length ? t("headingUpcoming") : t("headingFallback")` + the description (unchanged) + a **stack of blocks**. Each block renders: the audience label (`AUDIENCE_LABELS[block.audience][locale === "en" ? "en" : "es"]`), the `cohortLabel` (date), and a seat meter (the existing `total`-bars markup, `filled = total - remaining`, with `seatsTotal`/`remaining` labels). The `featured` block gets an emphasis (a chartreuse left-border / star marker) and is already first (the builder ordered it).
- Extract the per-block meter into a small local component (e.g. `CohortMeterBlock`) so the map body stays readable.
- Right column: the shared waitlist form, unchanged, except its POST `cohort` field becomes `blocks[0]?.cohortLabel ?? ""`.
- When `blocks` is empty: the generic heading falls back to `t("headingFallback")` and no blocks render (matches today's no-cohort state).

## 4. i18n

Add `cohort.headingUpcoming` to both `messages/es.json` ("Próximas cohortes") and
`messages/en.json` ("Upcoming cohorts"). Reuse the existing `cohort.eyebrow`,
`cohort.description`, `cohort.seatsTotal`, `cohort.remaining`, `cohort.closesNote`,
and `cohort.form.*`. The per-block audience label comes from `AUDIENCE_LABELS`
(no new i18n).

## Testing

- **Unit — `cohortBlocks`:** earliest-per-audience selection; featured audience
  first, then by date; `remaining = capacity − paid` (clamped ≥ 0); a
  non-featured/no-featured list orders purely by date; empty → `[]`.
- **Component — `CohortWaitlist`:** with two blocks (a featured
  `farmaceutico_tecnico` and an `estudiante`), both audience labels + both meters
  render, the featured block appears first / carries its emphasis marker, and the
  waitlist form still renders; with `blocks={[]}` the fallback heading shows and
  no meter renders.
- `tsc` + `lint` + full suite green; **`pnpm build`** once (App Router change).

## Risks / gates

- **No DB migration** — reuses the deployed `audience`/`featured` columns. Normal
  deploy, no runtime gate.
- Only the landing band changes; `CohortWaitlist` is rendered only by
  `(marketing)/page.tsx`. `pickFeaturedCohort` is reused (featured audience →
  first block). No change to enrollment, pricing, Stripe, CE, or `/cursos`.
- Seat-count query stays best-effort (`try/catch` → `[]`), so a count failure
  hides the band rather than crashing (unchanged contract).

## Files touched

- `src/lib/cohorts/blocks.ts` (new, pure `cohortBlocks`).
- `src/components/marketing/CohortWaitlist.tsx` (`CohortBlock` type; props → `blocks`; per-block meter; featured emphasis; shared form).
- `src/app/[locale]/(marketing)/page.tsx` (build + pass `blocks`; keep `next` for JSON-LD).
- `src/messages/es.json`, `src/messages/en.json` (`cohort.headingUpcoming`).
- Tests under `tests/`.
