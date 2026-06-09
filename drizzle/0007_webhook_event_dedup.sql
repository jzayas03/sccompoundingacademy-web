-- Stripe webhook idempotency ledger.
-- Hand-authored + idempotent (CREATE TABLE IF NOT EXISTS) so it can be
-- applied directly against the DB without drizzle-kit's journal, matching
-- the 0005/0006 convention. Safe to re-run.
CREATE TABLE IF NOT EXISTS "processed_stripe_events" (
  "event_id" text PRIMARY KEY NOT NULL,
  "event_type" text NOT NULL,
  "processed_at" timestamp DEFAULT now() NOT NULL
);
