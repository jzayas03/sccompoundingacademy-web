import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailEvents } from "@/lib/db/schema";
import {
  parseEmailEvent,
  verifyResendWebhook,
} from "@/lib/emails/resend-webhook";

/**
 * Resend delivery-event webhook. Persists delivery PROBLEMS (bounced /
 * complained / failed) into the `email_events` ledger for the admin
 * dashboard; everything else is acknowledged and dropped.
 *
 * Mirrors the Stripe webhook's contract:
 *   - raw body read byte-for-byte before verification,
 *   - missing secret → 500 (misconfiguration, Svix retries),
 *   - missing/invalid signature → 400 (never retried),
 *   - DB insert failure → 500 so Svix redelivers,
 *   - duplicate delivery (same svix-id) → 200 short-circuit.
 *
 * Setup: create the webhook in the Resend dashboard pointing at
 * https://sccompoundingacademy.com/api/webhooks/resend with the bounced /
 * complained / failed event types, and set its signing secret (whsec_…)
 * as RESEND_WEBHOOK_SECRET in Vercel.
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const payload = await req.text();
  const valid = verifyResendWebhook({
    secret,
    svixId,
    svixTimestamp,
    svixSignature,
    payload,
  });
  if (!valid) {
    console.warn("[resend-webhook] signature verification failed");
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const event = parseEmailEvent(payload);
  if (!event) {
    // Verified but untracked (delivered/opened/…) or unparseable — ack so
    // Svix stops retrying; there is nothing for us to record.
    return NextResponse.json({ received: true });
  }

  try {
    await db
      .insert(emailEvents)
      .values({
        id: svixId,
        eventType: event.type,
        recipient: event.recipient,
        subject: event.subject,
      })
      .onConflictDoNothing({ target: emailEvents.id });
  } catch (error) {
    console.error("[resend-webhook] failed to persist event", error);
    return NextResponse.json({ error: "persist failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
