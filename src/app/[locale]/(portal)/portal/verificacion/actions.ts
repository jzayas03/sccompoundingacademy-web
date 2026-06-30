"use server";

import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { notifyMatriculaReview } from "@/lib/portal/notify-matricula-review";

/**
 * Persists the Blob URL of a freshly-uploaded matrícula photo against the
 * signed-in student, resets their state to "pending", and notifies the
 * owner. Called by VerificacionForm AFTER the client upload to Blob
 * succeeds. Deletes any previous doc so re-uploads don't orphan blobs.
 */
export async function submitVerificationDoc(blobUrl: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  // Guard: only accept our own Blob URLs (private store for the identity doc;
  // public kept for backward compatibility).
  if (
    !/^https:\/\/[a-z0-9]+\.(?:public|private)\.blob\.vercel-storage\.com\//.test(
      blobUrl,
    )
  ) {
    throw new Error("Invalid upload URL");
  }

  const [user] = await db
    .select({ id: users.id, prev: users.verificationDocUrl, tier: users.tier })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
  if (!user || user.tier !== "student") throw new Error("Not a student enrollment");

  // Drop the previous upload (best-effort) before recording the new one.
  if (user.prev && user.prev !== blobUrl) {
    try {
      await del(user.prev);
    } catch (err) {
      console.error("[verificacion] failed to delete previous blob", err);
    }
  }

  const submittedAt = new Date();
  await db
    .update(users)
    .set({
      verificationDocUrl: blobUrl,
      studentVerification: "pending",
      verificationSubmittedAt: submittedAt,
      rejectedAt: null,
    })
    .where(eq(users.id, user.id));

  await notifyMatriculaReview({
    userId: user.id,
    name: session.user.name ?? null,
    email: session.user.email,
    docUrl: blobUrl,
    submittedAt,
  });

  revalidatePath("/es/portal/verificacion");
  revalidatePath("/en/portal/verificacion");
  revalidatePath("/es/portal/admin");
}
