"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getCourseById } from "@/lib/courses";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  createCohort,
  updateCohort,
  deleteCohort,
  type CohortInput,
} from "@/lib/cohorts";
import { CohortFields } from "./fields";

/**
 * Server actions for the cohort management admin page
 * (`/portal/admin/cohortes`).
 *
 * Every action re-checks the admin allowlist: server actions are public
 * POST endpoints, so the page-level gate is not sufficient on its own.
 */

async function assertAdmin(): Promise<void> {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    throw new Error("No autorizado.");
  }
}

function parseCohort(formData: FormData): CohortInput {
  const f = CohortFields.parse({
    courseId: formData.get("courseId"),
    name: formData.get("name") ?? "",
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    capacity: formData.get("capacity"),
    openForEnrollment: formData.get("openForEnrollment") === "on",
    audience: formData.get("audience"),
    featured: formData.get("featured") === "on",
  });
  if (!getCourseById(f.courseId)) throw new Error("Curso inválido.");
  // Date-only strings → UTC midnight, matching how the `date` columns
  // round-trip (see lib/cohorts.ts).
  const startDate = new Date(`${f.startDate}T00:00:00.000Z`);
  const endDate = new Date(`${f.endDate}T00:00:00.000Z`);
  if (endDate < startDate) {
    throw new Error("La fecha de cierre no puede ser anterior a la de inicio.");
  }
  return {
    courseId: f.courseId,
    name: f.name || null,
    startDate,
    endDate,
    capacity: f.capacity,
    openForEnrollment: f.openForEnrollment,
    audience: f.audience,
    featured: f.featured,
  };
}

export async function createCohortAction(formData: FormData): Promise<void> {
  await assertAdmin();
  await createCohort(parseCohort(formData));
  revalidatePath("/", "layout");
}

export async function updateCohortAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta el identificador del cohorte.");
  await updateCohort(id, parseCohort(formData));
  revalidatePath("/", "layout");
}

export async function deleteCohortAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta el identificador del cohorte.");
  // I2: a cohort with ANY user row referencing it is never deletable — not
  // just paid enrollees. `enrollmentCountByCohort` (paid-only) previously
  // gated this, which let an admin delete a cohort that still had approved-
  // but-unpaid students or a pending matrícula review pointing at it,
  // orphaning `users.cohortId`. Close it for enrollment instead.
  const [ref] = await db
    .select({ n: count() })
    .from(users)
    .where(eq(users.cohortId, id));
  if ((ref?.n ?? 0) > 0) {
    throw new Error(
      "No se puede eliminar un cohorte con inscritos o solicitudes pendientes.",
    );
  }
  await deleteCohort(id);
  revalidatePath("/", "layout");
}
