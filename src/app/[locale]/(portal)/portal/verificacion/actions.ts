"use server";

import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { buildVerificationSubmittedEmail } from "@/lib/emails/verificacion";

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "SCCA <info@sccompoundingacademy.com>";
const OPS_RECIPIENT =
  process.env.EMAIL_REPLY_TO ?? "info@sccompoundingacademy.com";

/**
 * Persists the Blob URL of a freshly-uploaded matrícula photo against the
 * signed-in student, resets their state to "pending", and notifies the
 * owner. Called by VerificacionForm AFTER the client upload to Blob
 * succeeds. Deletes any previous doc so re-uploads don't orphan blobs.
 */
export async function submitVerificationDoc(blobUrl: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  // Guard: only accept our own Blob URLs.
  if (!/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(blobUrl)) {
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

  await db
    .update(users)
    .set({
      verificationDocUrl: blobUrl,
      studentVerification: "pending",
      verificationSubmittedAt: new Date(),
      rejectedAt: null,
    })
    .where(eq(users.id, user.id));

  const key = process.env.RESEND_API_KEY;
  if (key) {
    const mail = buildVerificationSubmittedEmail({
      nombre: session.user.name ?? "",
      email: session.user.email,
    });
    try {
      await new Resend(key).emails.send({
        from: FROM_ADDRESS,
        to: OPS_RECIPIENT,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    } catch (err) {
      console.error("[verificacion] owner notification failed", err);
    }
  }

  revalidatePath("/es/portal/verificacion");
  revalidatePath("/en/portal/verificacion");
  revalidatePath("/es/portal/admin");
}
