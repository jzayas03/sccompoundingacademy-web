"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reviews, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { del } from "@vercel/blob";
import { Resend } from "resend";
import { verificationDecisionPatch } from "@/lib/portal/verification-decision";
import {
  buildVerificationApprovedEmail,
  buildVerificationRejectedEmail,
} from "@/lib/emails/verificacion";

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    throw new Error("Forbidden");
  }
}

/**
 * Mark a review as approved for public display. Idempotent — calling on
 * an already-published review just refreshes the timestamp, which the
 * landing sort uses to bring it back to the top.
 */
export async function approveReview(reviewId: string): Promise<void> {
  await requireAdmin();
  await db
    .update(reviews)
    .set({ publishedAt: new Date(), archivedAt: null })
    .where(eq(reviews.id, reviewId));
  revalidatePath("/es/portal/admin");
  revalidatePath("/es");
  revalidatePath("/en");
}

/**
 * Soft-archive a review so it is excluded from both the public landing
 * and the admin "pending" queue. The row is retained so an unarchive
 * action can be added later if needed.
 */
export async function archiveReview(reviewId: string): Promise<void> {
  await requireAdmin();
  await db
    .update(reviews)
    .set({ archivedAt: new Date(), publishedAt: null })
    .where(eq(reviews.id, reviewId));
  revalidatePath("/es/portal/admin");
  revalidatePath("/es");
  revalidatePath("/en");
}

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "SCCA <info@sccompoundingacademy.com>";

/**
 * Shared internals for the two decisions: verify admin, look up the row,
 * apply the field patch, delete the document blob (best-effort), and email
 * the student. Emails default to Spanish (the academy's primary language).
 */
async function decideVerification(
  userId: string,
  decision: "approved" | "rejected",
): Promise<void> {
  await requireAdmin();

  const [row] = await db
    .select({ email: users.email, doc: users.verificationDocUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) throw new Error("User not found");

  await db
    .update(users)
    .set(verificationDecisionPatch(decision, new Date()))
    .where(eq(users.id, userId));

  // Best-effort blob cleanup — DB status is the source of truth.
  if (row.doc) {
    try {
      await del(row.doc);
    } catch (err) {
      console.error("[verificacion] blob delete failed", err);
    }
  }

  const key = process.env.RESEND_API_KEY;
  if (key && row.email) {
    const mail =
      decision === "approved"
        ? buildVerificationApprovedEmail("es")
        : buildVerificationRejectedEmail("es");
    try {
      await new Resend(key).emails.send({
        from: FROM_ADDRESS,
        to: row.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    } catch (err) {
      console.error("[verificacion] student email failed", err);
    }
  }

  revalidatePath("/es/portal/admin");
}

export async function approveStudentVerification(userId: string): Promise<void> {
  await decideVerification(userId, "approved");
}

export async function rejectStudentVerification(userId: string): Promise<void> {
  await decideVerification(userId, "rejected");
}
