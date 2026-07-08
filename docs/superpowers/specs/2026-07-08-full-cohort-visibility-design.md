# Full-cohort visibility: /cursos card + admin oversell indicator

**Date:** 2026-07-08
**Status:** Approved design — pending implementation plan

## Goal

Close the last two product-level items from the enrollment audit:

- **/cursos** shows a full-but-open cohort identically to one with seats, with
  an active "Inscríbete" CTA that dead-ends at a pay-time 409. The card should
  say the cohort is full and route demand to the waitlist instead.
- **Admin** can only detect a force-oversold cohort by mentally comparing the
  raw `N / M` counts in the cohort list. Oversell should be called out.

## Owner decisions

- Full-cohort card: date line keeps rendering, appended with **"· llena"**
  (word-in-color, no badge — house UI rule), and the card's CTA switches from
  "Inscríbete" to **"Lista de espera"** linking to the landing waitlist form
  (`/#cohort`).
- **The enrollment form's cohort dropdown is UNCHANGED** — pending requests
  don't consume seats (first to pay wins), and the pay-time capacity guard
  already prevents oversell. Hiding full cohorts would cost valid requests.

## Design

### A. `/cursos` full-cohort treatment

**Data.** `CohortBrief` (in `CursosGrid.tsx`) gains `full: boolean`. The
`/cursos` page computes paid counts and maps it:

```ts
// cursos/page.tsx — mirror the landing's degrade contract: a failed count
// query marks nothing full rather than crashing the page.
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

**Component.** `nextCohortLabel(courseId, audience)` currently returns
`string | null` (the formatted month). Change it to return
`{ label: string; full: boolean } | null` (the matched cohort's `full` rides
along). In the card:

- The next-cohort line appends, when full:
  `{" · "}<span className="text-red-700 font-semibold">{t("cohortFull")}</span>`
  (word-in-color, matching the repo's status-as-word convention).
- The CTA block: when the card's next cohort exists AND is full, render the
  waitlist link instead of the enroll link — same visual classes as the enroll
  CTA, `aria-label` adjusted:

```tsx
<Link
  href={{ pathname: "/", hash: "cohort" }}
  aria-label={`${t("waitlistCta")}: ${course.title}`}
  className={/* same classes as the enroll CTA */}
>
  {t("waitlistCta")}
</Link>
```

(`/#cohort` is the landing band with the shared waitlist form; the i18n `Link`
handles the locale prefix. If the i18n router rejects the `hash` object form,
fall back to a plain locale-prefixed `<a href={`/${locale}/#cohort`}>` — note
which was needed.)

- When the next cohort is not full (or there is none), the card is unchanged.

**i18n.** Under `cursosGrid` in BOTH `messages/es.json` and
`messages/en.json`:
- `"cohortFull": "llena"` / `"cohortFull": "full"`
- `"waitlistCta": "Lista de espera"` / `"waitlistCta": "Join the waitlist"`

### B. Admin oversell indicator

`src/app/[locale]/(portal)/portal/admin/cohortes/page.tsx` (~line 219)
currently renders `{enrolled} / {c.capacity} inscrito{…}`. When
`enrolled > c.capacity` (only reachable via the change-cohort "forzar"
override), append word-in-color:

```tsx
{enrolled > c.capacity && (
  <span className="text-red-700 font-semibold"> · sobrecupo</span>
)}
```

(Hard-coded Spanish — the portal admin is ES-only by convention.)

## Explicitly NOT touched

- Enrollment form dropdown (owner decision).
- Landing band/meters, enrollment gates, checkout, webhook.
- No migration.

## Testing

- **Component — `CursosGrid`** (extend the existing suites' fixture pattern):
  with a full farm cohort and a non-full student cohort for
  `basic-compounding`: the Farmacéuticos card shows the month + "llena" and
  its CTA is the waitlist link (enroll link absent IN THAT CARD); the
  Estudiantes card shows no "llena" and keeps the normal enroll CTA. With
  `full: false` everywhere → no "llena" anywhere.
- **i18n integrity:** `cursosGrid.cohortFull` + `cursosGrid.waitlistCta`
  present in both locales.
- Admin page: RSC without a component harness — covered by `tsc` + build +
  owner's eyes.
- `tsc` + `lint` + full suite green; **`pnpm build`** (App Router change).

## Files touched

- `src/components/marketing/CursosGrid.tsx` (`CohortBrief.full`,
  `nextCohortLabel` return shape, "llena" span, CTA swap).
- `src/app/[locale]/(marketing)/cursos/page.tsx` (counts + `full` mapping).
- `src/app/[locale]/(portal)/portal/admin/cohortes/page.tsx` (sobrecupo span).
- `src/messages/es.json`, `src/messages/en.json` (2 keys).
- Tests: extend `tests/components/CursosGridNextCohort.test.tsx` (or a new
  sibling file, matching its fixture style).
