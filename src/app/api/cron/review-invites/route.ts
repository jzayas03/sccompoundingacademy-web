import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { users, quizAttempts, reviews, reviewInvites } from "@/lib/db/schema";
import { buildReviewInviteEmail } from "@/lib/emails/review-invite";
import { getSiteUrl } from "@/lib/siteUrl";

export const runtime = "nodejs";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const FROM_ADDRESS =
  process.env.EMAIL_FROM ??
  process.env.RESEND_FROM ??
  "Santa Cruz Compounding Academy <noreply@sccompoundingacademy.com>";
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? "info@sccompoundingacademy.com";

function authorize(req: Request): "ok" | "no-secret" | "forbidden" {
  const secret = process.env.CRON_SECRET;
  if (!secret) return "no-secret";
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}` ? "ok" : "forbidden";
}

/**
 * Find users whose 3rd passed post-test was >=24h ago, who have not been
 * invited yet, and have not submitted a review yet. Returns at most 50
 * candidates per run to keep Resend usage predictable.
 */
async function findCandidates(now: Date) {
  const cutoff = new Date(now.getTime() - ONE_DAY_MS);

  // Pull every (userId, moduleId, submittedAt) of passing post-test
  // attempts. We then count distinct module passes per user in JS —
  // small audience, simple to reason about, avoids gnarly SQL.
  const passRows = await db
    .select({
      userId: quizAttempts.userId,
      moduleId: quizAttempts.moduleId,
      submittedAt: quizAttempts.submittedAt,
    })
    .from(quizAttempts)
    .where(and(eq(quizAttempts.phase, "post"), eq(quizAttempts.passed, true)));

  type PerUser = {
    userId: string;
    modules: Set<number>;
    latestPassAt: Date | null;
  };
  const byUser = new Map<string, PerUser>();
  for (const r of passRows) {
    if (!r.submittedAt) continue;
    const slot = byUser.get(r.userId) ?? {
      userId: r.userId,
      modules: new Set<number>(),
      latestPassAt: null,
    };
    slot.modules.add(r.moduleId);
    if (!slot.latestPassAt || r.submittedAt > slot.latestPassAt) {
      slot.latestPassAt = r.submittedAt;
    }
    byUser.set(r.userId, slot);
  }

  const eligibleIds = Array.from(byUser.values())
    .filter((u) => u.modules.size >= 3 && u.latestPassAt && u.latestPassAt <= cutoff)
    .map((u) => u.userId);
  if (eligibleIds.length === 0) return [];

  // Exclude users who already have an invite recorded or a review on file.
  const alreadyInvited = await db
    .select({ userId: reviewInvites.userId })
    .from(reviewInvites);
  const invitedSet = new Set(alreadyInvited.map((r) => r.userId));

  const reviewed = await db.select({ userId: reviews.userId }).from(reviews);
  const reviewedSet = new Set(reviewed.map((r) => r.userId));

  const targetIds = eligibleIds.filter((id) => !invitedSet.has(id) && !reviewedSet.has(id));
  if (targetIds.length === 0) return [];

  const targets = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(inArray(users.id, targetIds))
    .limit(50);

  return targets;
}

export async function POST(req: Request) {
  const verdict = authorize(req);
  if (verdict === "no-secret") {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  if (verdict === "forbidden") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 },
    );
  }
  const resend = new Resend(apiKey);

  const now = new Date();
  const candidates = await findCandidates(now);
  if (candidates.length === 0) {
    return NextResponse.json({ sent: 0, message: "no candidates" });
  }

  const reviewUrl = `${getSiteUrl()}/es/portal/rese%C3%B1as`;

  let sent = 0;
  const errors: Array<{ userId: string; error: string }> = [];
  for (const u of candidates) {
    if (!u.email) continue;
    try {
      const email = buildReviewInviteEmail({
        nombre: u.name ?? "",
        reviewUrl,
      });
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: u.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        replyTo: REPLY_TO,
      });
      await db
        .insert(reviewInvites)
        .values({ userId: u.id, sentAt: now })
        .onConflictDoNothing();
      sent += 1;
    } catch (err) {
      errors.push({
        userId: u.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ sent, errors });
}
