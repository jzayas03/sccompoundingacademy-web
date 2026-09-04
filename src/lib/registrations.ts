import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  courseRegistrations,
  type CourseRegistration,
  type NewCourseRegistration,
} from "@/lib/db/schema";

/**
 * Data layer del registro liviano (spec 2026-09-04) — inscripciones
 * "pagar → confirmación" que NO crean usuario del portal (curso Parte 2 y
 * tier subgraduado del básico). Espejo del patrón de `lib/cohorts.ts`:
 * todo consumidor (API de inscripción, webhook de Stripe, admin) pasa por
 * aquí, así hay un solo sitio que toca la tabla.
 */

export type { CourseRegistration, NewCourseRegistration };

/**
 * Inserta el registro pagado. Idempotente por `stripeSessionId`
 * (`onConflictDoNothing`): un replay del webhook para la misma sesión de
 * Stripe devuelve `inserted: false` y el caller NO reenvía emails.
 */
export async function insertRegistration(
  values: NewCourseRegistration,
): Promise<{ inserted: boolean }> {
  const rows = await db
    .insert(courseRegistrations)
    .values(values)
    .onConflictDoNothing({ target: courseRegistrations.stripeSessionId })
    .returning({ id: courseRegistrations.id });
  return { inserted: rows.length > 0 };
}

/** ¿Existe ya un registro pagado de este email en esta cohorte? (pre-check
 *  de duplicado del POST /api/inscripcion — el UNIQUE de la tabla es la
 *  garantía final). */
export async function registrationExists(
  cohortId: string,
  email: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: courseRegistrations.id })
    .from(courseRegistrations)
    .where(
      and(
        eq(courseRegistrations.cohortId, cohortId),
        eq(courseRegistrations.email, email.trim().toLowerCase()),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/** Todos los registros pagados, más reciente primero — para la vista admin
 *  y el export CSV. Solo lectura: un registro pagado es final (reembolsos =
 *  manual vía Stripe + borrado manual, ver runbook del admin). */
export async function listRegistrations(): Promise<CourseRegistration[]> {
  return db
    .select()
    .from(courseRegistrations)
    .orderBy(desc(courseRegistrations.paidAt));
}

/**
 * Mapa cohorte → número de registros pagados. Se SUMA a
 * `enrollmentCountByCohort` (usuarios pagados) en todo conteo de asientos:
 * para cohortes de cursos con teoría este término es 0, así que sumar
 * siempre es seguro.
 */
export async function registrationCountByCohort(): Promise<Map<string, number>> {
  const rows = await db
    .select({ cohortId: courseRegistrations.cohortId, n: count() })
    .from(courseRegistrations)
    .groupBy(courseRegistrations.cohortId);
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.cohortId, r.n);
  }
  return map;
}
