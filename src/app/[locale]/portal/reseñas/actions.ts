"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviews, users } from "@/lib/db/schema";
import { isEligibleForCertificate } from "@/lib/certificates";

export type ReviewState =
  | { error: "missing-rating" }
  | { error: "send-failed" }
  | null;

const VALID_RATING = new Set([1, 2, 3, 4, 5]);
const COMMENT_MAX = 2000;

/**
 * Persist a course review for the signed-in student.
 *
 * Phase A is collection-only — reviews never surface publicly without
 * `publicConsent`. The action runs the same eligibility gate the
 * `/portal/reseñas` page does so a stray POST cannot bypass the
 * paywall + completion check, and refuses to write a second row for
 * the same user (one-review-per-user is enforced at the application
 * level because the `reviews.userId` column has no unique constraint
 * — the DB schema leaves room for Phase B's "edit your review" flow).
 *
 * On success we redirect back to the same `/portal/reseñas` route;
 * the page's existing-review branch then renders the thank-you panel
 * with a CTA into the certificate. No separate success route.
 */
export async function submitReviewAction(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const session = await auth();
  if (!session?.user?.email) return { error: "send-failed" };

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
  if (!user || !user.paidAt) return { error: "send-failed" };

  const eligibility = await isEligibleForCertificate(user.id);
  if (!eligibility.eligible) return { error: "send-failed" };

  // One review per user — bounce silently to the same page if a row
  // already exists; the server page renders the thank-you state.
  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.userId, user.id))
    .limit(1);
  if (existing) {
    redirect(`/es/portal/rese%C3%B1as`);
  }

  const overall = Number.parseInt(String(formData.get("overallRating") ?? ""), 10);
  const m1 = Number.parseInt(String(formData.get("m1Rating") ?? ""), 10);
  const m2 = Number.parseInt(String(formData.get("m2Rating") ?? ""), 10);
  const m3 = Number.parseInt(String(formData.get("m3Rating") ?? ""), 10);
  if (!VALID_RATING.has(overall) || !VALID_RATING.has(m1) || !VALID_RATING.has(m2) || !VALID_RATING.has(m3)) {
    return { error: "missing-rating" };
  }

  const bestRaw = String(formData.get("bestComment") ?? "").trim();
  const improveRaw = String(formData.get("improveComment") ?? "").trim();
  const bestComment = bestRaw ? bestRaw.slice(0, COMMENT_MAX) : null;
  const improveComment = improveRaw ? improveRaw.slice(0, COMMENT_MAX) : null;
  const publicConsent = String(formData.get("publicConsent") ?? "") === "on";

  try {
    await db.insert(reviews).values({
      userId: user.id,
      overallRating: overall,
      m1Rating: m1,
      m2Rating: m2,
      m3Rating: m3,
      bestComment,
      improveComment,
      publicConsent,
    });
  } catch (err) {
    console.error("[reviews] insert failed", err);
    return { error: "send-failed" };
  }

  redirect(`/es/portal/rese%C3%B1as`);
}
