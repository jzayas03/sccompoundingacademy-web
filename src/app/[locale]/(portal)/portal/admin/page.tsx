import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import { GlassCard } from "@/components/glass/GlassCard";
import { SectionBanner } from "@/components/portal/SectionBanner";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, reviews, certificates } from "@/lib/db/schema";
import { isAdminEmail } from "@/lib/admin";
import { signedMatriculaUrl } from "@/lib/portal/blob-read";
import {
  listCohorts,
  enrollmentCountByCohort,
  formatCohortLabel,
  type Cohort,
} from "@/lib/cohorts";
import { professionLabel } from "@/lib/professions";
import { Link } from "@/i18n/routing";
import {
  approveReview,
  archiveReview,
  approveStudentVerification,
  rejectStudentVerification,
} from "./actions";
import { AdminEditEmail } from "@/components/portal/AdminEditEmail";

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
    // Drizzle timestamps deserialize to UTC Date — pin formatting to UTC
    // so the admin roster does not shift by a day in PR (UTC-4).
    timeZone: "UTC",
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
      id: users.id,
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
      id: reviews.id,
      userName: users.name,
      userEmail: users.email,
      overall: reviews.overallRating,
      m1: reviews.m1Rating,
      m2: reviews.m2Rating,
      m3: reviews.m3Rating,
      best: reviews.bestComment,
      improve: reviews.improveComment,
      submittedAt: reviews.submittedAt,
      publicConsent: reviews.publicConsent,
      publishedAt: reviews.publishedAt,
      archivedAt: reviews.archivedAt,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .orderBy(desc(reviews.submittedAt));

  const pendingReviews = reviewRows.filter(
    (r) => r.publicConsent && !r.publishedAt && !r.archivedAt,
  );

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

  const pendingVerifications = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      docUrl: users.verificationDocUrl,
      submittedAt: users.verificationSubmittedAt,
    })
    .from(users)
    .where(
      and(
        eq(users.studentVerification, "pending"),
        isNotNull(users.verificationDocUrl),
      ),
    )
    .orderBy(desc(users.verificationSubmittedAt));

  // The matrícula photos live in a private store — sign a short-lived URL per
  // row so the inline preview/link actually loads.
  const pendingWithPreview = await Promise.all(
    pendingVerifications.map(async (v) => ({
      ...v,
      previewUrl: await signedMatriculaUrl(v.docUrl),
    })),
  );

  const cohortList = await listCohorts();
  const cohortById = new Map(
    cohortList.map((c): [string, Cohort] => [c.id, c]),
  );

  // Real stat-card figures — no placeholders. Seats come from the sum of
  // cohort capacities minus paid enrollments; completion rate is issued
  // certificates over paid enrollments. (Waitlist has no DB table — those
  // signups go straight to the ops inbox — so there is no card for it.)
  const enrolledByCohort = await enrollmentCountByCohort();
  const totalSeats = cohortList.reduce((s, c) => s + c.capacity, 0);
  const seatsTaken = [...enrolledByCohort.values()].reduce((s, n) => s + n, 0);
  const seatsRemaining = Math.max(0, totalSeats - seatsTaken);
  const completionRate =
    roster.length > 0 ? Math.round((certRows.length / roster.length) * 100) : 0;

  return (
    <>
      <SectionBanner
        photo="/photos/photo-chemo-hood.jpg"
        eyebrow="Cuenta maestra"
        title="Panel de administración"
      />

      {/* Real stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Inscritos" value={String(roster.length)} />
        <StatCard
          label="Cupos disponibles"
          value={totalSeats > 0 ? `${seatsRemaining} / ${totalSeats}` : "—"}
        />
        <StatCard label="Certificados" value={String(certRows.length)} />
        <StatCard label="Tasa de finalización" value={`${completionRate}%`} />
      </div>

      <div className="mt-6">
        <Link
          href="/portal/admin/cohortes"
          className="bg-teal-deep text-off-white hover:bg-teal focus-visible:ring-chartreuse font-heading inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
        >
          Gestionar cohortes →
        </Link>
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
            className="border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-off-white focus-visible:ring-chartreuse font-heading inline-flex h-9 items-center rounded-md border px-3 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
          >
            Exportar CSV ↓
          </a>
        </div>
        {roster.length === 0 ? (
          <p className="text-gray-700 mt-4 text-sm">Sin inscritos aún.</p>
        ) : (
          <table className="mt-4 w-full border-collapse text-left text-sm tabular-nums">
            <thead>
              <tr className="text-teal-deep/80 border-gray-300 border-b text-xs uppercase tracking-wide">
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
                <tr key={r.id} className="border-gray-300/60 border-b last:border-0">
                  <td className="py-2 pr-4 text-gray-900">{r.name ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <AdminEditEmail userId={r.id} email={r.email} />
                  </td>
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

      {/* Pending reviews — consent given but not yet published or archived */}
      {pendingReviews.length > 0 && (
        <section aria-labelledby="resenas-pendientes-heading" className="mt-12">
          <h2
            id="resenas-pendientes-heading"
            className="font-heading text-teal-deep text-xl font-semibold sm:text-2xl"
          >
            Reseñas pendientes ({pendingReviews.length})
          </h2>
          <p className="text-gray-700 mt-2 text-sm">
            Estas reseñas tienen consentimiento del estudiante. Apruébalas para mostrarlas en la
            landing, o archívalas si prefieres no publicarlas.
          </p>
          <ul className="mt-6 space-y-4">
            {pendingReviews.map((r) => (
              <li key={r.id}>
                <PendingCard
                  reviewId={r.id}
                  userName={r.userName}
                  overall={r.overall}
                  m1={r.m1}
                  m2={r.m2}
                  m3={r.m3}
                  best={r.best}
                  improve={r.improve}
                  submittedAt={r.submittedAt}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pending student verifications — matrícula uploaded, awaiting decision */}
      {pendingWithPreview.length > 0 && (
        <section aria-labelledby="verif-pendientes-heading" className="mt-12">
          <h2
            id="verif-pendientes-heading"
            className="font-heading text-teal-deep text-xl font-semibold sm:text-2xl"
          >
            Verificación de estudiantes ({pendingWithPreview.length})
          </h2>
          <p className="text-gray-700 mt-2 text-sm">
            Estos estudiantes subieron su matrícula. Aprueba para darles acceso,
            o rechaza para pedir otra foto. La imagen se elimina al decidir.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pendingWithPreview.map((v) => (
              <li
                key={v.id}
                className="border-gray-300 rounded-lg border bg-white p-5 shadow-sm"
              >
                <p className="font-heading text-teal-deep text-base font-semibold">
                  {v.name ?? "Estudiante"}
                </p>
                <p className="text-gray-700 text-xs">{v.email}</p>
                <p className="text-gray-700 mt-1 text-xs">
                  Subida: {fmtDate(v.submittedAt)}
                </p>
                {v.previewUrl && (
                  <a
                    href={v.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block"
                  >
                    {/* Image OR a PDF link, depending on the upload. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.previewUrl}
                      alt={`Matrícula de ${v.name ?? v.email}`}
                      className="border-gray-300 max-h-64 w-full rounded-md border object-contain"
                    />
                  </a>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <form action={approveStudentVerification.bind(null, v.id)}>
                    <button
                      type="submit"
                      className="bg-chartreuse text-teal-deep focus-visible:ring-chartreuse font-heading inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      Aprobar
                    </button>
                  </form>
                  <form action={rejectStudentVerification.bind(null, v.id)}>
                    <button
                      type="submit"
                      className="border-gray-300 text-gray-900 hover:bg-gray-100 focus-visible:ring-teal-deep font-heading inline-flex h-10 items-center rounded-md border bg-white px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      Rechazar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Reviews */}
      <GlassCard className="mt-8 overflow-x-auto p-6 sm:p-8">
        <h2 className="font-heading text-teal-deep text-lg font-semibold">
          Reseñas de estudiantes
        </h2>
        {reviewRows.length === 0 ? (
          <p className="text-gray-700 mt-4 text-sm">Sin reseñas aún.</p>
        ) : (
          <table className="mt-4 w-full border-collapse text-left text-sm tabular-nums">
            <thead>
              <tr className="text-teal-deep/80 border-gray-300 border-b text-xs uppercase tracking-wide">
                <th className="py-2 pr-4 font-semibold">Estudiante</th>
                <th className="py-2 pr-4 font-semibold">General</th>
                <th className="py-2 pr-4 font-semibold">M1 / M2 / M3</th>
                <th className="py-2 pr-4 font-semibold">Lo mejor</th>
                <th className="py-2 pr-4 font-semibold">A mejorar</th>
                <th className="py-2 pr-4 font-semibold">Fecha</th>
                <th scope="col" className="py-2 font-semibold">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {reviewRows.map((r, i) => (
                <tr key={i} className="border-gray-300/60 border-b align-top last:border-0">
                  <td className="py-2 pr-4 text-gray-900">
                    {r.userName ?? r.userEmail ?? "—"}
                  </td>
                  <td className="py-2 pr-4 text-gray-700">{r.overall}/5</td>
                  <td className="py-2 pr-4 text-gray-700">
                    {r.m1 ?? "—"} / {r.m2 ?? "—"} / {r.m3 ?? "—"}
                  </td>
                  <td className="py-2 pr-4 text-gray-700">{r.best ?? "—"}</td>
                  <td className="py-2 pr-4 text-gray-700">{r.improve ?? "—"}</td>
                  <td className="py-2 pr-4 text-gray-700">{fmtDate(r.submittedAt)}</td>
                  <td className="py-2 text-xs text-gray-700">
                    {r.publishedAt
                      ? "Publicada"
                      : r.archivedAt
                        ? "Archivada"
                        : r.publicConsent
                          ? "Pendiente"
                          : "Sin consentimiento"}
                  </td>
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
          <table className="mt-4 w-full border-collapse text-left text-sm tabular-nums">
            <thead>
              <tr className="text-teal-deep/80 border-gray-300 border-b text-xs uppercase tracking-wide">
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
    </>
  );
}

/** Glass metric tile for the admin overview row. */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="glass-card rounded-[18px] border border-white/40 p-5"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <p className="font-heading text-teal-deep/55 text-[11px] font-semibold tracking-[0.14em] uppercase">
        {label}
      </p>
      <p className="font-heading text-teal-deep mt-2 text-3xl font-bold tracking-[-0.01em]">
        {value}
      </p>
    </div>
  );
}

function PendingCard({
  reviewId,
  userName,
  overall,
  m1,
  m2,
  m3,
  best,
  improve,
  submittedAt,
}: {
  reviewId: string;
  userName: string | null;
  overall: number;
  m1: number | null;
  m2: number | null;
  m3: number | null;
  best: string | null;
  improve: string | null;
  submittedAt: Date;
}) {
  return (
    <article className="border-gray-300 rounded-lg border bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-heading text-teal-deep text-base font-semibold">
          {userName ?? "Estudiante"}
        </p>
        <p className="text-gray-700 text-xs">{fmtDate(submittedAt)}</p>
      </header>
      <p className="text-gray-900 mt-3 text-sm">
        General: <strong>{overall}/5</strong> · M1: {m1 ?? "—"}/5 · M2:{" "}
        {m2 ?? "—"}/5 · M3: {m3 ?? "—"}/5
      </p>
      {best && (
        <p className="text-gray-900 mt-3 text-sm leading-relaxed">
          <strong>Lo mejor:</strong> {best}
        </p>
      )}
      {improve && (
        <p className="text-gray-900 mt-2 text-sm leading-relaxed">
          <strong>Mejoraríamos:</strong> {improve}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <form action={approveReview.bind(null, reviewId)}>
          <button
            type="submit"
            className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift focus-visible:ring-chartreuse font-heading inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold ring-1 transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none motion-safe:hover:-translate-y-px"
          >
            Aprobar
          </button>
        </form>
        <form action={archiveReview.bind(null, reviewId)}>
          <button
            type="submit"
            className="border-gray-300 text-gray-900 hover:bg-gray-100 focus-visible:ring-teal-deep font-heading inline-flex h-10 items-center rounded-md border bg-white px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
          >
            Archivar
          </button>
        </form>
      </div>
    </article>
  );
}
