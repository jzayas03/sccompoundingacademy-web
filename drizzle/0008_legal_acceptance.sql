-- Legal-acceptance audit trail, captured at matrícula submit time (student
-- tier now persists this BEFORE payment; profesional leaves it null and the
-- webhook path no longer needs it). Idempotent — safe to re-run.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "acepto_timestamp" timestamp;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "acepto_ip" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "acepto_user_agent" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "acepto_version_docs" text;
