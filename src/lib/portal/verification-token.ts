import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless signed token for the matrícula approve/reject links emailed to
 * the admin. The link carries the decision; the HMAC (keyed on AUTH_SECRET)
 * is what authorizes it — clicking from the inbox needs no portal session.
 *
 * `submittedAt` (the user's `verificationSubmittedAt` epoch-ms) is signed in
 * so a token is implicitly scoped to one submission: if the student
 * re-uploads (new submittedAt) the old links no longer match the row, and
 * once a decision lands the row is no longer `pending` so a replay is inert
 * (the apply step re-checks state). No server-side nonce store needed.
 */
export type VerificationDecisionPayload = {
  userId: string;
  decision: "approved" | "rejected";
  submittedAt: number;
};

function signingSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    throw new Error("AUTH_SECRET is required to sign verification links");
  }
  return s;
}

function hmac(body: string): Buffer {
  return createHmac("sha256", signingSecret()).update(body).digest();
}

export function signVerificationDecision(
  payload: VerificationDecisionPayload,
): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = hmac(body).toString("base64url");
  return `${body}.${sig}`;
}

export function verifyVerificationDecision(
  token: string,
): VerificationDecisionPayload | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = hmac(body).toString("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const p = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as VerificationDecisionPayload;
    if (
      typeof p.userId === "string" &&
      p.userId.length > 0 &&
      (p.decision === "approved" || p.decision === "rejected") &&
      typeof p.submittedAt === "number"
    ) {
      return p;
    }
    return null;
  } catch {
    return null;
  }
}
