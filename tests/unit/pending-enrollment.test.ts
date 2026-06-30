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

  it("includes a conflictSet with a non-null studentVerification SQL expression", () => {
    const { conflictSet } = buildPendingStudentValues(BASE_INPUT);
    // This is a Drizzle SQL AST node (the CASE expression that preserves 'approved' rows).
    expect(conflictSet.studentVerification).toBeTruthy();
  });

  it("conflictSet clears verifiedAt and rejectedAt on re-submit", () => {
    const { conflictSet } = buildPendingStudentValues(BASE_INPUT);
    expect(conflictSet.verifiedAt).toBeNull();
    expect(conflictSet.rejectedAt).toBeNull();
  });
});
