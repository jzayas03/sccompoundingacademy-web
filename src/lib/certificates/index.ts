import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { certificates, quizAttempts } from "@/lib/db/schema";

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
  passedModules: { 1: boolean; 2: boolean; 3: boolean };
};

const MODULE_IDS = [1, 2, 3] as const;

export async function isEligibleForCertificate(
  userId: string,
): Promise<EligibilityReport> {
  const passedModules = { 1: false, 2: false, 3: false };
  for (const m of MODULE_IDS) {
    const [row] = await db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, userId),
          eq(quizAttempts.moduleId, m),
          eq(quizAttempts.passed, true),
        ),
      )
      .limit(1);
    if (row) passedModules[m] = true;
  }
  return {
    eligible: passedModules[1] && passedModules[2] && passedModules[3],
    passedModules,
  };
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
): Promise<{ cert: CertRecord; isNew: boolean }> {
  const existing = await findCertificateByUser(userId);
  if (existing) return { cert: existing, isNew: false };

  const year = new Date().getFullYear();
  const prefix = `SCCA-${year}-`;

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
    const certNo = `${prefix}${String(nextNum).padStart(3, "0")}`;
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
