# SCCA Module Prompts

This folder contains the source-of-truth prompts used to generate the
educational content (slides, scripts, quizzes) for the SCCA programs and
portal modules.

## Files

| File | Role |
|---|---|
| `refined-module-prompts.md` | 14 module prompts + 1 Bonus prompt, evidence-based 2025–2026 update. Designed for Gamma (or any AI presentation tool). |

## How these map to the platform

The prompts cover **15 total modules** that fall into two categories
mapped to the architecture in the v1.5 portal plan
(`~/.claude/plans/scca-landing-page-virtual-snowglobe.md`):

### Category A · Core in-person course content (USP 795 / USP 800)
- Module 1 — Introduction to Pharmaceutical Compounding
- Module 7 — General Compounding Principles (reference doc)
- Module 13 — Compounding Equipment Masterclass
- Module 14 — Capsule Compounding

### Category B · Portal v1.5 complementary modules (video + PDF + quiz each)
- Module 2 — Dermatology Compounding
- Module 3 — Topical Anesthetics (BLT)
- Module 4 — Pediatric Compounding
- Module 5 — Veterinary Compounding
- Module 6 — Hormones & BHRT Intro
- Module 8 — Anal Fissures
- Module 9 — Eosinophilic Esophagitis
- Module 10 — Alopecia
- Module 11 — Menopause & Hormonal Balance
- Module 12 — Erectile Dysfunction & Men's Health
- Bonus — Specialty Delivery Systems & Patient Services

The Especialidades component on the landing page
(`src/components/marketing/Especialidades.tsx`) is **already aligned**
with the Category B specialty modules — every area listed there
(Dermatológico, Hormonal, Pediatría, Veterinario, BLT, General) has at
least one corresponding module here.

## Workflow

1. **Owner / instructor** edits this file when guideline updates or
   new evidence requires content revisions.
2. **Gamma (or similar)** consumes each module's prompt to generate
   the slide deck for the in-person cohort.
3. **Quiz engine (v1.5)** will use these prompts as the source for the
   post-test question bank — each module's key checkpoints + guideline
   references become Zod-validated quiz items with explanations.
4. **Anti-drift**: the "Summary of Key Guideline Updates Applied" table
   at the bottom of `refined-module-prompts.md` is the audit trail of
   which version of which guideline was the basis for each module. When
   a guideline updates (e.g., NAMS, USP), bump that table + the affected
   module + recompile the deck.

## Versioning

This is a living document. Treat each meaningful update as a PR with a
clear commit message: "docs(modules): MODULE N — updated per <source>".
That way the git log is the evolution audit trail for content updates.
