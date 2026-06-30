import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/siteUrl";
import { getCohort } from "@/lib/cohorts";
import { getCourseById, getPricingByTier } from "@/lib/courses";

export type CheckoutOutcome =
  | { ok: true; url: string }
  | {
      ok: false;
      reason:
        | "not-found"
        | "already-paid"
        | "not-approved"
        | "cohort-closed"
        | "no-price"
        | "stripe-error";
    };

/**
 * Turn an approved, unpaid student row into a Stripe Checkout URL. The single
 * place that enforces the pre-payment preconditions: row exists, student tier,
 * verification approved, not yet paid, cohort still open. The 48h token expiry
 * is enforced by the CALLER (it owns the signed token); this function only
 * checks DB state. `userId` travels in session metadata so the webhook can
 * find this exact row.
 */
export async function createStudentCheckoutSession(
  userId: string,
): Promise<CheckoutOutcome> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      paidAt: users.paidAt,
      studentVerification: users.studentVerification,
      cohortId: users.cohortId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return { ok: false, reason: "not-found" };
  if (row.paidAt) return { ok: false, reason: "already-paid" };
  if (row.studentVerification !== "approved")
    return { ok: false, reason: "not-approved" };

  const cohort = row.cohortId ? await getCohort(row.cohortId) : undefined;
  if (!cohort || !cohort.openForEnrollment)
    return { ok: false, reason: "cohort-closed" };

  const course = getCourseById(cohort.courseId);
  const pricing = course && getPricingByTier(course, "student");
  const stripePriceId = pricing && process.env[pricing.stripePriceEnvKey];
  if (!stripePriceId) {
    console.error("[pagar] STRIPE_PRICE_ID_STUDENT not configured");
    return { ok: false, reason: "no-price" };
  }

  const origin = getSiteUrl();
  // Locale isn't stored on the row; default to ES success/cancel paths.
  const successUrl = `${origin}/es/inscripcion/exito?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/es/inscripcion/cancelada`;

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      allow_promotion_codes: true,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer_email: row.email ?? undefined,
      metadata: { user_id: row.id, tier: "student" },
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_intent_data: { receipt_email: row.email ?? undefined },
      locale: "es",
    });
    if (!session.url) return { ok: false, reason: "stripe-error" };
    return { ok: true, url: session.url };
  } catch (err) {
    const e = err as { type?: string; code?: string; message?: string };
    console.error("[pagar] Stripe error", { type: e?.type, code: e?.code, message: e?.message });
    return { ok: false, reason: "stripe-error" };
  }
}
