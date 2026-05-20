import { NextResponse } from "next/server";
import { desc, isNotNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";

/**
 * GET /api/admin/export — enrollment roster as a CSV download.
 *
 * Admin-only: requires a signed-in session whose email is on the
 * `ADMIN_EMAILS` allowlist. Anonymous or non-admin → 403.
 *
 * This is the Phase A roster export (name, email, tier, payment date,
 * cohort). The full ACPE "Registro de Educación Continua" export is a
 * Phase B follow-up — it needs the Farmacéutico/Técnico flag plus the
 * license number and phone, which are not persisted yet.
 */
function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const roster = await db
    .select({
      name: users.name,
      email: users.email,
      tier: users.tier,
      paidAt: users.paidAt,
      cohortId: users.cohortId,
    })
    .from(users)
    .where(isNotNull(users.paidAt))
    .orderBy(desc(users.paidAt));

  const rows = [["Nombre", "Email", "Tier", "Pago", "Cohorte"]];
  for (const r of roster) {
    rows.push([
      r.name ?? "",
      r.email,
      r.tier ?? "",
      r.paidAt ? r.paidAt.toISOString().slice(0, 10) : "",
      r.cohortId ?? "",
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
      "content-disposition": `attachment; filename="scca-roster-${today}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
