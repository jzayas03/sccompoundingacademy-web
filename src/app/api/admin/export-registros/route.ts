import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { listRegistrations } from "@/lib/registrations";
import { listCohorts, formatCohortLabel } from "@/lib/cohorts";
import { getCourseById } from "@/lib/courses";
import { professionLabel } from "@/lib/professions";

export const runtime = "nodejs";

/**
 * GET /api/admin/export-registros — registros livianos como CSV (spec
 * 2026-09-04 §7): las inscripciones "pagar → confirmación" de Parte 2 y
 * Estudiantes Subgraduados, que viven en `course_registrations` y NO
 * aparecen en el roster de usuarios (/api/admin/export).
 *
 * Admin-only: mismo gate `isAdminEmail` que el export del roster.
 * Deliberadamente sin ids de Stripe — el CSV es para logística del curso,
 * no para reconciliación de pagos (eso vive en el panel de Stripe).
 */
function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [registrations, cohortList] = await Promise.all([
    listRegistrations(),
    listCohorts(),
  ]);
  const cohortById = new Map(cohortList.map((c) => [c.id, c]));

  const rows = [
    ["Nombre", "Email", "Teléfono", "Profesión", "Tier", "Curso", "Cohorte", "Monto USD", "Pago"],
  ];
  for (const r of registrations) {
    const cohort = cohortById.get(r.cohortId);
    rows.push([
      r.nombre,
      r.email,
      r.telefono ?? "",
      professionLabel(r.profesion),
      r.tier,
      getCourseById(r.courseId)?.displayTitle.es ?? r.courseId,
      cohort ? formatCohortLabel(cohort, "es") : r.cohortId,
      r.amountCents != null ? (r.amountCents / 100).toFixed(2) : "",
      r.paidAt.toISOString().slice(0, 10),
    ]);
  }

  // Leading BOM so Excel opens the UTF-8 file with accents intact.
  const csv =
    "﻿" + rows.map((cols) => cols.map(csvCell).join(",")).join("\r\n");
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="scca-registros-${today}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
