import { sql } from "drizzle-orm";
import { users } from "@/lib/db/schema";

export type PendingStudentInput = {
  email: string;
  name?: string | null;
  telefono?: string | null;
  cohortId: string;
  matriculaDocUrl: string;
  submittedAt: Date;
  /** ISO string — server-stamped at inscription time. */
  acceptedAt: string;
  ip: string;
  userAgent: string;
  aceptoVersionDocs: string;
};

/**
 * Pure builder: derives the Drizzle insert-values and onConflict-set for a
 * student pending-enrollment row. No I/O — the caller owns the DB write.
 *
 * Extracted from POST /api/inscripcion so the field-mapping contract (email
 * normalisation, tier coercion, paidAt absent, audit fields) can be verified
 * without a DB or Stripe mock.
 */
export function buildPendingStudentValues(input: PendingStudentInput) {
  const email = input.email.trim().toLowerCase();

  /** Values for the initial INSERT. */
  const insertValues = {
    email,
    name: input.name || null,
    tier: "student" as const,
    phone: input.telefono || null,
    cohortId: input.cohortId,
    studentVerification: "pending" as const,
    verificationDocUrl: input.matriculaDocUrl,
    verificationSubmittedAt: input.submittedAt,
    aceptoTimestamp: new Date(input.acceptedAt),
    aceptoIp: input.ip,
    aceptoUserAgent: input.userAgent.slice(0, 480),
    aceptoVersionDocs: input.aceptoVersionDocs,
  };

  /** SET clause for `ON CONFLICT (email) DO UPDATE`. */
  const conflictSet = {
    name: input.name || undefined,
    tier: "student" as const,
    phone: input.telefono || null,
    cohortId: input.cohortId,
    // Preserve an existing approval; only (re)set to pending when not approved.
    studentVerification: sql`case when ${users.studentVerification} = 'approved' then ${users.studentVerification} else 'pending'::"public"."student_verification_status" end`,
    verificationDocUrl: input.matriculaDocUrl,
    verificationSubmittedAt: input.submittedAt,
    verifiedAt: null,
    rejectedAt: null,
    aceptoTimestamp: new Date(input.acceptedAt),
    aceptoIp: input.ip,
    aceptoUserAgent: input.userAgent.slice(0, 480),
    aceptoVersionDocs: input.aceptoVersionDocs,
  };

  return { insertValues, conflictSet };
}
