import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { certificates, quizAttempts } from "@/lib/db/schema";
import { requiredOrdinals, type UserTier } from "@/lib/curriculum";
import { certPrefix, type CertProgram } from "./program";

export * from "./program";

/**
 * Certificate lifecycle helpers for the SCCA portal.
 *
 * Two responsibilities:
 *   1. **Eligibility** — a student qualifies for the participation
 *      certificate once they have at least one passing attempt on each
 *      of the three module post-tests. Threshold is configured per
 *      attempt at submit time (env `QUIZ_PASSING_THRESHOLD`, default
 *      0.70); we just check the stored `passed` boolean here.
 *   2. **Numbering + persistence** — certificates use the human-friendly
 *      sequential format `SCCA-{YYYY}-{NNN}` per year. The numbering
 *      query is `MAX(cert_no) WHERE prefix matches`, and the insert is
 *      wrapped in a single retry-on-conflict loop so two simultaneous
 *      issuances cannot collide on the same NNN (PK enforces uniqueness;
 *      the second insert throws, we re-allocate the next number).
 *
 * `getOrCreateCertificate` is idempotent: if the user already has a
 * row, it returns the existing certNo and `isNew: false`. This lets
 * the API route be called multiple times (e.g. re-download) without
 * issuing duplicate certificates.
 */

export type EligibilityReport = {
  eligible: boolean;
  passedModules: Record<number, boolean>;
};

/** Pure eligibility evaluator: given the ordinals the user has passed and
 *  their tier, returns whether every curriculum-required ordinal is
 *  covered plus the per-ordinal pass map (keyed by the tier's required
 *  ordinals only). No DB access — unit-testable. */
export function evaluateEligibility(
  passedOrdinals: ReadonlySet<number>,
  tier: UserTier,
): EligibilityReport {
  const required = requiredOrdinals(tier);
  const passedModules: Record<number, boolean> = {};
  for (const ordinal of required) passedModules[ordinal] = passedOrdinals.has(ordinal);
  return { eligible: required.every((o) => passedModules[o]), passedModules };
}

export async function isEligibleForCertificate(
  userId: string,
  tier: UserTier,
): Promise<EligibilityReport> {
  const required = requiredOrdinals(tier);
  // Single query — pulls the moduleIds (curriculum ordinals) of any
  // passing post-test attempt for this user that belongs to the tier's
  // required set, then delegates to the pure evaluator. Previously this
  // ran one query per module (a 3x N+1 on every dashboard render).
  const rows = await db
    .select({ moduleId: quizAttempts.moduleId })
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.userId, userId),
        inArray(quizAttempts.moduleId, required),
        eq(quizAttempts.passed, true),
        // Only the graded post-test counts toward the certificate —
        // a passing diagnostic pre-test must never qualify a student.
        eq(quizAttempts.phase, "post"),
      ),
    );
  return evaluateEligibility(new Set(rows.map((r) => r.moduleId)), tier);
}

export type CertRecord = {
  certNo: string;
  userId: string;
  issuedAt: Date;
};

export async function findCertificateByUser(userId: string): Promise<CertRecord | null> {
  const [existing] = await db
    .select()
    .from(certificates)
    .where(eq(certificates.userId, userId))
    .orderBy(desc(certificates.issuedAt))
    .limit(1);
  if (!existing) return null;
  return { certNo: existing.certNo, userId: existing.userId, issuedAt: existing.issuedAt };
}

export async function findCertificateByNumber(
  certNo: string,
): Promise<CertRecord | null> {
  const [existing] = await db
    .select()
    .from(certificates)
    .where(eq(certificates.certNo, certNo))
    .limit(1);
  if (!existing) return null;
  return { certNo: existing.certNo, userId: existing.userId, issuedAt: existing.issuedAt };
}

export async function getOrCreateCertificate(
  userId: string,
  program: CertProgram,
): Promise<{ cert: CertRecord; isNew: boolean }> {
  const existing = await findCertificateByUser(userId);
  if (existing) return { cert: existing, isNew: false };

  const year = new Date().getFullYear();
  const prefix = certPrefix(program, year);

  const startSeq = (() => {
    const raw = process.env.CERTIFICATE_YEAR_SEQUENCE_START;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  })();

  // One-shot retry on PK conflict — at low cohort volumes (12–36/year)
  // this is overkill, but the retry path is cheap and protects against
  // the impossible-but-real race where two webhooks fire concurrently.
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const nextNum = await nextSequenceNumber(prefix, startSeq);
    // Human-sequential number for the owner's records + an UNGUESSABLE
    // random suffix so the public verification URL can't be enumerated by
    // walking 001, 002, 003…: a valid lookup returns the graduate's name, so
    // without the suffix someone could harvest the whole roster. 3 bytes =
    // 16.7M combinations per sequence number, which with the /verificar rate
    // limit makes brute-forcing a single certificate infeasible. `parseInt`
    // in nextSequenceNumber stops at the "-", so the suffix doesn't perturb
    // the sequence, and old suffix-less certs still verify by their number.
    const suffix = randomBytes(3).toString("hex").toUpperCase();
    const certNo = `${prefix}${String(nextNum).padStart(3, "0")}-${suffix}`;
    const issuedAt = new Date();
    try {
      await db.insert(certificates).values({ certNo, userId, issuedAt });
      return { cert: { certNo, userId, issuedAt }, isNew: true };
    } catch (err) {
      // Likely a duplicate-key collision; bump and retry. If something
      // else is wrong we will exhaust retries and surface the error.
      if (attempt === MAX_RETRIES - 1) throw err;
    }
  }
  throw new Error("Failed to allocate certificate number after retries.");
}

async function nextSequenceNumber(
  prefix: string,
  startSeq: number,
): Promise<number> {
  const [row] = await db
    .select({ maxCert: sql<string | null>`MAX(${certificates.certNo})` })
    .from(certificates)
    .where(sql`${certificates.certNo} LIKE ${prefix + "%"}`);
  const maxCert = row?.maxCert ?? null;
  if (!maxCert) return startSeq;
  const lastChunk = maxCert.slice(prefix.length);
  const parsed = parseInt(lastChunk, 10);
  if (!Number.isFinite(parsed)) return startSeq;
  return Math.max(parsed + 1, startSeq);
}
