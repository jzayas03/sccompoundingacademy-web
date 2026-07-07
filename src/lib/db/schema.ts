import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

/**
 * Drizzle schema for the SCCA student portal (Phase A).
 *
 * The four tables required by `@auth/drizzle-adapter` (`users`, `accounts`,
 * `sessions`, `verificationTokens`) are defined explicitly so we can extend
 * `users` with portal-specific columns (tier, paidAt, cohortId, …) without
 * losing the adapter contract. Column names that the adapter looks up by
 * name (e.g. `userId`, `providerAccountId`, `sessionToken`, `expires`) keep
 * the camelCase spelling the adapter expects — Drizzle maps them to the
 * underlying SQL names via the second argument of each `text(…)` call.
 *
 * Portal-specific tables (cohorts, quiz_attempts, certificates, reviews)
 * use snake_case column names by convention. Phase B additions (e.g.
 * public reviews moderation flags) can be appended without migration
 * conflicts because the existing columns are stable.
 */

/**
 * Pricing tier enum. Active values used by application code:
 *   - "profesional" — RPh pharmacists + licensed pharmacy technicians
 *   - "student"     — non-licensed students (pre-PharmD / tech program)
 *
 * "pharmacist" is retained as a legacy value so existing rows from the
 * pre-rename schema (pre-2026-05-19) continue to parse cleanly. Drop it
 * in a future migration once the DB has no remaining `tier='pharmacist'`
 * rows.
 */
export const tierEnum = pgEnum("tier", ["pharmacist", "profesional", "student"]);

/**
 * Student-tier verification state. Set to "pending" by the Stripe webhook
 * when a student-tier enrollment is upserted; the owner moves it to
 * "approved" or "rejected" from /portal/admin. Null for the profesional
 * tier (no verification required) and for rows created before this column
 * existed.
 */
export const studentVerificationStatus = pgEnum("student_verification_status", [
  "pending",
  "approved",
  "rejected",
]);

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),

  // Portal extensions
  tier: tierEnum("tier"),
  paidAt: timestamp("paid_at", { mode: "date" }),
  stripeCustomerId: text("stripe_customer_id"),
  cohortId: text("cohort_id"),
  /** Admin override for the course-material access window: when set and in
   * the future, keeps module/PDF access open past the default cohort-end +
   * grace expiry (see lib/portal/course-access.ts). Null = no override. */
  accessExtendedUntil: timestamp("access_extended_until", { mode: "date" }),
  // Captured at inscription, persisted from the Stripe webhook. Feed the
  // ACPE "Registro de Educación Continua" export. All nullable: rows
  // created before these columns existed, and student-tier enrollees
  // (who are not licensed professionals), have no values.
  phone: text("phone"),
  license: text("license"),
  /** "farmaceutico" | "tecnico" — only meaningful for the profesional
   * tier; null for student-tier enrollees. */
  professionalType: text("professional_type"),
  /** Student-tier identity verification. Null for profesional tier. */
  studentVerification: studentVerificationStatus("student_verification"),
  /** Vercel Blob URL of the uploaded matrícula photo. Cleared (null) the
   * moment the owner approves or rejects — the document is not retained. */
  verificationDocUrl: text("verification_doc_url"),
  /** When the student submitted their matrícula for review. */
  verificationSubmittedAt: timestamp("verification_submitted_at", { mode: "date" }),
  /** Set when the owner approves; mutually exclusive with rejectedAt. */
  verifiedAt: timestamp("verified_at", { mode: "date" }),
  /** Set when the owner rejects; mutually exclusive with verifiedAt. */
  rejectedAt: timestamp("rejected_at", { mode: "date" }),
  /** Legal-acceptance audit trail, captured server-side at matrícula submit
   * (student tier) or checkout (profesional). All nullable. */
  aceptoTimestamp: timestamp("acepto_timestamp", { mode: "date" }),
  aceptoIp: text("acepto_ip"),
  aceptoUserAgent: text("acepto_user_agent"),
  aceptoVersionDocs: text("acepto_version_docs"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

export const cohortAudienceEnum = pgEnum("cohort_audience", [
  "farmaceutico_tecnico",
  "otros_profesionales",
  "estudiante",
]);

export const cohorts = pgTable("cohorts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** Catalogue course id (see `lib/courses.ts`) this cohort runs. */
  courseId: text("course_id").notNull(),
  /** Optional internal label for the owner's own reference. Students
   * never see it — their cohort label is derived from the dates. */
  name: text("name"),
  startDate: date("start_date", { mode: "date" }).notNull(),
  endDate: date("end_date", { mode: "date" }).notNull(),
  capacity: integer("capacity").notNull(),
  openForEnrollment: boolean("open_for_enrollment").notNull().default(true),
  /** Highlighted on the public landing "next cohort" band. See lib/cohorts/featured.ts. */
  featured: boolean("featured").notNull().default(false),
  /** Who this cohort enrolls. Enforced at enrollment (see lib/cohorts/audience.ts). */
  audience: cohortAudienceEnum("audience").notNull().default("farmaceutico_tecnico"),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  moduleId: integer("module_id").notNull(),
  startedAt: timestamp("started_at", { mode: "date" }).defaultNow().notNull(),
  submittedAt: timestamp("submitted_at", { mode: "date" }),
  /** Map of question id → selected answer letter. */
  answers: jsonb("answers"),
  /** Number of correct answers (0–15). */
  score: integer("score"),
  /** Percentage correct as decimal 0.00–1.00 — compared against the
   * `QUIZ_PASSING_THRESHOLD` env var (default 0.70). */
  percentage: numeric("percentage", { precision: 3, scale: 2 }),
  passed: boolean("passed"),
  /** "pre" (diagnostic, taken before the module) or "post" (graded,
   * counts toward certificate eligibility). Defaults to "post" so rows
   * written before this column existed — all of which were post-tests —
   * are interpreted correctly. */
  phase: text("phase").notNull().default("post"),
});

export const certificates = pgTable("certificates", {
  /** Cert numbering `SCCA-{YYYY}-{NNN}` (sequential per year). */
  certNo: text("cert_no").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  issuedAt: timestamp("issued_at", { mode: "date" }).defaultNow().notNull(),
  scoreM1: integer("score_m1"),
  scoreM2: integer("score_m2"),
  scoreM3: integer("score_m3"),
});

export const reviews = pgTable("reviews", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Overall 1–5 stars. */
  overallRating: integer("overall_rating").notNull(),
  m1Rating: integer("m1_rating"),
  m2Rating: integer("m2_rating"),
  m3Rating: integer("m3_rating"),
  bestComment: text("best_comment"),
  improveComment: text("improve_comment"),
  /** Opt-in toggle for Phase B public display. Default off. */
  publicConsent: boolean("public_consent").notNull().default(false),
  submittedAt: timestamp("submitted_at", { mode: "date" }).defaultNow().notNull(),
  publishedAt: timestamp("published_at", { mode: "date" }),
  archivedAt: timestamp("archived_at", { mode: "date" }),
});

/**
 * Dedupe ledger for the daily review-invite cron — one row per user the
 * moment the invite is sent. Skipping rule: the cron excludes any user
 * with a matching row here (regardless of whether they later left a
 * review). Cascades on user deletion so test-cleanup stays simple.
 */
export const reviewInvites = pgTable("review_invites", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  sentAt: timestamp("sent_at", { mode: "date" }).defaultNow().notNull(),
});

/**
 * Dedupe ledger for the certificate-ready email — one row per user the
 * moment we send their "your certificate is ready" note (fired from the
 * post-test submit action when the final module is passed). The send is
 * gated on the ABSENCE of a row here, so retakes / re-passes never
 * re-send. Cascades on user deletion.
 */
export const certificateEmails = pgTable("certificate_emails", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  sentAt: timestamp("sent_at", { mode: "date" }).defaultNow().notNull(),
});

/**
 * Stripe webhook idempotency ledger — one row per Stripe event we have
 * fully processed, keyed by Stripe's own `event.id` (evt_…).
 *
 * Stripe guarantees AT-LEAST-once delivery: the same event can arrive more
 * than once (network retries, dashboard "resend"). Without a dedupe record
 * each replay re-sends the confirmation + internal emails. The webhook
 * claims an event by inserting here BEFORE doing its work; a duplicate
 * insert conflicts on the primary key and the handler short-circuits.
 *
 * `eventType` is stored for operability (easy to eyeball what's been seen);
 * `processedAt` supports a future retention sweep (these rows are pure
 * bookkeeping and can be pruned after, say, 90 days).
 */
export const processedStripeEvents = pgTable("processed_stripe_events", {
  eventId: text("event_id").primaryKey(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at", { mode: "date" }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Cohort = typeof cohorts.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type ReviewInvite = typeof reviewInvites.$inferSelect;
export type NewReviewInvite = typeof reviewInvites.$inferInsert;
export type CertificateEmail = typeof certificateEmails.$inferSelect;
export type ProcessedStripeEvent = typeof processedStripeEvents.$inferSelect;
