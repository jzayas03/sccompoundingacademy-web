// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// server-only throws outside the Next.js bundler — mock it away.
vi.mock("server-only", () => ({}));

// Mock the token verifier (Task 2 contract).
vi.mock("@/lib/portal/verification-token", () => ({
  verifyCheckoutToken: vi.fn(),
}));

// Mock the Stripe checkout session creator (Task 3 contract).
vi.mock("@/lib/inscripcion/checkout", () => ({
  createStudentCheckoutSession: vi.fn(),
}));

// Mock siteUrl to a fixed origin so redirect assertions are deterministic.
vi.mock("@/lib/siteUrl", () => ({
  getSiteUrl: () => "https://sccompoundingacademy.com",
}));

import { GET } from "@/app/api/inscripcion/pagar/route";
import { verifyCheckoutToken } from "@/lib/portal/verification-token";
import { createStudentCheckoutSession } from "@/lib/inscripcion/checkout";

const BASE = "https://x/api/inscripcion/pagar?token=t";
const CLOSED_BASE = "https://sccompoundingacademy.com/es/inscripcion/pago-cerrado";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/inscripcion/pagar", () => {
  it("redirects invalid (null) token to pago-cerrado?reason=invalido", async () => {
    vi.mocked(verifyCheckoutToken).mockReturnValue(null);
    const res = await GET(new Request(BASE));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain(`${CLOSED_BASE}?reason=invalido`);
  });

  it("redirects expired token to pago-cerrado?reason=expirado", async () => {
    // approvedAt = 0 is ~56 years ago — well beyond 48h.
    vi.mocked(verifyCheckoutToken).mockReturnValue({ userId: "u1", approvedAt: 0 });
    const res = await GET(new Request(BASE));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain(`${CLOSED_BASE}?reason=expirado`);
  });

  it("redirects to Stripe on the happy path (fresh token + checkout ok)", async () => {
    const NOW = Date.now();
    vi.mocked(verifyCheckoutToken).mockReturnValue({ userId: "u1", approvedAt: NOW });
    vi.mocked(createStudentCheckoutSession).mockResolvedValue({
      ok: true,
      url: "https://stripe.test/s",
    });
    const res = await GET(new Request(BASE));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://stripe.test/s");
  });

  it("maps already-paid reason to ?reason=pagado", async () => {
    const NOW = Date.now();
    vi.mocked(verifyCheckoutToken).mockReturnValue({ userId: "u1", approvedAt: NOW });
    vi.mocked(createStudentCheckoutSession).mockResolvedValue({
      ok: false,
      reason: "already-paid",
    });
    const res = await GET(new Request(BASE));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain(`${CLOSED_BASE}?reason=pagado`);
  });

  it("maps cohort-closed reason to ?reason=cerrada", async () => {
    const NOW = Date.now();
    vi.mocked(verifyCheckoutToken).mockReturnValue({ userId: "u1", approvedAt: NOW });
    vi.mocked(createStudentCheckoutSession).mockResolvedValue({
      ok: false,
      reason: "cohort-closed",
    });
    const res = await GET(new Request(BASE));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain(`${CLOSED_BASE}?reason=cerrada`);
  });

  it("maps not-approved reason to ?reason=invalido", async () => {
    const NOW = Date.now();
    vi.mocked(verifyCheckoutToken).mockReturnValue({ userId: "u1", approvedAt: NOW });
    vi.mocked(createStudentCheckoutSession).mockResolvedValue({
      ok: false,
      reason: "not-approved",
    });
    const res = await GET(new Request(BASE));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain(`${CLOSED_BASE}?reason=invalido`);
  });

  it("maps stripe-error to ?reason=error", async () => {
    const NOW = Date.now();
    vi.mocked(verifyCheckoutToken).mockReturnValue({ userId: "u1", approvedAt: NOW });
    vi.mocked(createStudentCheckoutSession).mockResolvedValue({
      ok: false,
      reason: "stripe-error",
    });
    const res = await GET(new Request(BASE));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain(`${CLOSED_BASE}?reason=error`);
  });
});
