# CLAUDE.md — sccompoundingacademy-web

Project rules for AI-assisted work in this repo. The global
`~/.claude/CLAUDE.md` (workflow, hard rules) applies on top of this.

## Course material ↔ quiz banks (rule added 2026-08-19)

- `src/lib/quizzes/dia-*.ts` (professional tier) MUST be the **literal
  text** — same language — of the POST-TEST slides in the deck currently
  served from `private/modulos/dia-*.pdf`; explanations = the deck's
  ANSWER KEY rationales. The same bank feeds pre-test and post-test.
- When a deck PDF changes: `pdftotext -layout` it and cotejar every
  prompt / option / answer letter against the bank **before merging**.
  Never change `id`, `type` or `correctAnswer` without the owner's OK
  (historical attempts and `certificates.scoreM{n}` depend on them).
- Student-tier banks (`usp-795/800.ts`) follow the same rule against
  `est-795/800.pdf`.
