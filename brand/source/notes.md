# Brand source — read me first

The two PDFs in this folder are the **canonical brand reference** for the SCCA web property.

- `SC Compounding Academy.pdf` — full brand sheet: logo lockups, palette swatches, typography spec, sample applications, slogans.
- `Compounding Academy Brandsheet.pdf` — palette system: 5 core colors, tint/shade ramps, neutral scale, brand gradient, type-on-color matrix.

## In-code source of truth

The PDFs are the *visual* reference. The *executable* source of truth is **`/lib/brand.ts`** (added during implementation). That file mirrors the PDFs and is the only place hex literals live. A lint rule blocks hex literals anywhere else.

If the PDFs are updated, `brand.ts` must be updated to match in the same PR.

## Slogans (canonical wording)

- **Primary (ES):** `Educamos para formar bienestar y salud.`
- **Primary (EN):** `We educate to build wellness and health.`
- **Secondary (ES):** `Tu próxima certificación comienza aquí.`
- **Secondary (EN):** `Your next certification starts here.`

These live in `messages/{es,en}.json` and must match exactly.

## Logo lockups (all needed as SVG components)

- Primary horizontal: shield + "Santa Cruz Compounding Academy"
- Inverse horizontal: same, for use on chartreuse backgrounds
- Square shield (SCCA monogram + mortar)
- Inverse shield
- Wordmark-only (footer use)
- Pattern tile (repeating monogram + shield, for section dividers)

## Photography guidance

- Warm, real pharmacy/lab settings
- Diverse Latin American pharmacists/techs (matches PR audience)
- Subjects isolated on solid teal `#225560` or sky backgrounds — never busy commercial environments
- Pair hero shots with chartreuse callout cards (matches the existing billboard treatment)
- Better to ship 2–3 great shots than 10 generic ones

## USP scope (curriculum, not branding, but informs copy)

The Academy teaches **USP 795** (Non-Sterile Compounding) and **USP 800** (Hazardous Drug Handling).
**Sterile (USP 797) is out of scope.** Copy must not imply otherwise.
