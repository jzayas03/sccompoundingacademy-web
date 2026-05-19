"use client";
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  COURSES,
  COHORTS,
  DEFAULT_TIER,
  formatPrice,
  getPricingByTier,
  type Cohort,
  type Course,
  type Tier,
} from "@/lib/courses";

type Props = {
  locale: "es" | "en";
  /** Course pre-selected via ?course=slug query param (optional). */
  preselectedCourseId?: string;
  /** Version stamp of the legal docs the user is accepting — typically the
   * "Last updated" date of the docs at form-render time. Forwarded to the
   * server so the audit trail records *which* version was accepted. */
  docsVersion: string;
};

/**
 * Inscription form — client component.
 *
 * Captures the full enrolment payload, validates it client-side (HTML5 +
 * the legal-acceptance gate), and POSTs to /api/inscripcion. On 200 it
 * redirects the browser to Stripe-hosted checkout; on error it surfaces
 * a sober message inline.
 *
 * Server-side Zod validation in the API route is the source of truth —
 * everything here is UX-only sugar.
 */
export function InscripcionForm({ locale, preselectedCourseId, docsVersion }: Props) {
  const t = useTranslations("inscripcion");
  const tCourses = useTranslations("cursosGrid.items");
  const tCohorts = useTranslations("cohortes");

  const [courseId, setCourseId] = useState<string>(
    preselectedCourseId && COURSES.some((c) => c.id === preselectedCourseId)
      ? preselectedCourseId
      : COURSES[0]!.id,
  );

  const availableCohorts = useMemo(
    () => COHORTS.filter((c) => c.courseId === courseId && c.openForEnrollment),
    [courseId],
  );
  const [cohorteId, setCohorteId] = useState<string>(availableCohorts[0]?.id ?? "");

  // When course changes, pick the first cohort of the new course.
  function onCourseChange(next: string) {
    setCourseId(next);
    const first = COHORTS.find((c) => c.courseId === next && c.openForEnrollment);
    setCohorteId(first?.id ?? "");
  }

  const [tier, setTier] = useState<Tier>(DEFAULT_TIER);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCourse: Course | undefined = COURSES.find((c) => c.id === courseId);
  const selectedCohort: Cohort | undefined = COHORTS.find((c) => c.id === cohorteId);
  const selectedPricing = selectedCourse
    ? getPricingByTier(selectedCourse, tier)
    : undefined;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      nombre: String(fd.get("nombre") ?? ""),
      email: String(fd.get("email") ?? ""),
      telefono: String(fd.get("telefono") ?? ""),
      licencia: String(fd.get("licencia") ?? ""),
      curso_id: courseId,
      cohorte_id: cohorteId,
      tier,
      notas: String(fd.get("notas") ?? ""),
      acepto_terminos: accepted,
      acepto_version_docs: docsVersion,
      locale,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/inscripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? t("errors.generic"));
        setSubmitting(false);
        return;
      }
      window.location.assign(json.url);
    } catch {
      setError(t("errors.network"));
      setSubmitting(false);
    }
  }

  const inputCls =
    "border-gray-300 focus-visible:border-teal-deep focus-visible:ring-teal-deep/20 mt-1.5 block w-full rounded-md border bg-white px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-700/60 focus-visible:outline-none focus-visible:ring-4";
  const labelCls = "font-heading text-teal-deep block text-sm font-semibold tracking-wide";

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-6">
      {/* Tier selector — 2 cards (Profesional default, Student discounted).
          Profesional covers RPh pharmacists + licensed pharmacy techs;
          Student is gated to non-licensed pharmacy students. Eligibility
          checks (institutional email match or owner-issued Stripe coupon)
          live in the portal Phase A; for the landing-page MVP we trust
          the client choice and capture it in Stripe session metadata so
          the webhook can persist it. */}
      <div>
        <p className={labelCls}>{t("fields.tier")}</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {selectedCourse?.pricing.map((p) => {
            const isActive = p.tier === tier;
            return (
              <button
                key={p.tier}
                type="button"
                onClick={() => setTier(p.tier)}
                aria-pressed={isActive}
                className={`group flex flex-col items-start rounded-md border bg-white p-4 text-left transition-colors ${
                  isActive
                    ? "border-teal-deep ring-teal-deep/30 ring-2"
                    : "border-gray-300 hover:border-teal-deep/60"
                }`}
              >
                <span className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
                  {t(`tiers.${p.tier}.label`)}
                </span>
                <span className="font-heading text-gray-900 mt-1 text-xl font-semibold">
                  {formatPrice(p.priceUsdCents)}
                  <span className="text-gray-700 ml-1 text-xs font-normal tracking-wide uppercase">USD</span>
                </span>
                <span className="text-gray-700 mt-1 text-xs leading-relaxed">
                  {t(`tiers.${p.tier}.note`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Course + cohort selectors */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>{t("fields.curso")}</span>
          <select
            name="curso_id"
            value={courseId}
            onChange={(e) => onCourseChange(e.target.value)}
            className={inputCls}
            required
          >
            {COURSES.map((c) => {
              const item = tCourses.raw(`${COURSES.indexOf(c)}.title`) as string;
              const defaultPrice = getPricingByTier(c, DEFAULT_TIER);
              return (
                <option key={c.id} value={c.id}>
                  {item}
                  {defaultPrice ? ` — ${formatPrice(defaultPrice.priceUsdCents)}` : ""}
                </option>
              );
            })}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>{t("fields.cohorte")}</span>
          <select
            name="cohorte_id"
            value={cohorteId}
            onChange={(e) => setCohorteId(e.target.value)}
            className={inputCls}
            required
            disabled={availableCohorts.length === 0}
          >
            {availableCohorts.length === 0 && <option value="">{t("noCohortsAvailable")}</option>}
            {availableCohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {tCohorts(`${c.i18nKey}.label`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Identity */}
      <label className="block">
        <span className={labelCls}>{t("fields.nombre")}</span>
        <input type="text" name="nombre" required autoComplete="name" className={inputCls} />
      </label>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>{t("fields.email")}</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            inputMode="email"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>{t("fields.telefono")}</span>
          <input
            type="tel"
            name="telefono"
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="787-555-0100"
            className={inputCls}
          />
        </label>
      </div>

      <label className="block">
        <span className={labelCls}>
          {t("fields.licencia")}{" "}
          <span className="text-gray-700 text-xs font-normal normal-case">({t("optional")})</span>
        </span>
        <input type="text" name="licencia" className={inputCls} maxLength={60} />
      </label>

      <label className="block">
        <span className={labelCls}>
          {t("fields.notas")}{" "}
          <span className="text-gray-700 text-xs font-normal normal-case">({t("optional")})</span>
        </span>
        <textarea name="notas" rows={3} maxLength={1000} className={inputCls} />
      </label>

      {/* Legal acceptance — required gate before payment */}
      <div className="border-gray-300 rounded-lg border bg-white p-4 sm:p-5">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-gray-900">
          <input
            type="checkbox"
            name="acepto_terminos"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            required
            className="mt-1 h-4 w-4 shrink-0 accent-teal-deep"
          />
          <span>
            {t.rich("acceptanceLabel", {
              terms: (chunks) => (
                <Link
                  href="/legal/terminos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-deep hover:text-teal underline underline-offset-2"
                >
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link
                  href="/legal/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-deep hover:text-teal underline underline-offset-2"
                >
                  {chunks}
                </Link>
              ),
              refund: (chunks) => (
                <Link
                  href="/legal/reembolso"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-deep hover:text-teal underline underline-offset-2"
                >
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
      </div>

      {/* Summary + submit */}
      <div className="border-gray-300 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-gray-700 text-sm">
          {selectedCourse && selectedCohort && selectedPricing && (
            <>
              {t("summary.total")}:{" "}
              <span className="text-gray-900 font-heading font-semibold">
                {formatPrice(selectedPricing.priceUsdCents)} USD
              </span>
              <span className="text-gray-700 ml-2 text-xs">
                ({t(`tiers.${tier}.label`)})
              </span>
            </>
          )}
        </p>
        <button
          type="submit"
          disabled={!accepted || submitting || !cohorteId}
          className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift focus-visible:ring-chartreuse font-heading inline-flex h-12 items-center justify-center rounded-md px-6 text-sm font-semibold ring-1 transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:px-7 sm:text-base motion-safe:hover:-translate-y-px"
        >
          {submitting ? t("submitting") : t("submit")}
        </button>
      </div>

      {error && (
        <p role="alert" className="border-gray-300 rounded-md border bg-white px-4 py-3 text-sm text-gray-900">
          {error}
        </p>
      )}
    </form>
  );
}
