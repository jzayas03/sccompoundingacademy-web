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
import {
  listCohorts,
  enrollmentCountByCohort,
  formatCohortLabel,
  type Cohort,
} from "@/lib/cohorts";
import { professionLabel } from "@/lib/professions";
import { Link } from "@/i18n/routing";
import {
  effectiveAccessExpiresAt,
  isCourseAccessActive,
} from "@/lib/portal/course-access";
import {
  approveReview,
  archiveReview,
  approveStudentVerification,
  rejectStudentVerification,
  extendStudentAccess,
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
      accessExtendedUntil: users.accessExtendedUntil,
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

  const cohortList = await listCohorts();
  const cohortById = new Map(
    cohortList.map((c): [string, Cohort] => [c.id, c]),
  );
  // Single clock for the roster's per-student access-window status column.
  const now = new Date();

  // Real stat-card figures — no placeholders. "Cupos disponibles" mirrors
  // the public landing: only OPEN cohorts count, and seats taken are PAID
  // enrollees (via enrollmentCountByCohort) so the two never disagree.
  // Completion rate is issued certificates over paid enrollments. (Waitlist
  // has no DB table — those signups go straight to the ops inbox — so there
  // is no card for it.)
  const paidByCohort = await enrollmentCountByCohort();
  const openCohorts = cohortList.filter((c) => c.openForEnrollment);
  const totalSeats = openCohorts.reduce((s, c) => s + c.capacity, 0);
  const seatsTaken = openCohorts.reduce(
    (s, c) => s + (paidByCohort.get(c.id) ?? 0),
    0,
  );
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
                <th className="py-2 pr-4 font-semibold">Cohorte</th>
                <th className="py-2 font-semibold">Acceso al material</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r) => {
                const rowCohort = r.cohortId ? cohortById.get(r.cohortId) : undefined;
                const accessActive = isCourseAccessActive({
                  isOwner: false,
                  cohortEndDate: rowCohort?.endDate ?? null,
                  accessExtendedUntil: r.accessExtendedUntil,
                  now,
                });
                const accessEndsAt = effectiveAccessExpiresAt(
                  rowCohort?.endDate ?? null,
                  r.accessExtendedUntil,
                );
                return (
                <tr key={r.id} className="border-gray-300/60 border-b align-top last:border-0">
                  <td className="py-2 pr-4 text-gray-900">{r.name ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <AdminEditEmail userId={r.id} email={r.email} />
                  </td>
                  <td className="py-2 pr-4 text-gray-700">{professionLabel(r.professionalType) || "—"}</td>
                  <td className="py-2 pr-4 text-gray-700">{r.license ?? "—"}</td>
                  <td className="py-2 pr-4 text-gray-700">{r.phone ?? "—"}</td>
                  <td className="py-2 pr-4 text-gray-700">{r.tier ?? "—"}</td>
                  <td className="py-2 pr-4 text-gray-700">{fmtDate(r.paidAt)}</td>
                  <td className="py-2 pr-4 text-gray-700">{cohortLabel(r.cohortId, cohortById)}</td>
                  <td className="py-2">
                    <p className="text-xs">
                      {accessActive ? (
                        <span className="text-teal-deep font-semibold">
                          Activo{accessEndsAt ? ` · hasta ${fmtDate(accessEndsAt)}` : " · sin fecha"}
                        </span>
                      ) : (
                        <span className="text-gray-700">
                          Vencido{accessEndsAt ? ` ${fmtDate(accessEndsAt)}` : ""}
                        </span>
                      )}
                      {r.accessExtendedUntil ? (
                        <span className="text-gray-700"> · extendido</span>
                      ) : null}
                    </p>
                    <form action={extendStudentAccess} className="mt-1 flex flex-wrap items-center gap-1">
                      <input type="hidden" name="userId" value={r.id} />
                      <input
                        type="date"
                        name="until"
                        title="Extender el acceso al material hasta esta fecha. Vacío = quitar la extensión (vuelve a la ventana normal)."
                        defaultValue={
                          r.accessExtendedUntil
                            ? r.accessExtendedUntil.toISOString().slice(0, 10)
                            : ""
                        }
                        className="border-gray-300 rounded border bg-white px-1.5 py-0.5 text-xs text-gray-900"
                      />
                      <button
                        type="submit"
                        className="border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-off-white font-heading rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors"
                      >
                        Guardar
                      </button>
                    </form>
                  </td>
                </tr>
                );
              })}
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
      {pendingVerifications.length > 0 && (
        <section aria-labelledby="verif-pendientes-heading" className="mt-12">
          <h2
            id="verif-pendientes-heading"
            className="font-heading text-teal-deep text-xl font-semibold sm:text-2xl"
          >
            Verificación de estudiantes ({pendingVerifications.length})
          </h2>
          <p className="text-gray-700 mt-2 text-sm">
            Estos estudiantes subieron su matrícula. Aprueba para darles acceso,
            o rechaza para pedir otra foto. La imagen se elimina al decidir.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pendingVerifications.map((v) => (
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
                {v.docUrl && (
                  <>
                    {/* Served through the admin proxy, which converts iPhone
                        HEIC/HEIF → JPEG so it renders here and downloads
                        viewable (raw Blob URL would be an unopenable .heic). */}
                    <a
                      href={`/api/admin/matricula?u=${v.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/admin/matricula?u=${v.id}`}
                        alt={`Matrícula de ${v.name ?? v.email}`}
                        className="border-gray-300 max-h-64 w-full rounded-md border object-contain"
                      />
                    </a>
                    <a
                      href={`/api/admin/matricula?u=${v.id}&dl=1`}
                      className="text-teal-deep hover:text-teal mt-2 inline-block text-xs font-semibold underline underline-offset-2"
                    >
                      Descargar ↓
                    </a>
                  </>
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
