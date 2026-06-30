import { describe, it, expect } from "vitest";
import { buildPendingStudentValues } from "@/lib/inscripcion/pending-enrollment";

const BASE_INPUT = {
  email: "STUDENT@Example.com  ",
  name: "Ana García",
  telefono: "787-555-0100",
  cohortId: "cohort-2026-q1",
  matriculaDocUrl: "https://abc123.private.blob.vercel-storage.com/mat.jpg",
  submittedAt: new Date("2026-06-30T12:00:00Z"),
  acceptedAt: "2026-06-30T12:00:00.000Z",
  ip: "192.168.1.10",
  userAgent: "Mozilla/5.0 (Macintosh)",
  aceptoVersionDocs: "v2026-06-01",
};

describe("buildPendingStudentValues", () => {
  it("lowercases and trims the email", () => {
    const { insertValues } = buildPendingStudentValues(BASE_INPUT);
    expect(insertValues.email).toBe("student@example.com");
  });

  it("sets tier to 'student'", () => {
    const { insertValues } = buildPendingStudentValues(BASE_INPUT);
    expect(insertValues.tier).toBe("student");
  });

  it("sets studentVerification to 'pending'", () => {
    const { insertValues } = buildPendingStudentValues(BASE_INPUT);
    expect(insertValues.studentVerification).toBe("pending");
  });

  it("does NOT include paidAt — student pays only after owner approval", () => {
    const { insertValues } = buildPendingStudentValues(BASE_INPUT);
    expect((insertValues as Record<string, unknown>).paidAt).toBeUndefined();
  });

  it("maps audit fields through unchanged", () => {
    const { insertValues } = buildPendingStudentValues(BASE_INPUT);
    expect(insertValues.aceptoIp).toBe("192.168.1.10");
    expect(insertValues.aceptoVersionDocs).toBe("v2026-06-01");
    expect(insertValues.aceptoTimestamp).toEqual(new Date("2026-06-30T12:00:00.000Z"));
    expect(insertValues.aceptoUserAgent).toBe("Mozilla/5.0 (Macintosh)");
  });

  it("maps verificationDocUrl and verificationSubmittedAt", () => {
    const { insertValues } = buildPendingStudentValues(BASE_INPUT);
    expect(insertValues.verificationDocUrl).toBe(BASE_INPUT.matriculaDocUrl);
    expect(insertValues.verificationSubmittedAt).toEqual(BASE_INPUT.submittedAt);
  });

  it("truncates userAgent to 480 chars", () => {
    const long = "X".repeat(600);
    const { insertValues } = buildPendingStudentValues({ ...BASE_INPUT, userAgent: long });
    expect(insertValues.aceptoUserAgent!.length).toBe(480);
  });

  it("conflictSet studentVerification SQL CASE references 'approved' to preserve approved rows", () => {
    const { conflictSet } = buildPendingStudentValues(BASE_INPUT);
    // Drizzle sql`` builds a SQL AST where queryChunks is an array of mixed
    // chunk types. StringChunk objects carry `value: string[]` for the literal
    // SQL text parts; Column/Table references have different shapes (and are
    // circular, so JSON.stringify would fail on them).
    // Filter to only string-array chunks, flatten, then verify "approved" appears —
    // proving the CASE expression won't reset an already-approved row to pending.
    const node = conflictSet.studentVerification as {
      queryChunks?: Array<{ value?: unknown }>;
    };
    const stringParts = (node.queryChunks ?? [])
      .filter((c) => Array.isArray(c.value))
      .flatMap((c) => c.value as string[]);
    expect(stringParts.some((s) => s.includes("approved"))).toBe(true);
  });

  it("conflictSet verifiedAt is a SQL CASE that preserves the value for approved rows (I-2 fix)", () => {
    // An approved student who re-submits must NOT have verifiedAt wiped —
    // canResendPayLink requires verifiedAt != null, and the resend form only
    // shows for approved+unpaid students. Setting it unconditionally to null
    // would leave the row in an approved-but-verifiedAt=null state that the
    // resend route then refuses (inconsistent). The CASE mirrors the existing
    // studentVerification CASE so both fields stay consistent on re-submit.
    const { conflictSet } = buildPendingStudentValues(BASE_INPUT);
    const node = conflictSet.verifiedAt as {
      queryChunks?: Array<{ value?: unknown }>;
    };
    const stringParts = (node.queryChunks ?? [])
      .filter((c) => Array.isArray(c.value))
      .flatMap((c) => c.value as string[]);
    expect(stringParts.some((s) => s.includes("approved"))).toBe(true);
  });

  it("conflictSet clears rejectedAt on re-submit (prior rejection superseded)", () => {
    const { conflictSet } = buildPendingStudentValues(BASE_INPUT);
    expect(conflictSet.rejectedAt).toBeNull();
  });
});
