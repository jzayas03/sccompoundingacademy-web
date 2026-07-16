// @vitest-environment node
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  parseEmailEvent,
  verifyResendWebhook,
} from "@/lib/emails/resend-webhook";

/**
 * Resend signs webhooks with the Svix scheme: the `svix-signature` header
 * carries `v1,<base64 HMAC-SHA256>` computed over `${id}.${timestamp}.${body}`
 * with the base64-decoded portion of the `whsec_` secret as the key. The
 * verifier is a dependency-free pure function; these tests pin the scheme
 * down (including the replay-window check) so a library swap or refactor
 * can't silently weaken it.
 */

const SECRET_BYTES = Buffer.from("scca-test-webhook-secret-0123456789");
const SECRET = `whsec_${SECRET_BYTES.toString("base64")}`;
const NOW_MS = 1_784_300_000_000;

function sign(id: string, timestamp: string, payload: string): string {
  return createHmac("sha256", SECRET_BYTES)
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");
}

function validParams(payload = '{"type":"email.bounced"}') {
  const svixId = "msg_2abc";
  const svixTimestamp = String(Math.floor(NOW_MS / 1000));
  return {
    secret: SECRET,
    svixId,
    svixTimestamp,
    svixSignature: `v1,${sign(svixId, svixTimestamp, payload)}`,
    payload,
    nowMs: NOW_MS,
  };
}

describe("verifyResendWebhook", () => {
  it("accepts a correctly signed payload", () => {
    expect(verifyResendWebhook(validParams())).toBe(true);
  });

  it("accepts when one of several space-separated signatures matches", () => {
    const p = validParams();
    p.svixSignature = `v1,${Buffer.from("garbage").toString("base64")} ${p.svixSignature}`;
    expect(verifyResendWebhook(p)).toBe(true);
  });

  it("rejects a tampered payload", () => {
    const p = validParams();
    p.payload = '{"type":"email.delivered"}';
    expect(verifyResendWebhook(p)).toBe(false);
  });

  it("rejects a signature minted with a different secret", () => {
    const p = validParams();
    const otherKey = Buffer.from("someone-elses-secret-key-material!!");
    p.svixSignature = `v1,${createHmac("sha256", otherKey)
      .update(`${p.svixId}.${p.svixTimestamp}.${p.payload}`)
      .digest("base64")}`;
    expect(verifyResendWebhook(p)).toBe(false);
  });

  it("rejects timestamps outside the 5-minute replay window", () => {
    const stale = validParams();
    const staleTs = String(Math.floor(NOW_MS / 1000) - 6 * 60);
    stale.svixTimestamp = staleTs;
    stale.svixSignature = `v1,${sign(stale.svixId, staleTs, stale.payload)}`;
    expect(verifyResendWebhook(stale)).toBe(false);

    const future = validParams();
    const futureTs = String(Math.floor(NOW_MS / 1000) + 6 * 60);
    future.svixTimestamp = futureTs;
    future.svixSignature = `v1,${sign(future.svixId, futureTs, future.payload)}`;
    expect(verifyResendWebhook(future)).toBe(false);
  });

  it("rejects malformed secrets, timestamps, and signature headers", () => {
    expect(verifyResendWebhook({ ...validParams(), secret: "not-whsec" })).toBe(
      false,
    );
    expect(
      verifyResendWebhook({ ...validParams(), svixTimestamp: "not-a-number" }),
    ).toBe(false);
    expect(
      verifyResendWebhook({ ...validParams(), svixSignature: "" }),
    ).toBe(false);
    expect(
      verifyResendWebhook({ ...validParams(), svixSignature: "v1," }),
    ).toBe(false);
  });
});

describe("parseEmailEvent", () => {
  const bounced = JSON.stringify({
    type: "email.bounced",
    created_at: "2026-07-16T15:00:00.000Z",
    data: {
      email_id: "re_123",
      to: ["alondra.rodriguez77@upr.edu"],
      subject: "Tu enlace de acceso · Santa Cruz Compounding Academy",
    },
  });

  it("extracts type, recipient, and subject from a problem event", () => {
    expect(parseEmailEvent(bounced)).toEqual({
      type: "email.bounced",
      recipient: "alondra.rodriguez77@upr.edu",
      subject: "Tu enlace de acceso · Santa Cruz Compounding Academy",
    });
  });

  it("returns null for event types we don't track (delivered, opened, delayed)", () => {
    for (const type of [
      "email.delivered",
      "email.opened",
      "email.delivery_delayed",
      "email.sent",
    ]) {
      expect(parseEmailEvent(JSON.stringify({ type, data: { to: ["x@y.z"] } }))).toBeNull();
    }
  });

  it("returns null for malformed JSON or missing recipient", () => {
    expect(parseEmailEvent("not json")).toBeNull();
    expect(
      parseEmailEvent(JSON.stringify({ type: "email.bounced", data: {} })),
    ).toBeNull();
  });
});
