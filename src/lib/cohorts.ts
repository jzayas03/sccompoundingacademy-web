import { and, asc, count, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { cohorts, users, type Cohort } from "@/lib/db/schema";

/**
 * Cohort data layer.
 *
 * Cohorts are the source of truth in Postgres (the `cohorts` table), not
 * a hard-coded TS constant — the owner creates and edits them from the
 * admin panel (`/portal/admin/cohortes`). Every consumer (the inscription
 * form, the API route, the Stripe webhook, the admin views) reads through
 * here so there is a single place that touches the table.
 *
 * Student-facing labels are *derived from the dates* (`formatCohortLabel`)
 * so there is nothing to translate per cohort — adding a cohort is just
 * picking dates and a capacity.
 *
 * `startDate` / `endDate` are Drizzle `date` columns in `mode: "date"`,
 * so they arrive as JS `Date` objects pinned to UTC midnight. All
 * formatting below passes `timeZone: "UTC"` to avoid an off-by-one day
 * when the server renders in a negative-offset zone (Puerto Rico, UTC-4).
 */

export type { Cohort };

export type CohortInput = {
  courseId: string;
  name: string | null;
  startDate: Date;
  endDate: Date;
  capacity: number;
  openForEnrollment: boolean;
};

/** Every cohort, earliest first — for the admin management view. */
export async function listCohorts(): Promise<Cohort[]> {
  return db.select().from(cohorts).orderBy(asc(cohorts.startDate));
}

/**
 * Cohorts open for enrollment, earliest first. Pass `courseId` to scope
 * to one course; omit it to get every open cohort across the catalogue.
 */
export async function listOpenCohorts(courseId?: string): Promise<Cohort[]> {
  const open = eq(cohorts.openForEnrollment, true);
  return db
    .select()
    .from(cohorts)
    .where(courseId ? and(open, eq(cohorts.courseId, courseId)) : open)
    .orderBy(asc(cohorts.startDate));
}

export async function getCohort(id: string): Promise<Cohort | undefined> {
  const [row] = await db.select().from(cohorts).where(eq(cohorts.id, id)).limit(1);
  return row;
}

/** Insert a cohort. `id` is left to the schema's UUID default. */
export async function createCohort(input: CohortInput): Promise<void> {
  await db.insert(cohorts).values(input);
}

export async function updateCohort(id: string, input: CohortInput): Promise<void> {
  await db.update(cohorts).set(input).where(eq(cohorts.id, id));
}

export async function deleteCohort(id: string): Promise<void> {
  await db.delete(cohorts).where(eq(cohorts.id, id));
}

/** Map of cohort id → number of paid enrollees, for the admin roster. */
export async function enrollmentCountByCohort(): Promise<Map<string, number>> {
  const rows = await db
    .select({ cohortId: users.cohortId, n: count() })
    .from(users)
    .where(isNotNull(users.paidAt))
    .groupBy(users.cohortId);
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.cohortId) map.set(r.cohortId, r.n);
  }
  return map;
}

/** Long single date, e.g. "25 de junio de 2026" / "June 25, 2026". */
export function formatCohortDate(date: Date, locale: "es" | "en"): string {
  return new Intl.DateTimeFormat(locale === "es" ? "es-PR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Student-facing cohort label, derived from the dates. Same month →
 * "25–27 de junio de 2026" / "June 25–27, 2026"; spanning two months →
 * both months are named.
 */
export function formatCohortLabel(
  cohort: Pick<Cohort, "startDate" | "endDate">,
  locale: "es" | "en",
): string {
  const { startDate: s, endDate: e } = cohort;
  const loc = locale === "es" ? "es-PR" : "en-US";
  const day = (d: Date) =>
    new Intl.DateTimeFormat(loc, { day: "numeric", timeZone: "UTC" }).format(d);
  const month = (d: Date) =>
    new Intl.DateTimeFormat(loc, { month: "long", timeZone: "UTC" }).format(d);
  const year = e.getUTCFullYear();
  const sameMonth =
    s.getUTCFullYear() === e.getUTCFullYear() && s.getUTCMonth() === e.getUTCMonth();

  if (locale === "es") {
    return sameMonth
      ? `${day(s)}–${day(e)} de ${month(s)} de ${year}`
      : `${day(s)} de ${month(s)} – ${day(e)} de ${month(e)} de ${year}`;
  }
  return sameMonth
    ? `${month(s)} ${day(s)}–${day(e)}, ${year}`
    : `${month(s)} ${day(s)} – ${month(e)} ${day(e)}, ${year}`;
}
