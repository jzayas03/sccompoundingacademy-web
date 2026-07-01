-- Per-student admin override for the course-material access window. When set
-- to a future timestamp it keeps module/PDF access open past the default
-- (cohort end date + 30-day grace); null means no override. See
-- lib/portal/course-access.ts. Idempotent — safe to re-run.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "access_extended_until" timestamp;
