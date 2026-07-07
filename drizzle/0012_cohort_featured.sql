-- Featured cohort: the one highlighted on the public landing "next cohort"
-- band. Idempotent — safe to re-run.
ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false;
