// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(async () => ({ error: null })),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({ emails: { send: sendMock } })),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimit: vi.fn(async () => ({ success: true })),
  clientIp: vi.fn(() => "1.2.3.4"),
}));

import { POST } from "@/app/api/waitlist/route";

function post(body: Record<string, unknown>) {
  return POST(
    new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const BASE = {
  name: "Ana Rivera",
  email: "ana@example.com",
  role: "Farmacéutico licenciado",
  cohort: "Agosto 2026",
  locale: "es",
};

describe("POST /api/waitlist — phone field", () => {
  beforeEach(() => {
    sendMock.mockClear();
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_REPLY_TO", "ops@example.com");
    vi.stubEnv("EMAIL_FROM", "SCCA <no-reply@example.com>");
  });

  it("accepts a signup with a phone and includes it in the notification email", async () => {
    const res = await post({ ...BASE, phone: "(787) 555-1234" });
    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
    const html = sendMock.mock.calls[0][0].html as string;
    expect(html).toContain("(787) 555-1234");
    expect(html).toContain("Teléfono / Phone");
  });

  it("still accepts a signup without a phone (older cached clients)", async () => {
    const res = await post(BASE);
    expect(res.status).toBe(200);
    const html = sendMock.mock.calls[0][0].html as string;
    expect(html).not.toContain("Teléfono / Phone");
  });

  it("rejects a phone that is not a plausible number", async () => {
    const res = await post({ ...BASE, phone: "not-a-phone" });
    expect(res.status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
