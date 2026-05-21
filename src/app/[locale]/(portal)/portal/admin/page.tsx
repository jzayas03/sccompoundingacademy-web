import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq, isNotNull } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/glass/GlassCard";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, reviews, certificates } from "@/lib/db/schema";
import { isAdminEmail } from "@/lib/admin";
import { listCohorts, formatCohortLabel, type Cohort } from "@/lib/cohorts";
import { professionLabel } from "@/lib/professions";
import { Link } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Administración · SCCA Portal",
  robots: { index: false, follow: false },
};

/**
 * Owner-facing admin view (Phase A). Three read-only sections backed by
 * data that already exists: the enrollment roster, course reviews, and
 * issued certificates. ES-only — the portal namespace is ES-only and
 * this is an internal tool, so the copy is hard-coded rather than
 * routed through next-intl.
 *
 * Gating: the `/portal/*` middleware already blocks anonymous traffic;
 * this page additionally requires the signed-in email to be on the
 * `ADMIN_EMAILS` allowlist (see lib/admin.ts). A signed-in student who
 * is not an admin is bounced to their own dashboard.
 */
function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-PR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function cohortLabel(cohortId: string | null, byId: Map<string, Cohort>): string {
  if (!cohortId) return "—";
  const c = byId.get(cohortId);
  if (!c) return cohortId;
  return formatCohortLabel(c, "es");
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.email) {
    redirect(`/${locale}/portal/login`);
  }
  if (!isAdminEmail(session.user.email)) {
    redirect(`/${locale}/portal`);
  }

  const roster = await db
    .select({
      name: users.name,
      email: users.email,
      tier: users.tier,
      professionalType: users.professionalType,
      license: users.license,
      phone: users.phone,
      paidAt: users.paidAt,
      cohortId: users.cohortId,
    })
    .from(users)
    .where(isNotNull(users.paidAt))
    .orderBy(desc(users.paidAt));

  const reviewRows = await db
    .select({
      studentName: users.name,
      studentEmail: users.email,
      overall: reviews.overallRating,
      m1: reviews.m1Rating,
      m2: reviews.m2Rating,
      m3: reviews.m3Rating,
      best: reviews.bestComment,
      improve: reviews.improveComment,
      submittedAt: reviews.submittedAt,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .orderBy(desc(reviews.submittedAt));

  const certRows = await db
    .select({
      certNo: certificates.certNo,
      studentName: users.name,
      studentEmail: users.email,
      issuedAt: certificates.issuedAt,
    })
    .from(certificates)
    .leftJoin(users, eq(certificates.userId, users.id))
    .orderBy(desc(certificates.issuedAt));

  const cohortList = await listCohorts();
  const cohortById = new Map(
    cohortList.map((c): [string, Cohort] => [c.id, c]),
  );

  return (
    <Container className="max-w-6xl py-12 sm:py-16">
      <div>
        <p className="font-heading text-teal-deep/80 flex items-center text-xs font-semibold tracking-[0.18em] uppercase">
          <span aria-hidden className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm" />
          Administración
        </p>
        <h1 className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl">
          Panel del owner
        </h1>
        <p className="text-gray-700 mt-2 text-sm">
          {roster.length} inscrito{roster.length === 1 ? "" : "s"} ·{" "}
          {reviewRows.length} reseña{reviewRows.length === 1 ? "" : "s"} ·{" "}
          {certRows.length} certificado{certRows.length === 1 ? "" : "s"}
        </p>
        <div className="mt-4">
          <Link
            href="/portal/admin/cohortes"
            className="bg-teal-deep text-off-white hover:bg-teal font-heading inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold transition-colors"
          >
            Gestionar cohortes →
          </Link>
        </div>
      </div>

      {/* Roster */}
      <GlassCard className="mt-10 overflow-x-auto p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-teal-deep text-lg font-semibold">
            Roster de inscritos
          </h2>
          {/* Plain <a>, not next/link: this hits an API route that
              streams a CSV download — SPA navigation would not trigger
              the browser download. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/admin/export"
            className="border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-off-white font-heading inline-flex h-9 items-center rounded-md border px-3 text-xs font-semibold transition-colors"
          >
            Exportar CSV ↓
          </a>
        </div>
        {roster.length === 0 ? (
          <p className="text-gray-700 mt-4 text-sm">Sin inscritos aún.</p>
        ) : (
          <table className="mt-4 w-full border-collapse text-left text-sm">
            <thead>
              <tr className="text-teal-deep/70 border-gray-300 border-b text-xs uppercase tracking-wide">
                <th className="py-2 pr-4 font-semibold">Nombre</th>
                <th className="py-2 pr-4 font-semibold">Email</th>
                <th className="py-2 pr-4 font-semibold">Profesión</th>
                <th className="py-2 pr-4 font-semibold">Licencia</th>
                <th className="py-2 pr-4 font-semibold">Celular</th>
                <th className="py-2 pr-4 font-semibold">Tier</th>
                <th className="py-2 pr-4 font-semibold">Pago</th>
                <th className="py-2 font-semibold">Cohorte</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r) => (
                <tr key={r.email} className="border-gray-300/60 border-b last:border-0">
                  <td className="py-2 pr-4 text-gray-900">{r.name ?? "—"}</td>
                  <td className="py-2 pr-4 text-gray-700">{r.email}</td>
                  <td className="py-2 pr-4 text-gray-700">{professionLabel(r.professionalType) || "—"}</td>
                  <td className="py-2 pr-4 text-gray-700">{r.license ?? "—"}</td>
                  <td className="py-2 pr-4 text-gray-700">{r.phone ?? "—"}</td>
                  <td className="py-2 pr-4 text-gray-700">{r.tier ?? "—"}</td>
                  <td className="py-2 pr-4 text-gray-700">{fmtDate(r.paidAt)}</td>
                  <td className="py-2 text-gray-700">{cohortLabel(r.cohortId, cohortById)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      {/* Reviews */}
      <GlassCard className="mt-8 overflow-x-auto p-6 sm:p-8">
        <h2 className="font-heading text-teal-deep text-lg font-semibold">
          Reseñas de estudiantes
        </h2>
        {reviewRows.length === 0 ? (
          <p className="text-gray-700 mt-4 text-sm">Sin reseñas aún.</p>
        ) : (
          <table className="mt-4 w-full border-collapse text-left text-sm">
            <thead>
              <tr className="text-teal-deep/70 border-gray-300 border-b text-xs uppercase tracking-wide">
                <th className="py-2 pr-4 font-semibold">Estudiante</th>
                <th className="py-2 pr-4 font-semibold">General</th>
                <th className="py-2 pr-4 font-semibold">M1 / M2 / M3</th>
                <th className="py-2 pr-4 font-semibold">Lo mejor</th>
                <th className="py-2 pr-4 font-semibold">A mejorar</th>
                <th className="py-2 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {reviewRows.map((r, i) => (
                <tr key={i} className="border-gray-300/60 border-b align-top last:border-0">
                  <td className="py-2 pr-4 text-gray-900">
                    {r.studentName ?? r.studentEmail ?? "—"}
                  </td>
                  <td className="py-2 pr-4 text-gray-700">{r.overall}/5</td>
                  <td className="py-2 pr-4 text-gray-700">
                    {r.m1 ?? "—"} / {r.m2 ?? "—"} / {r.m3 ?? "—"}
                  </td>
                  <td className="py-2 pr-4 text-gray-700">{r.best ?? "—"}</td>
                  <td className="py-2 pr-4 text-gray-700">{r.improve ?? "—"}</td>
                  <td className="py-2 text-gray-700">{fmtDate(r.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      {/* Certificates */}
      <GlassCard className="mt-8 overflow-x-auto p-6 sm:p-8">
        <h2 className="font-heading text-teal-deep text-lg font-semibold">
          Certificados emitidos
        </h2>
        {certRows.length === 0 ? (
          <p className="text-gray-700 mt-4 text-sm">Sin certificados emitidos aún.</p>
        ) : (
          <table className="mt-4 w-full border-collapse text-left text-sm">
            <thead>
              <tr className="text-teal-deep/70 border-gray-300 border-b text-xs uppercase tracking-wide">
                <th className="py-2 pr-4 font-semibold">Certificado</th>
                <th className="py-2 pr-4 font-semibold">Estudiante</th>
                <th className="py-2 font-semibold">Emitido</th>
              </tr>
            </thead>
            <tbody>
              {certRows.map((r) => (
                <tr key={r.certNo} className="border-gray-300/60 border-b last:border-0">
                  <td className="py-2 pr-4 font-heading text-teal-deep font-semibold">
                    {r.certNo}
                  </td>
                  <td className="py-2 pr-4 text-gray-900">
                    {r.studentName ?? r.studentEmail ?? "—"}
                  </td>
                  <td className="py-2 text-gray-700">{fmtDate(r.issuedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </Container>
  );
}
