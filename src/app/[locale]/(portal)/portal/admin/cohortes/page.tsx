import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { GlassCard } from "@/components/glass/GlassCard";
import { SectionBanner } from "@/components/portal/SectionBanner";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { AUDIENCE_LABELS } from "@/lib/cohorts/audience";
import { COURSES } from "@/lib/courses";
import {
  listCohorts,
  enrollmentCountByCohort,
  formatCohortLabel,
  type Cohort,
} from "@/lib/cohorts";
import {
  createCohortAction,
  updateCohortAction,
  deleteCohortAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Cohortes · SCCA Portal",
  robots: { index: false, follow: false },
};

/**
 * Owner-facing cohort management. Cohorts are the DB source of truth —
 * the owner creates and edits their dates here without a code change,
 * and the inscription form / marketing pages pick the changes up.
 *
 * ES-only, hard-coded copy — consistent with the rest of `/portal/admin`.
 */

const inputCls =
  "border-gray-300 focus-visible:border-teal-deep focus-visible:ring-teal-deep/20 mt-1.5 block w-full rounded-md border bg-white px-3 py-2.5 text-base text-gray-900 focus-visible:outline-none focus-visible:ring-4";
const labelCls =
  "font-heading text-teal-deep block text-sm font-semibold tracking-wide";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Shared date/capacity/name/open inputs for the create + edit forms. */
function CohortFieldset({ cohort }: { cohort?: Cohort }) {
  return (
    <>
      <input
        type="hidden"
        name="courseId"
        defaultValue={cohort?.courseId ?? COURSES[0]!.id}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>Fecha de inicio</span>
          <input
            type="date"
            name="startDate"
            required
            defaultValue={cohort ? isoDate(cohort.startDate) : ""}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Fecha de cierre</span>
          <input
            type="date"
            name="endDate"
            required
            defaultValue={cohort ? isoDate(cohort.endDate) : ""}
            className={inputCls}
          />
        </label>
      </div>
      <label className="block">
        <span className={labelCls}>Capacidad</span>
        <input
          type="number"
          name="capacity"
          required
          min={1}
          max={1000}
          defaultValue={cohort?.capacity ?? 12}
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className={labelCls}>Audiencia</span>
        <select
          name="audience"
          required
          defaultValue={cohort?.audience ?? "farmaceutico_tecnico"}
          className={inputCls}
        >
          {(["farmaceutico_tecnico", "otros_profesionales", "estudiante"] as const).map(
            (a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABELS[a].es}
              </option>
            ),
          )}
        </select>
      </label>
      <label className="block">
        <span className={labelCls}>
          Nombre interno{" "}
          <span className="text-gray-700 text-xs font-normal normal-case">
            (opcional — solo tú lo ves)
          </span>
        </span>
        <input
          type="text"
          name="name"
          maxLength={120}
          defaultValue={cohort?.name ?? ""}
          className={inputCls}
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-900">
        <input
          type="checkbox"
          name="openForEnrollment"
          defaultChecked={cohort ? cohort.openForEnrollment : true}
          className="h-4 w-4 accent-teal-deep"
        />
        Abierto para inscripción
      </label>
    </>
  );
}

const primaryBtn =
  "bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 font-heading inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-semibold ring-1 transition-colors";

export default async function CohortesAdminPage({
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

  const cohorts = await listCohorts();
  const counts = await enrollmentCountByCohort();

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-4 text-sm">
        <Link
          href="/portal/admin"
          className="text-teal-deep hover:text-teal underline underline-offset-2"
        >
          ← Volver al panel
        </Link>
      </p>

      <SectionBanner
        photo="/photos/photo-chemo-hood.jpg"
        eyebrow="Administración"
        title="Cohortes"
      />

      <p className="text-gray-700 -mt-2 mb-2 text-sm leading-relaxed">
        Crea y edita las fechas de los cohortes. La etiqueta que ven los
        estudiantes en el formulario de inscripción se genera sola a partir
        de las fechas — no hay nada que traducir.
      </p>

      {/* Create */}
      <GlassCard className="mt-10 p-6 sm:p-8">
        <h2 className="font-heading text-teal-deep text-lg font-semibold">
          Nuevo cohorte
        </h2>
        <form action={createCohortAction} className="mt-4 space-y-4">
          <CohortFieldset />
          <button type="submit" className={primaryBtn}>
            Crear cohorte
          </button>
        </form>
      </GlassCard>

      {/* Existing cohorts */}
      <div className="mt-8 space-y-6">
        {cohorts.length === 0 ? (
          <GlassCard className="p-6 sm:p-8">
            <p className="text-gray-700 text-sm">
              Aún no hay cohortes. Crea el primero arriba.
            </p>
          </GlassCard>
        ) : (
          cohorts.map((c) => {
            const enrolled = counts.get(c.id) ?? 0;
            return (
              <GlassCard key={c.id} className="p-6 sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-heading text-teal-deep text-lg font-semibold">
                    {formatCohortLabel(c, "es")}
                  </h3>
                  <p className="text-gray-700 text-xs">
                    {AUDIENCE_LABELS[c.audience].es} ·{" "}
                    {enrolled} / {c.capacity} inscrito{enrolled === 1 ? "" : "s"} ·{" "}
                    {c.openForEnrollment ? "Abierto" : "Cerrado"}
                  </p>
                </div>

                <form action={updateCohortAction} className="mt-4 space-y-4">
                  <input type="hidden" name="id" defaultValue={c.id} />
                  <CohortFieldset cohort={c} />
                  <button type="submit" className={primaryBtn}>
                    Guardar cambios
                  </button>
                </form>

                <form
                  action={deleteCohortAction}
                  className="border-gray-300/60 mt-4 border-t pt-4"
                >
                  <input type="hidden" name="id" defaultValue={c.id} />
                  <button
                    type="submit"
                    disabled={enrolled > 0}
                    className="border-gray-300 text-gray-700 hover:border-teal-deep hover:text-teal-deep font-heading inline-flex h-9 items-center rounded-md border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Eliminar cohorte
                  </button>
                  {enrolled > 0 && (
                    <span className="text-gray-700 ml-3 text-xs italic">
                      No se puede eliminar con inscritos — ciérralo en su lugar.
                    </span>
                  )}
                </form>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}
