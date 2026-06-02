DO $$ BEGIN
 CREATE TYPE "public"."student_verification_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "student_verification" "student_verification_status";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "verification_doc_url" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "verification_submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "rejected_at" timestamp;
