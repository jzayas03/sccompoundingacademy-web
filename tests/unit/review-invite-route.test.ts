import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/cron/review-invites/route";

describe("POST /api/cron/review-invites — auth gate", () => {
  const original = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret-123";
  });
  afterEach(() => {
    if (original === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = original;
    }
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const req = new Request("https://example.com/api/cron/review-invites", {
      method: "POST",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when the Authorization header is wrong", async () => {
    const req = new Request("https://example.com/api/cron/review-invites", {
      method: "POST",
      headers: { authorization: "Bearer wrong-secret" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 500 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const req = new Request("https://example.com/api/cron/review-invites", {
      method: "POST",
      headers: { authorization: "Bearer test-secret-123" },
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
