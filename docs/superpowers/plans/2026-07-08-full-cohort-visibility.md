# Full-Cohort Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/cursos` card whose next cohort is full says "· llena" and swaps its CTA to "Lista de espera" (landing waitlist anchor); the admin cohort list marks force-oversold cohorts with "· sobrecupo" in red.

**Architecture:** `CohortBrief` gains `full: boolean` computed server-side in `cursos/page.tsx` from `enrollmentCountByCohort()` (try/catch → nothing marked full on failure, mirroring the landing's degrade); `nextCohortLabel` returns `{label, full}`; the card renders the flag as word-in-color and conditionally swaps the CTA link. The admin indicator is one conditional span.

**Tech Stack:** Next.js App Router (RSC + client component), next-intl, Vitest + @testing-library/react.

## Global Constraints

- Word-in-color status, NO badges/pills (house UI rule): "llena" and "sobrecupo" are plain `<span className="text-red-700 font-semibold">` words.
- i18n mirrored: `cursosGrid.cohortFull` ("llena"/"full") and `cursosGrid.waitlistCta` ("Lista de espera"/"Join the waitlist") in BOTH `src/messages/es.json` and `src/messages/en.json`.
- Enrollment form dropdown, landing band, gates, checkout, webhook: UNTOUCHED. No migration.
- Count-failure degrade: if `enrollmentCountByCohort()` throws in `cursos/page.tsx`, `full` is false everywhere (page still renders).
- Admin portal copy is hard-coded Spanish ("sobrecupo").
- Branch `feat/full-cohort-visibility` (created; design committed). `pnpm vitest run <path>`; full suite; `pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm build`.

---

### Task 1: Full-cohort card + admin oversell indicator

**Files:**
- Modify: `src/components/marketing/CursosGrid.tsx` (`CohortBrief`, `nextCohortLabel` return shape, footer "llena", CTA swap)
- Modify: `src/app/[locale]/(marketing)/cursos/page.tsx` (counts + `full` mapping)
- Modify: `src/app/[locale]/(portal)/portal/admin/cohortes/page.tsx` (~line 219, sobrecupo span)
- Modify: `src/messages/es.json`, `src/messages/en.json` (2 keys under `cursosGrid`)
- Test: `tests/components/CursosGridNextCohort.test.tsx` (extend) + fixture updates in `tests/components/CursosGrid.test.tsx`

**Interfaces:**
- Consumes: `enrollmentCountByCohort` from `@/lib/cohorts` (existing).
- Produces: `CohortBrief` gains `full: boolean`; `nextCohortLabel(courseId, audience): { label: string; full: boolean } | null`.

- [ ] **Step 1: Add the i18n keys (both locales)**

In `src/messages/es.json`, under `cursosGrid` (alongside `nextCohortLabel`/`cohortAudience`):

```json
"cohortFull": "llena",
"waitlistCta": "Lista de espera",
```

Mirror in `src/messages/en.json`:

```json
"cohortFull": "full",
"waitlistCta": "Join the waitlist",
```

- [ ] **Step 2: Write the failing tests**

In `tests/components/CursosGridNextCohort.test.tsx`, first update the existing fixture cohorts to the new `CohortBrief` shape by adding `full: false` to each. Then add this test to the existing `describe` (match the file's existing `card()` helper and render pattern):

```tsx
  it("full next cohort: shows 'llena' and swaps the CTA to the waitlist", () => {
    render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <CursosGrid
          openCohorts={[
            { courseId: "basic-compounding", startDate: "2026-08-12", audience: "farmaceutico_tecnico" as const, full: true },
            { courseId: "basic-compounding", startDate: "2026-08-19", audience: "estudiante" as const, full: false },
          ]}
        />
      </NextIntlClientProvider>,
    );

    const farm = card("Compounding No Estéril Básico — Farmacéuticos y Técnicos");
    expect(farm.textContent).toContain("llena");
    expect(within(farm).getByRole("link", { name: /lista de espera/i })).toBeTruthy();
    // The regular enroll CTA is gone from THIS card…
    expect(within(farm).queryByText("Inscríbete")).toBeNull();

    // …while the non-full student card keeps the normal CTA and no "llena".
    const student = card("Track de Estudiantes — Compounding No Estéril");
    expect(student.textContent).not.toContain("llena");
    expect(within(student).queryByRole("link", { name: /lista de espera/i })).toBeNull();
  });
```

Notes for exactness: the enroll CTA text comes from `t("courseCta")` — read its value in `es.json` (`cursosGrid.courseCta`) and use THAT string in the `queryByText` assertion instead of "Inscríbete" if it differs. Card titles must match the existing tests' titles verbatim (copy them from the file).

Also update `tests/components/CursosGrid.test.tsx`'s cohort fixture literal by adding `full: false` (tsc will point at it).

- [ ] **Step 3: Run tests to verify the new one fails**

Run: `pnpm vitest run tests/components/CursosGridNextCohort.test.tsx`
Expected: FAIL — `full` not in `CohortBrief` (type error) and/or "llena"/waitlist assertions fail.

- [ ] **Step 4: Implement in `CursosGrid.tsx`**

4a. Extend `CohortBrief` (line ~10):

```ts
export type CohortBrief = {
  courseId: string;
  /** ISO date (yyyy-mm-dd) of the cohort's first day. */
  startDate: string;
  audience: CohortAudience;
  /** Paid enrollees ≥ capacity — the card flags it and offers the waitlist. */
  full: boolean;
};
```

4b. Change `nextCohortLabel` (line ~68) to return the flag too:

```ts
  function nextCohortLabel(
    courseId: string,
    audience: CohortAudience,
  ): { label: string; full: boolean } | null {
    // `openCohorts` arrives ordered earliest-first, so the first match is the
    // upcoming cohort for this course + audience.
    const cohort = openCohorts.find(
      (c) => c.courseId === courseId && c.audience === audience,
    );
    if (!cohort) return null;
    const label = new Intl.DateTimeFormat(locale === "es" ? "es-PR" : "en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(cohort.startDate));
    return { label, full: cohort.full };
  }
```

4c. The call site (line ~110) currently assigns `const cohortMonth = nextCohortLabel(...)`. Rename to reflect the new shape:

```ts
            const nextCohort = nextCohortLabel(
              course.enrollCourseId ?? course.courseRef ?? course.id,
              course.audience,
            );
```

4d. Footer line (lines ~236-247): replace `cohortMonth` with `nextCohort` and append the full flag inside the existing `<p>`:

```tsx
                          {nextCohort && (
                            <p className="text-gray-700 font-heading mt-1 text-xs font-medium tracking-wide uppercase">
                              {t("nextCohortLabel")}{" "}
                              <span className="text-gray-900 font-semibold capitalize">
                                {nextCohort.label}
                              </span>
                              {" · "}
                              {t("cohortAudience", {
                                label: AUDIENCE_LABELS[course.audience][locale === "es" ? "es" : "en"],
                              })}
                              {nextCohort.full && (
                                <>
                                  {" · "}
                                  <span className="text-red-700 font-semibold">
                                    {t("cohortFull")}
                                  </span>
                                </>
                              )}
                            </p>
                          )}
```

4e. CTA (lines ~249-265): wrap in the full/not-full conditional, keeping the exact classes:

```tsx
                        {nextCohort?.full ? (
                          <Link
                            href={{ pathname: "/", hash: "cohort" }}
                            className="font-heading text-teal-deep group-hover:text-teal inline-flex shrink-0 items-center gap-1 text-sm font-semibold transition-colors"
                            aria-label={`${t("waitlistCta")}: ${course.title}`}
                          >
                            <span>{t("waitlistCta")}</span>
                            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                              →
                            </span>
                          </Link>
                        ) : (
                          <Link
                            href={{
                              pathname: "/inscripcion",
                              query: {
                                course: course.enrollCourseId ?? course.id,
                                ...(course.enrollTier ? { tier: course.enrollTier } : {}),
                                ...(course.enrollProf ? { prof: course.enrollProf } : {}),
                              },
                            }}
                            className="font-heading text-teal-deep group-hover:text-teal inline-flex shrink-0 items-center gap-1 text-sm font-semibold transition-colors"
                            aria-label={`${t("courseLinkAria")}: ${course.title}`}
                          >
                            <span>{t("courseCta")}</span>
                            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                              →
                            </span>
                          </Link>
                        )}
```

If the i18n `Link` type rejects `{ pathname: "/", hash: "cohort" }`, use `href="/#cohort"` on the same `Link` (next-intl accepts string hrefs and prefixes the locale); note which form was needed in your report.

- [ ] **Step 5: Map `full` in `cursos/page.tsx`**

The page currently maps `openCohorts` → `CohortBrief[]` (lines ~26-31). Replace with:

```ts
  const openCohorts = await listOpenCohortsSafe();
  // Paid seat counts — degrade like the landing: a failed count query marks
  // nothing full rather than crashing the page.
  let counts = new Map<string, number>();
  try {
    counts = await enrollmentCountByCohort();
  } catch {
    counts = new Map();
  }
  const cohortsForGrid: CohortBrief[] = openCohorts.map((c) => ({
    courseId: c.courseId,
    startDate: c.startDate.toISOString().slice(0, 10),
    audience: c.audience,
    full: (counts.get(c.id) ?? 0) >= c.capacity,
  }));
```

Add `enrollmentCountByCohort` to the existing `@/lib/cohorts` import.

- [ ] **Step 6: Admin oversell indicator**

In `src/app/[locale]/(portal)/portal/admin/cohortes/page.tsx` (~line 219), the status line reads:

```tsx
                    {enrolled} / {c.capacity} inscrito{enrolled === 1 ? "" : "s"} ·{" "}
```

Append, immediately after the `inscrito{…}` fragment (before the following `·`):

```tsx
                    {enrolled} / {c.capacity} inscrito{enrolled === 1 ? "" : "s"}
                    {enrolled > c.capacity && (
                      <span className="text-red-700 font-semibold"> · sobrecupo</span>
                    )}{" "}
                    ·{" "}
```

(Match the actual JSX structure in the file — the intent: the red " · sobrecupo" word appears right after the count when `enrolled > c.capacity`.)

- [ ] **Step 7: Run the component tests**

Run: `pnpm vitest run tests/components/CursosGridNextCohort.test.tsx tests/components/CursosGrid.test.tsx`
Expected: PASS (including the new full-cohort test).

- [ ] **Step 8: Full suite + typecheck + lint + build**

Run: `pnpm vitest run`
Then: `pnpm exec tsc --noEmit`
Then: `pnpm lint`
Then: `pnpm build`
Expected: all green/clean; build exit 0 with the route table, no page-collection errors.

- [ ] **Step 9: Commit + push**

```bash
git add src/components/marketing/CursosGrid.tsx "src/app/[locale]/(marketing)/cursos/page.tsx" "src/app/[locale]/(portal)/portal/admin/cohortes/page.tsx" src/messages/es.json src/messages/en.json tests/
git commit -m "feat(cursos): flag full cohorts + waitlist CTA; admin oversell indicator"
```

```bash
git push -u origin feat/full-cohort-visibility
```

---

## Notes for the implementer

- `tsc` is the safety net for the `CohortBrief` shape change: its only constructors are `cursos/page.tsx` and the two component test files — all updated here.
- Do NOT touch the enrollment form, the landing band, or any gate/checkout/webhook code.
- The admin cohortes page already computes `enrolled` per cohort (it renders `{enrolled} / {c.capacity}`) — reuse it; do not add a second count query.
- The waitlist anchor `#cohort` is the landing band section id (`CohortWaitlist` renders inside `<section id="cohort">` — verify the id in `(marketing)/page.tsx` and use the actual one if it differs; note it in the report).
