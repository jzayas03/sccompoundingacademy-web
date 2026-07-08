# Per-audience Cohort Meters on the Landing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The landing "#cohort" band shows one block (audience label + next-cohort date + seat meter) per open audience — featured audience first and highlighted — instead of a single cohort.

**Architecture:** A pure `cohortBlocks` helper builds the ordered per-audience block list (earliest open cohort per audience, featured first); the landing page maps it to labeled props; `CohortWaitlist` renders a stack of meter blocks (one shared waitlist form unchanged).

**Tech Stack:** Next.js (App Router, RSC + a client band component), next-intl (es/en), Vitest + @testing-library/react.

## Global Constraints

- One block per open audience: the EARLIEST open cohort of that audience. Featured audience (`pickFeaturedCohort(openCohorts)?.audience`) first + emphasized; the rest by start date.
- `cohortBlocks` is a DB-free leaf (imports only `type CohortAudience` from `@/lib/cohorts/audience`).
- `remaining = max(0, capacity − paid)` where paid = `counts.get(id) ?? 0` (`enrollmentCountByCohort`).
- Band heading: `cohort.headingUpcoming` ("Próximas cohortes" es / "Upcoming cohorts" en), added to BOTH message files. Reuse existing `cohort.eyebrow/description/seatsTotal/remaining/closesNote/form.*`. Per-block audience label from `AUDIENCE_LABELS` (no new i18n).
- One shared waitlist form (unchanged) — its POST `cohort` field becomes `blocks[0]?.cohortLabel ?? ""`.
- No DB migration (reuses deployed `audience`/`featured` columns). Only the landing band changes; `CohortWaitlist` is rendered only by `(marketing)/page.tsx`. `next` (`pickFeaturedCohort`) stays for the page's JSON-LD.
- Branch `feat/landing-audience-meters` (not `main`). `pnpm vitest run <path>`; full `pnpm vitest run`; `pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm build` in Task 3.

---

### Task 1: Pure `cohortBlocks` helper

**Files:**
- Create: `src/lib/cohorts/blocks.ts`
- Test: `tests/unit/cohort-blocks.test.ts`

**Interfaces:**
- Consumes: `type CohortAudience` from `@/lib/cohorts/audience`.
- Produces: `cohortBlocks<T extends { id: string; audience: CohortAudience; startDate: Date; endDate: Date; capacity: number }>(openCohorts: readonly T[], counts: Map<string, number>, featuredAudience: CohortAudience | null): Array<T & { remaining: number; featured: boolean }>`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/cohort-blocks.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { cohortBlocks } from "@/lib/cohorts/blocks";

const c = (id: string, audience: "farmaceutico_tecnico" | "otros_profesionales" | "estudiante", day: number, capacity: number) => ({
  id,
  audience,
  startDate: new Date(`2026-08-${String(day).padStart(2, "0")}T00:00:00Z`),
  endDate: new Date(`2026-08-${String(day + 2).padStart(2, "0")}T00:00:00Z`),
  capacity,
});

describe("cohortBlocks", () => {
  it("takes the earliest open cohort per audience", () => {
    const blocks = cohortBlocks(
      [c("f1", "farmaceutico_tecnico", 12, 12), c("f2", "farmaceutico_tecnico", 26, 12), c("s1", "estudiante", 19, 12)],
      new Map(),
      null,
    );
    expect(blocks.map((b) => b.id)).toEqual(["f1", "s1"]); // f2 dropped (later farm/téc)
  });
  it("puts the featured audience first, then the rest by date", () => {
    const blocks = cohortBlocks(
      [c("f1", "farmaceutico_tecnico", 12, 12), c("s1", "estudiante", 19, 12)],
      new Map(),
      "estudiante",
    );
    expect(blocks.map((b) => b.audience)).toEqual(["estudiante", "farmaceutico_tecnico"]);
    expect(blocks[0]!.featured).toBe(true);
    expect(blocks[1]!.featured).toBe(false);
  });
  it("orders purely by date when no audience is featured", () => {
    const blocks = cohortBlocks(
      [c("f1", "farmaceutico_tecnico", 12, 12), c("s1", "estudiante", 19, 12)],
      new Map(),
      null,
    );
    expect(blocks.map((b) => b.id)).toEqual(["f1", "s1"]);
  });
  it("computes remaining = capacity − paid, clamped at 0", () => {
    const blocks = cohortBlocks([c("f1", "farmaceutico_tecnico", 12, 12)], new Map([["f1", 20]]), null);
    expect(blocks[0]!.remaining).toBe(0);
    const b2 = cohortBlocks([c("f1", "farmaceutico_tecnico", 12, 12)], new Map([["f1", 5]]), null);
    expect(b2[0]!.remaining).toBe(7);
  });
  it("returns [] for no open cohorts", () => {
    expect(cohortBlocks([], new Map(), null)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/cohort-blocks.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/cohorts/blocks.ts`:

```ts
import type { CohortAudience } from "@/lib/cohorts/audience";

/**
 * Ordered per-audience blocks for the landing "#cohort" band: the earliest OPEN
 * cohort of each audience, featured audience first, then by start date.
 * `openCohorts` is already ordered earliest-first (listOpenCohorts orders by
 * startDate). Pure + DB-free.
 */
export function cohortBlocks<
  T extends { id: string; audience: CohortAudience; startDate: Date; endDate: Date; capacity: number },
>(
  openCohorts: readonly T[],
  counts: Map<string, number>,
  featuredAudience: CohortAudience | null,
): Array<T & { remaining: number; featured: boolean }> {
  const seen = new Set<CohortAudience>();
  const earliestPerAudience: T[] = [];
  for (const cohort of openCohorts) {
    if (!seen.has(cohort.audience)) {
      seen.add(cohort.audience);
      earliestPerAudience.push(cohort);
    }
  }
  return earliestPerAudience
    .map((cohort) => ({
      ...cohort,
      remaining: Math.max(0, cohort.capacity - (counts.get(cohort.id) ?? 0)),
      featured: cohort.audience === featuredAudience,
    }))
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.startDate.getTime() - b.startDate.getTime();
    });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/cohort-blocks.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cohorts/blocks.ts tests/unit/cohort-blocks.test.ts
git commit -m "feat(cohorts): cohortBlocks helper (per-audience landing blocks)"
```

---

### Task 2: `CohortWaitlist` per-audience blocks + page wiring

**Files:**
- Modify: `src/components/marketing/CohortWaitlist.tsx` (props → `blocks`; block stack; `CohortMeterBlock`; form `cohort` field)
- Modify: `src/app/[locale]/(marketing)/page.tsx` (build + pass `blocks`)
- Modify: `src/messages/es.json`, `src/messages/en.json` (`cohort.headingUpcoming`)
- Test: `tests/components/CohortWaitlistBlocks.test.tsx` (create)

**Interfaces:**
- Consumes: `cohortBlocks` (Task 1); `AUDIENCE_LABELS`, `CohortAudience` (existing); `formatCohortLabel`, `enrollmentCountByCohort`, `pickFeaturedCohort`, `listOpenCohortsSafe` (existing).
- Produces: `export type CohortBlock = { audience: CohortAudience; cohortLabel: string; total: number; remaining: number; featured: boolean }`; `CohortWaitlist({ blocks }: { blocks: CohortBlock[] })`.

- [ ] **Step 1: Add the i18n heading (both locales)**

In `src/messages/es.json` under the `cohort` object (alongside `headingFallback`):

```json
"headingUpcoming": "Próximas cohortes",
```

In `src/messages/en.json` under `cohort`:

```json
"headingUpcoming": "Upcoming cohorts",
```

- [ ] **Step 2: Write the failing test**

Create `tests/components/CohortWaitlistBlocks.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { CohortWaitlist, type CohortBlock } from "@/components/marketing/CohortWaitlist";

const blocks: CohortBlock[] = [
  { audience: "farmaceutico_tecnico", cohortLabel: "12–14 de agosto de 2026", total: 12, remaining: 5, featured: true },
  { audience: "estudiante", cohortLabel: "19–21 de agosto de 2026", total: 12, remaining: 0, featured: false },
];

function renderBand(bs: CohortBlock[]) {
  return render(
    <NextIntlClientProvider locale="es" messages={esMessages}>
      <CohortWaitlist blocks={bs} />
    </NextIntlClientProvider>,
  );
}

describe("CohortWaitlist per-audience blocks", () => {
  it("renders a labeled block per audience, featured first", () => {
    const { container } = renderBand(blocks);
    expect(screen.getByText("Próximas cohortes")).toBeTruthy();
    expect(container.textContent).toContain("Farmacéuticos y Técnicos");
    expect(container.textContent).toContain("Estudiantes");
    expect(container.textContent).toContain("12–14 de agosto de 2026");
    expect(container.textContent).toContain("19–21 de agosto de 2026");
    // featured (farmaceutico_tecnico) appears before estudiante
    expect(container.textContent!.indexOf("Farmacéuticos")).toBeLessThan(
      container.textContent!.indexOf("Estudiantes"),
    );
    // the waitlist form is still present
    expect(screen.getByText(esMessages.cohort.form.heading)).toBeTruthy();
  });
  it("falls back to the empty heading and renders no meter when there are no blocks", () => {
    const { container } = renderBand([]);
    expect(screen.getByText(esMessages.cohort.headingFallback)).toBeTruthy();
    expect(container.textContent).not.toContain("Próximas cohortes");
    expect(container.textContent).not.toContain("cupos"); // no seat meter labels
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run tests/components/CohortWaitlistBlocks.test.tsx`
Expected: FAIL — `CohortWaitlist` still takes the old single-cohort props / no `blocks`.

- [ ] **Step 4: Rewrite `CohortWaitlist` to take `blocks`**

In `src/components/marketing/CohortWaitlist.tsx`:

Add the exported type near the top (after the imports, before the component):

```ts
export type CohortBlock = {
  audience: CohortAudience;
  cohortLabel: string;
  total: number;
  remaining: number;
  featured: boolean;
};
```

Change the component signature (currently `export function CohortWaitlist({ total, remaining, cohortLabel, audience }: {...})`) to:

```ts
export function CohortWaitlist({ blocks }: { blocks: CohortBlock[] }) {
```

Delete the now-unused `showMeter` / `filled` derivations (the old lines
`const showMeter = ...` and `const filled = ...`) — the meter now lives per block.

Replace the left-column content (the `<h2>…{cohortLabel ?? t("headingFallback")}…</h2>`, the `{audience && (…)}` block, the description, and the `{showMeter && (…)}` meter — the current lines ~82-117) with:

```tsx
            <h2 className="font-heading text-off-white mt-3.5 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              {blocks.length ? t("headingUpcoming") : t("headingFallback")}
            </h2>
            <p className="text-off-white/80 mt-3.5 max-w-md text-[15px] leading-relaxed">
              {t("description")}
            </p>

            {blocks.length > 0 && (
              <div className="mt-8 max-w-md space-y-6">
                {blocks.map((block) => (
                  <CohortMeterBlock key={block.audience} block={block} />
                ))}
                <p className="text-off-white/50 text-[12.5px]">{t("closesNote")}</p>
              </div>
            )}
```

In `onSubmit`, change the POST body's `cohort` field from `cohort: cohortLabel ?? ""` to:

```ts
          cohort: blocks[0]?.cohortLabel ?? "",
```

Add the `CohortMeterBlock` component at the bottom of the file (it uses its own next-intl hooks — same client context):

```tsx
function CohortMeterBlock({ block }: { block: CohortBlock }) {
  const t = useTranslations("cohort");
  const locale = useLocale();
  const filled = Math.max(0, block.total - block.remaining);
  return (
    <div className={block.featured ? "border-chartreuse border-l-2 pl-4" : "border-white/10 border-l-2 pl-4"}>
      <p className="font-heading text-off-white text-sm font-semibold">
        {block.featured && (
          <span aria-hidden className="text-chartreuse">
            ★{" "}
          </span>
        )}
        {AUDIENCE_LABELS[block.audience][locale === "en" ? "en" : "es"]}
        <span className="text-off-white/60"> · {block.cohortLabel}</span>
      </p>
      {block.total > 0 && (
        <div className="mt-2.5">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-off-white/60 font-heading text-[0.72rem] font-semibold tracking-[0.1em] uppercase">
              {t("seatsTotal", { total: block.total })}
            </span>
            <span className="text-chartreuse font-heading text-sm font-bold">
              {t("remaining", { remaining: block.remaining })}
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: block.total }).map((_, k) => (
              <div
                key={k}
                className="h-2 flex-1 rounded-full"
                style={{ background: k < filled ? "var(--color-chartreuse)" : "rgba(255,255,255,0.14)" }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

Leave the right-column waitlist form (heading, name/email/role inputs, submit, success/error states) unchanged.

- [ ] **Step 5: Wire the landing page**

In `src/app/[locale]/(marketing)/page.tsx`:

Add imports:

```ts
import { cohortBlocks } from "@/lib/cohorts/blocks";
import { type CohortBlock } from "@/components/marketing/CohortWaitlist";
```

Keep `const next = pickFeaturedCohort(openCohorts);` (still used by the JSON-LD block). REPLACE the old single-cohort seat prep (`let seatTotal ...`, `let seatRemaining ...`, `let cohortLabel ...` and the `if (next) { ... }` block that computed them) with:

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

Change the `<CohortWaitlist ... />` usage to:

```tsx
      <CohortWaitlist blocks={cohortBlockProps} />
```

Do NOT change the `jsonLd = homepageJsonLd(..., next ? {...} : null)` block — it keeps using `next`.

- [ ] **Step 6: Remove the superseded single-cohort test**

`tests/components/CohortWaitlistAudience.test.tsx` (from the featured feature) renders `<CohortWaitlist … audience={…} />` — the `audience` prop no longer exists, so it breaks tsc/runtime. It is fully superseded by `CohortWaitlistBlocks.test.tsx` (the audience label is now per-block). Delete it:

```bash
git rm tests/components/CohortWaitlistAudience.test.tsx
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm vitest run tests/components/CohortWaitlistBlocks.test.tsx && pnpm exec tsc --noEmit && pnpm lint`
Expected: PASS/clean (no reference to the deleted test remains).

- [ ] **Step 8: Commit**

```bash
git add src/components/marketing/CohortWaitlist.tsx "src/app/[locale]/(marketing)/page.tsx" src/messages/es.json src/messages/en.json tests/components/CohortWaitlistBlocks.test.tsx
git commit -m "feat(landing): per-audience cohort meters (featured first)"
```

---

### Task 3: Full verification

**Files:** none (verification).

- [ ] **Step 1: Full suite + typecheck + lint**

Run: `pnpm vitest run`
Then: `pnpm exec tsc --noEmit`
Then: `pnpm lint`
Expected: all green/clean (the superseded `CohortWaitlistAudience.test.tsx` was removed in Task 2 Step 6).

- [ ] **Step 2: Production build**

Run: `pnpm build`
Expected: build completes (exit 0, route table printed); no `invalid-use-server` / page-collection error. A later `NeonDbError` from `listOpenCohortsSafe`'s fallback is fine locally.

- [ ] **Step 3: Manual QA on the Vercel preview**

Landing `/es` `#cohort` band — one block per open audience (label + date + seat meter); the featured cohort's audience first with the ★ marker; the shared waitlist form on the right. Unmark the featured cohort in the admin → ordering falls back to date.

- [ ] **Step 4: Push the branch**

```bash
git push -u origin feat/landing-audience-meters
```

---

## Notes for the implementer

- `cohortBlocks` stays DB-free (only a type import). It's generic over the fields it needs so it can take real `Cohort` rows without importing the DB.
- `CohortMeterBlock` calls `useTranslations`/`useLocale` itself (same client context) to avoid prop-drilling `t`/`locale`.
- The featured cohort still drives the JSON-LD `next`; the band's ordering uses `next?.audience` as the featured audience — do not remove `next`.
