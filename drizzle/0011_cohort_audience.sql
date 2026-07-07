-- Cohort audience: restrict who can enroll into a cohort
-- (farmacéuticos/técnicos, otros profesionales, or estudiantes). Existing
-- cohorts default to 'farmaceutico_tecnico'. Idempotent — safe to re-run.
DO $$ BEGIN
  CREATE TYPE "cohort_audience" AS ENUM ('farmaceutico_tecnico', 'otros_profesionales', 'estudiante');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "audience" "cohort_audience" NOT NULL DEFAULT 'farmaceutico_tecnico';
