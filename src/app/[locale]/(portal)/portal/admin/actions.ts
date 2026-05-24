"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

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
