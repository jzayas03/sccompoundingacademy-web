// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// server-only throws outside the Next.js bundler — mock it away.
vi.mock("server-only", () => ({}));

// mockEmailSend is referenced lazily inside the Resend mockImplementation callback,
// so it is only accessed when `new Resend(key).emails.send(...)` is called (at test
// time, after all top-level initializers have run). No TDZ issue.
const mockEmailSend = vi.fn();

// ── db mock ───────────────────────────────────────────────────────────────────
// mockRows is also accessed lazily (inside arrow functions), so it too avoids TDZ.
let mockRows: unknown[] = [];

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          // Accessed lazily at query-execution time — mockRows is initialized by then.
          limit: () => mockRows,
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
  },
}));

// ── Resend mock ───────────────────────────────────────────────────────────────
// mockEmailSend is accessed inside the `.mockImplementation` callback which runs
// when `new Resend(key)` is called, NOT at factory-evaluation time.
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockEmailSend },
  })),
}));

// ── @vercel/blob mock ─────────────────────────────────────────────────────────
// Use vi.fn() inline — no outer-variable access at factory call time.
vi.mock("@vercel/blob", () => ({ del: vi.fn().mockResolvedValue(undefined) }));

// ── siteUrl mock ──────────────────────────────────────────────────────────────
vi.mock("@/lib/siteUrl", () => ({
  getSiteUrl: () => "https://sccompoundingacademy.com",
}));

import { applyVerificationDecision } from "@/lib/portal/apply-verification-decision";

// ── setup ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  process.env.AUTH_SECRET = "test-secret-task-5";
  process.env.RESEND_API_KEY = "re_test_key";
  mockRows = [];
  mockEmailSend
    .mockReset()
    .mockResolvedValue({ data: { id: "test-email-id" }, error: null });
});

// ── fixtures ──────────────────────────────────────────────────────────────────
const unpaidRow = {
  email: "student@example.com",
  doc: null,
  current: "pending" as const,
  paidAt: null,
};

const paidRow = {
  email: "student@example.com",
  doc: null,
  current: "pending" as const,
  paidAt: new Date("2026-06-01T10:00:00Z"),
};

// ── tests ─────────────────────────────────────────────────────────────────────
describe("applyVerificationDecision", () => {
  it("approval of an unpaid row emails a pay link", async () => {
    // Task 5: pre-payment path — paidAt null → send signed 48h checkout URL.
    mockRows = [unpaidRow];
    const result = await applyVerificationDecision("u1", "approved");
    expect(result).toEqual({ status: "applied", email: "student@example.com" });

    expect(mockEmailSend).toHaveBeenCalledOnce();
    const sentArgs = mockEmailSend.mock.calls[0]![0] as {
      html: string;
      text: string;
      subject: string;
    };
    expect(sentArgs.html).toContain("/api/inscripcion/pagar?token=");
    expect(sentArgs.text).toContain("/api/inscripcion/pagar?token=");
  });

  it("approval of a paid row emails the portal-access note", async () => {
    // Existing in-portal path — paidAt is set → confirm portal access (unchanged).
    mockRows = [paidRow];
    const result = await applyVerificationDecision("u2", "approved");
    expect(result).toEqual({ status: "applied", email: "student@example.com" });

    expect(mockEmailSend).toHaveBeenCalledOnce();
    const sentArgs = mockEmailSend.mock.calls[0]![0] as {
      html: string;
      text: string;
      subject: string;
    };
    expect(sentArgs.text).toContain("acceso completo al portal");
  });

  it("rejection sends the rejection email (unchanged)", async () => {
    mockRows = [unpaidRow];
    const result = await applyVerificationDecision("u1", "rejected");
    expect(result).toEqual({ status: "applied", email: "student@example.com" });

    expect(mockEmailSend).toHaveBeenCalledOnce();
    const sentArgs = mockEmailSend.mock.calls[0]![0] as {
      html: string;
      text: string;
      subject: string;
    };
    expect(sentArgs.text).toContain("No pudimos verificar");
  });

  it("returns not-found for a missing user", async () => {
    mockRows = [];
    const result = await applyVerificationDecision("ghost", "approved");
    expect(result).toEqual({ status: "not-found" });
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("returns already-decided when status is not pending", async () => {
    mockRows = [{ ...unpaidRow, current: "approved" }];
    const result = await applyVerificationDecision("u1", "approved");
    expect(result).toEqual({
      status: "already-decided",
      email: "student@example.com",
    });
    expect(mockEmailSend).not.toHaveBeenCalled();
  });
});
