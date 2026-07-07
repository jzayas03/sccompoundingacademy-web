"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getCourseById } from "@/lib/courses";
import {
  createCohort,
  updateCohort,
  deleteCohort,
  enrollmentCountByCohort,
  type CohortInput,
} from "@/lib/cohorts";

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

export const CohortFields = z.object({
  courseId: z.string().min(1),
  name: z.string().trim().max(120),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  capacity: z.coerce.number().int().min(1).max(1000),
  openForEnrollment: z.boolean(),
  audience: z.enum(["farmaceutico_tecnico", "otros_profesionales", "estudiante"]),
});

function parseCohort(formData: FormData): CohortInput {
  const f = CohortFields.parse({
    courseId: formData.get("courseId"),
    name: formData.get("name") ?? "",
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    capacity: formData.get("capacity"),
    openForEnrollment: formData.get("openForEnrollment") === "on",
    audience: formData.get("audience"),
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
  // A cohort with paid enrollees is never deletable — their roster /
  // certificate references would dangle. Close it for enrollment instead.
  const counts = await enrollmentCountByCohort();
  if ((counts.get(id) ?? 0) > 0) {
    throw new Error("No se puede eliminar un cohorte con inscritos.");
  }
  await deleteCohort(id);
  revalidatePath("/", "layout");
}
