"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reviews, users, quizAttempts, certificates } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { applyVerificationDecision } from "@/lib/portal/apply-verification-decision";

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

/**
 * Apply an admin verification decision. Authorization is the admin session;
 * the row flip + document cleanup + student email live in
 * `applyVerificationDecision` so the emailed approve/reject links reuse the
 * exact same logic.
 */
async function decideVerification(
  userId: string,
  decision: "approved" | "rejected",
): Promise<void> {
  await requireAdmin();
  await applyVerificationDecision(userId, decision);
  revalidatePath("/es/portal/admin");
}

export async function approveStudentVerification(userId: string): Promise<void> {
  await decideVerification(userId, "approved");
}

export async function rejectStudentVerification(userId: string): Promise<void> {
  await decideVerification(userId, "rejected");
}

/**
 * Admin: extend (or clear) a student's course-material access override.
 * `until` is a YYYY-MM-DD date — access stays open through the end of that
 * day (UTC); an empty value clears the override, reverting to the default
 * cohort-end + 30-day window. See lib/portal/course-access.ts.
 */
export async function extendStudentAccess(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const until = String(formData.get("until") ?? "").trim();
  if (!userId) throw new Error("Falta el usuario.");
  let value: Date | null = null;
  if (until) {
    value = new Date(`${until}T23:59:59.000Z`);
    if (Number.isNaN(value.getTime())) throw new Error("Fecha inválida.");
  }
  await db
    .update(users)
    .set({ accessExtendedUntil: value })
    .where(eq(users.id, userId));
  revalidatePath("/es/portal/admin");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EditEmailState = { ok: boolean; message: string };

/**
 * Admin: change a user's login email.
 *
 * Email is the Auth.js magic-link identity (`user.email`, unique), so the
 * usual support case is a typo. Renaming preserves the row `id` and
 * therefore all linked data (payment, tier, verification, quiz attempts,
 * certificate).
 *
 * The hard case is a collision: the student often creates an EMPTY
 * duplicate account under the correct email while their real (paid)
 * account sits under the typo. A plain rename would hit the unique index.
 * So when the target email already exists we only proceed if that account
 * is provably empty — no payment, no quiz attempts, no certificate — in
 * which case we drop it (every `user` FK is ON DELETE CASCADE) and rename,
 * atomically via `db.batch` (the neon-http driver has no interactive
 * transactions). If the target account has payment or progress we refuse
 * and leave it for a human to merge.
 */
export async function updateUserEmail(
  _prev: EditEmailState,
  formData: FormData,
): Promise<EditEmailState> {
  await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  if (!userId) return { ok: false, message: "Falta el usuario." };
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Correo inválido." };

  const [current] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!current) return { ok: false, message: "Usuario no encontrado." };
  if (current.email.toLowerCase() === email.toLowerCase()) {
    return { ok: true, message: "El correo no cambió." };
  }

  const [other] = await db
    .select({ id: users.id, paidAt: users.paidAt })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (other) {
    const [quiz] = await db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, other.id))
      .limit(1);
    const [cert] = await db
      .select({ certNo: certificates.certNo })
      .from(certificates)
      .where(eq(certificates.userId, other.id))
      .limit(1);
    const isEmptyDuplicate = !other.paidAt && !quiz && !cert;
    if (!isEmptyDuplicate) {
      return {
        ok: false,
        message:
          "Ese correo ya pertenece a una cuenta con pago o progreso. Revísalo manualmente.",
      };
    }
    // Atomic: drop the empty duplicate (FKs cascade), then rename.
    await db.batch([
      db.delete(users).where(eq(users.id, other.id)),
      db.update(users).set({ email }).where(eq(users.id, userId)),
    ]);
    revalidatePath("/es/portal/admin");
    return {
      ok: true,
      message: `Correo actualizado a ${email} (se eliminó una cuenta vacía duplicada).`,
    };
  }

  await db.update(users).set({ email }).where(eq(users.id, userId));
  revalidatePath("/es/portal/admin");
  return { ok: true, message: `Correo actualizado a ${email}.` };
}
