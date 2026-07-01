-- Certificate-ready email dedupe ledger. One row per user the moment we send
-- their "your certificate is ready" email from the post-test submit action.
-- Send is gated on the ABSENCE of a row here, so retakes / re-passes never
-- re-send. Idempotent — safe to re-run (hand-authored per the project's
-- migration convention; the constraint add is guarded for re-application).
CREATE TABLE IF NOT EXISTS "certificate_emails" (
	"user_id" text PRIMARY KEY NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "certificate_emails" ADD CONSTRAINT "certificate_emails_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
