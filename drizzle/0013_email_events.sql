-- Resend delivery-problem ledger: bounced / complained / failed emails,
-- written by /api/webhooks/resend and listed on the admin dashboard so
-- "this student never receives our emails" is visible without waiting for
-- the complaint. Keyed by the svix-id delivery header for idempotency.
-- Idempotent — safe to re-run.
CREATE TABLE IF NOT EXISTS "email_events" (
  "id" text PRIMARY KEY NOT NULL,
  "event_type" text NOT NULL,
  "recipient" text NOT NULL,
  "subject" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
