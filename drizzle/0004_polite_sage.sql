ALTER TABLE "cohorts" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cohorts" ADD COLUMN "course_id" text NOT NULL;--> statement-breakpoint
INSERT INTO "cohorts" ("id", "course_id", "name", "start_date", "end_date", "capacity", "open_for_enrollment") VALUES
	('2026-06-basic', 'basic-compounding', NULL, '2026-06-25', '2026-06-27', 12, true),
	('2026-07-basic', 'basic-compounding', NULL, '2026-07-16', '2026-07-18', 12, true)
ON CONFLICT ("id") DO NOTHING;
