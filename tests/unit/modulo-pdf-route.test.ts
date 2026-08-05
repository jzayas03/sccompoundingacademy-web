// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Regression contract for `/api/portal/modulo/[id]/pdf`.
 *
 * The bug this pins: the pre-test gate used to live ONLY on the module
 * page, so a paid student could skip a module's diagnostic pre-test by
 * requesting this URL directly (the pattern is visible in the network tab
 * as soon as they legitimately open any other module). That silently
 * corrupts the pre/post comparison the ACPE report rests on.
 *
 * These cases assert the route runs the SAME `resolveModuleAccess` policy
 * as the page — payment, then pre-test — plus the annex whitelist.
 */

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/admin", () => ({ isAdminEmail: vi.fn(() => false) }));
vi.mock("@/lib/cohorts", () => ({ getCohort: vi.fn(async () => null) }));
vi.mock("@/lib/portal/module-pdf", () => ({
  readModuloPdf: vi.fn(async () => Buffer.from("%PDF-1.7 fake")),
  moduloPdfExists: vi.fn(() => true),
}));

// Drizzle chain stub: every query ends in `.limit()`, so each call shifts
// the next queued row-set off `rows`.
const rows: unknown[][] = [];
vi.mock("@/lib/db", () => {
  const chain = () => {
    const c = {
      from: () => c,
      where: () => c,
      limit: async () => rows.shift() ?? [],
    };
    return c;
  };
  return { db: { select: () => chain() } };
});

import { GET } from "@/app/api/portal/modulo/[id]/pdf/route";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { readModuloPdf } from "@/lib/portal/module-pdf";

const URL_BASE = "https://x/api/portal/modulo/modulo-2/pdf";
const params = (id = "modulo-2") => ({ params: Promise.resolve({ id }) });

/** A paid, verified professional-tier student. */
const paidUser = {
  id: "u1",
  tier: "profesional",
  paidAt: new Date("2026-01-01"),
  studentVerification: null,
  cohortId: null,
  accessExtendedUntil: null,
};

beforeEach(() => {
  rows.length = 0;
  vi.clearAllMocks();
  vi.mocked(isAdminEmail).mockReturnValue(false);
  vi.mocked(auth).mockResolvedValue({
    user: { email: "estudiante@example.com" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  vi.mocked(readModuloPdf).mockResolvedValue(Buffer.from("%PDF-1.7 fake"));
});

describe("GET /api/portal/modulo/[id]/pdf — pre-test gate", () => {
  it("refuses the material to a paid student with no pre-test attempt (403)", async () => {
    rows.push([paidUser]); // users lookup
    rows.push([]); // quizAttempts lookup → no "pre" attempt
    const res = await GET(new Request(URL_BASE), params());
    expect(res.status).toBe(403);
    expect(await res.text()).toBe("Pre-test requerido");
    expect(readModuloPdf).not.toHaveBeenCalled();
  });

  it("serves the material once the pre-test attempt exists (200)", async () => {
    rows.push([paidUser]);
    rows.push([{ id: "attempt-1" }]); // a phase:"pre" attempt exists
    const res = await GET(new Request(URL_BASE), params());
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("checks payment before the pre-test (unpaid → 402, not 403)", async () => {
    rows.push([{ ...paidUser, paidAt: null }]);
    const res = await GET(new Request(URL_BASE), params());
    expect(res.status).toBe(402);
    expect(readModuloPdf).not.toHaveBeenCalled();
  });

  it("lets an owner through with no payment and no pre-test", async () => {
    vi.mocked(isAdminEmail).mockReturnValue(true);
    rows.push([{ ...paidUser, paidAt: null }]);
    const res = await GET(new Request(URL_BASE), params());
    expect(res.status).toBe(200);
  });

  it("rejects an anonymous request (401)", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await GET(new Request(URL_BASE), params());
    expect(res.status).toBe(401);
  });
});

describe("GET /api/portal/modulo/[id]/pdf — annex selector", () => {
  it("serves a declared anejo behind the same pre-test gate", async () => {
    rows.push([paidUser]);
    rows.push([{ id: "attempt-1" }]);
    const res = await GET(
      new Request(
        "https://x/api/portal/modulo/modulo-1/pdf?anejo=pack-stat",
      ),
      params("modulo-1"),
    );
    expect(res.status).toBe(200);
    expect(readModuloPdf).toHaveBeenCalledWith("dia-1-anejo-pack-stat", "es");
  });

  it("withholds an anejo from a student who skipped the pre-test (403)", async () => {
    rows.push([paidUser]);
    rows.push([]);
    const res = await GET(
      new Request(
        "https://x/api/portal/modulo/modulo-1/pdf?anejo=pack-stat",
      ),
      params("modulo-1"),
    );
    expect(res.status).toBe(403);
    expect(readModuloPdf).not.toHaveBeenCalled();
  });

  it("404s an undeclared anejo slug (whitelist, never a raw filename)", async () => {
    rows.push([paidUser]);
    rows.push([{ id: "attempt-1" }]);
    const res = await GET(
      new Request(
        "https://x/api/portal/modulo/modulo-1/pdf?anejo=../../etc/passwd",
      ),
      params("modulo-1"),
    );
    expect(res.status).toBe(404);
    expect(readModuloPdf).not.toHaveBeenCalled();
  });
});
