"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reviews, users, quizAttempts, certificates } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { applyVerificationDecision } from "@/lib/portal/apply-verification-decision";
import {
  getCohort,
  enrollmentCountByCohort,
  formatCohortLabel,
} from "@/lib/cohorts";
import { validateCohortChange } from "@/lib/cohorts/change";

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
 * is provably empty — no payment, no quiz attempts, no certificate, and no
 * verification (matrícula) in progress — in which case we drop it (every
 * `user` FK is ON DELETE CASCADE) and rename, atomically via `db.batch`
 * (the neon-http driver has no interactive transactions). If the target
 * account has payment, progress, or a pending verification we refuse and
 * leave it for a human to merge.
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
    .select({
      id: users.id,
      paidAt: users.paidAt,
      verificationDocUrl: users.verificationDocUrl,
      verificationSubmittedAt: users.verificationSubmittedAt,
    })
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
    // I3: also refuse when the duplicate has an in-flight verification
    // (matrícula uploaded, awaiting admin decision) — deleting it would
    // silently drop a pending review the owner hasn't acted on yet.
    const isEmptyDuplicate =
      !other.paidAt &&
      !quiz &&
      !cert &&
      !other.verificationDocUrl &&
      !other.verificationSubmittedAt;
    if (!isEmptyDuplicate) {
      return {
        ok: false,
        message:
          "Ese correo ya pertenece a una cuenta con pago, progreso o una verificación en curso. Revísalo manualmente.",
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

export type ChangeCohortState = { ok: boolean; message: string };

/**
 * Admin: move an enrolled student to a different cohort.
 *
 * `users.cohortId` is otherwise only ever written at enrollment (the
 * inscription form and the Stripe webhook); this is the one path that
 * reassigns it afterwards. The rules live in `validateCohortChange`
 * (pure, unit-tested): audience must match the student's profile — a hard
 * barrier `force` never overrides — and a full destination cohort
 * (paid ≥ capacity) is blocked unless the admin passes `force`, which
 * bypasses the capacity check only. Seats are counted by
 * `enrollmentCountByCohort` (paid enrollees per cohort), so after the write
 * the source cohort's count drops and the destination's rises with no other
 * bookkeeping; we revalidate the admin page and the public seat-meter pages.
 */
export async function changeCohort(
  _prev: ChangeCohortState,
  formData: FormData,
): Promise<ChangeCohortState> {
  await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const destCohortId = String(formData.get("cohortId") ?? "");
  const force = formData.get("force") === "on";
  if (!userId || !destCohortId) return { ok: false, message: "Faltan datos." };

  const [student] = await db
    .select({
      id: users.id,
      tier: users.tier,
      professionalType: users.professionalType,
      cohortId: users.cohortId,
      paidAt: users.paidAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!student) return { ok: false, message: "Usuario no encontrado." };
  // M3: only a paid enrollee has a cohort seat to move. Moving an unpaid
  // (pending or approved-but-unpaid) student would write `cohortId` on a
  // row `enrollmentCountByCohort` never counted in the first place — a
  // silent no-op that could mislead the admin into thinking the move
  // affected capacity.
  if (!student.paidAt)
    return { ok: false, message: "El alumno no tiene un pago registrado." };

  const dest = await getCohort(destCohortId);
  if (!dest) return { ok: false, message: "Cohorte no encontrada." };

  const currentCohort = student.cohortId
    ? await getCohort(student.cohortId)
    : undefined;
  const currentCourseId = currentCohort?.courseId ?? null;

  // Read-then-write race accepted at this scale: two concurrent admin moves
  // (or a move racing a webhook-driven payment) could both read the same
  // `counts` snapshot and both pass the capacity check, briefly oversubscribing
  // the destination by one seat (mirrors the accepted trade-off documented on
  // `enrollmentCountByCohort` in lib/cohorts.ts).
  const counts = await enrollmentCountByCohort();
  const code = validateCohortChange({
    destAudience: dest.audience,
    destCapacity: dest.capacity,
    destPaidCount: counts.get(dest.id) ?? 0,
    destCourseId: dest.courseId,
    destOpen: dest.openForEnrollment,
    tier: student.tier ?? "",
    professionalType: student.professionalType,
    currentCohortId: student.cohortId,
    currentCourseId,
    destCohortId: dest.id,
    force,
  });

  if (code === "same")
    return { ok: true, message: "El alumno ya está en esa cohorte." };
  if (code === "audience-mismatch")
    return {
      ok: false,
      message: "Esa cohorte no corresponde al perfil del alumno.",
    };
  if (code === "course-mismatch")
    return { ok: false, message: "Esa cohorte es de otro curso." };
  if (code === "closed")
    return { ok: false, message: "Esa cohorte está cerrada para inscripción." };
  if (code === "full") {
    const n = counts.get(dest.id) ?? 0;
    return {
      ok: false,
      message: `Cohorte llena (${n}/${dest.capacity}). Marca "forzar" para moverlo de todos modos.`,
    };
  }

  await db.update(users).set({ cohortId: dest.id }).where(eq(users.id, userId));
  revalidatePath("/es/portal/admin");
  revalidatePath("/es");
  revalidatePath("/en");
  revalidatePath("/es/cursos");
  revalidatePath("/en/cursos");
  return {
    ok: true,
    message: `Cohorte cambiada a ${formatCohortLabel(dest, "es")}.`,
  };
}
