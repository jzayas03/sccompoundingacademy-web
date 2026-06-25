"use client";
import { useState, useMemo } from "react";
import { upload } from "@vercel/blob/client";
import Script from "next/script";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { COURSES, DEFAULT_TIER, type Tier } from "@/lib/courses";

// Cloudflare Turnstile public site key. When unset (local dev, or before
// the widget is provisioned) the widget is not rendered and the server
// skips verification — enrollment keeps working either way.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** One open cohort, with its label already formatted server-side in the
 * page's locale (cohort data lives in the DB — see `lib/cohorts.ts`). */
export type CohortOption = {
  id: string;
  courseId: string;
  label: string;
};

type Props = {
  locale: "es" | "en";
  /** Course pre-selected via ?course=slug query param (optional). */
  preselectedCourseId?: string;
  /** Tier pre-selected via ?tier= query param (optional). */
  preselectedTier?: Tier;
  /** Open cohorts fetched from the DB by the server page. */
  cohorts: CohortOption[];
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
export function InscripcionForm({
  locale,
  preselectedCourseId,
  preselectedTier,
  cohorts,
  docsVersion,
}: Props) {
  const t = useTranslations("inscripcion");
  const tCourses = useTranslations("cursosGrid.items");

  const [courseId, setCourseId] = useState<string>(
    preselectedCourseId && COURSES.some((c) => c.id === preselectedCourseId)
      ? preselectedCourseId
      : COURSES[0]!.id,
  );

  const availableCohorts = useMemo(
    () => cohorts.filter((c) => c.courseId === courseId),
    [courseId, cohorts],
  );
  const [cohorteId, setCohorteId] = useState<string>(availableCohorts[0]?.id ?? "");

  // When course changes, pick the first cohort of the new course.
  function onCourseChange(next: string) {
    setCourseId(next);
    const first = cohorts.find((c) => c.courseId === next);
    setCohorteId(first?.id ?? "");
  }

  const [tier, setTier] = useState<Tier>(
    preselectedTier === "profesional" || preselectedTier === "student"
      ? preselectedTier
      : DEFAULT_TIER,
  );
  // Profession — captured for the profesional tier. Farmacéutico/Técnico
  // feed the ACPE registry; "otro" lets non-pharmacy professionals
  // self-identify without changing the price (they stay on the $2,500
  // profesional tier — the $495 student price is students-only).
  const [tipoProfesional, setTipoProfesional] = useState<
    "farmaceutico" | "tecnico" | "otro" | ""
  >("");
  // When tipoProfesional === "otro": `otraProfesion` is a code from the
  // `otrasProfesiones` list, or "otro" → the free text in `otraProfesionTexto`.
  const [otraProfesion, setOtraProfesion] = useState<string>("");
  const [otraProfesionTexto, setOtraProfesionTexto] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Student tier only: the matrícula photo is uploaded to Blob on submit,
  // before checkout, and its URL gates the discounted price server-side.
  const [matriculaFile, setMatriculaFile] = useState<File | null>(null);

  const selectedCourse = COURSES.find((c) => c.id === courseId);

  // Profession value sent to the server: a known code (farmaceutico /
  // tecnico / medico / …) or the free text typed under "Otro". Empty for
  // the student tier (not asked) or until a choice is made.
  const profesion =
    tier !== "profesional"
      ? ""
      : tipoProfesional === "farmaceutico" || tipoProfesional === "tecnico"
        ? tipoProfesional
        : tipoProfesional === "otro"
          ? otraProfesion === "otro"
            ? otraProfesionTexto.trim()
            : otraProfesion
          : "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    // Student tier requires the matrícula photo before checkout.
    if (tier === "student" && !matriculaFile) {
      setError(t("matricula.required"));
      return;
    }

    const fd = new FormData(e.currentTarget);
    setSubmitting(true);

    // Upload the matrícula to Blob first; its URL travels with the payload
    // and is re-validated server-side before checkout.
    let matriculaDocUrl = "";
    if (tier === "student" && matriculaFile) {
      try {
        const blob = await upload(matriculaFile.name, matriculaFile, {
          access: "public",
          handleUploadUrl: "/api/inscripcion/matricula-upload",
        });
        matriculaDocUrl = blob.url;
      } catch {
        setError(t("matricula.uploadError"));
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      nombre: String(fd.get("nombre") ?? ""),
      email: String(fd.get("email") ?? ""),
      telefono: String(fd.get("telefono") ?? ""),
      licencia: String(fd.get("licencia") ?? ""),
      curso_id: courseId,
      cohorte_id: cohorteId,
      tier,
      matricula_doc_url: matriculaDocUrl,
      tipo_profesional: profesion,
      notas: String(fd.get("notas") ?? ""),
      acepto_terminos: accepted,
      acepto_version_docs: docsVersion,
      locale,
      // Cloudflare Turnstile injects this hidden field into the form once
      // the challenge is solved. Empty when Turnstile isn't configured.
      turnstile_token: String(fd.get("cf-turnstile-response") ?? ""),
    };

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
                <span className="text-gray-700 mt-2 text-xs leading-relaxed">
                  {t(`tiers.${p.tier}.note`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Matrícula upload — only for the student tier. Required before
          checkout; gates the discounted price on a document the owner
          reviews and approves via the emailed link. */}
      {tier === "student" && (
        <div>
          <label className={labelCls} htmlFor="matricula">
            {t("matricula.label")}
          </label>
          <input
            id="matricula"
            type="file"
            accept="image/jpeg,image/png,image/heic,image/webp,application/pdf"
            required
            onChange={(e) => setMatriculaFile(e.target.files?.[0] ?? null)}
            className="border-gray-300 file:bg-teal-deep file:text-off-white hover:file:bg-teal mt-1.5 block w-full rounded-md border bg-white px-3 py-2.5 text-base text-gray-900 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:px-3 file:py-1.5 file:text-sm file:font-semibold"
          />
          <p className="text-gray-700 mt-1.5 text-xs leading-relaxed">
            {t("matricula.hint")}
          </p>
        </div>
      )}

      {/* Profession — only for the profesional tier. Farmacéutico/Técnico
          feed the ACPE "Registro de Educación Continua"; "Otro" lets
          non-pharmacy professionals self-identify. All stay on the
          profesional ($2,350) tier — it does not unlock the student price. */}
      {tier === "profesional" && (
        <div>
          <p className={labelCls}>{t("fields.tipoProfesional")}</p>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["farmaceutico", "tecnico", "otro"] as const).map((tp) => {
              const isActive = tipoProfesional === tp;
              return (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setTipoProfesional(tp)}
                  aria-pressed={isActive}
                  className={`font-heading text-teal-deep flex items-center rounded-md border bg-white p-4 text-left text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-teal-deep ring-teal-deep/30 ring-2"
                      : "border-gray-300 hover:border-teal-deep/60"
                  }`}
                >
                  {t(`tiposProfesional.${tp}`)}
                </button>
              );
            })}
          </div>

          {tipoProfesional === "otro" && (
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>{t("fields.otraProfesion")}</span>
                <select
                  value={otraProfesion}
                  onChange={(e) => setOtraProfesion(e.target.value)}
                  className={inputCls}
                >
                  <option value="" disabled>
                    —
                  </option>
                  {(["medico", "enfermero", "dentista", "otro"] as const).map((op) => (
                    <option key={op} value={op}>
                      {t(`otrasProfesiones.${op}`)}
                    </option>
                  ))}
                </select>
              </label>
              {otraProfesion === "otro" && (
                <label className="block">
                  <span className={labelCls}>{t("fields.otraProfesionTexto")}</span>
                  <input
                    type="text"
                    value={otraProfesionTexto}
                    onChange={(e) => setOtraProfesionTexto(e.target.value)}
                    maxLength={80}
                    className={inputCls}
                  />
                </label>
              )}
            </div>
          )}
        </div>
      )}

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
              return (
                <option key={c.id} value={c.id}>
                  {item}
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
                {c.label}
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

      {/* Cloudflare Turnstile (CAPTCHA) — invisible/managed challenge that
          blocks automated submissions before a Stripe Checkout Session is
          created. Rendered only when the public site key is configured;
          the script injects a hidden `cf-turnstile-response` input into the
          form, which onSubmit forwards to the server for verification. */}
      {TURNSTILE_SITE_KEY && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            async
            defer
          />
          <div
            className="cf-turnstile"
            data-sitekey={TURNSTILE_SITE_KEY}
            data-theme="light"
            data-language={locale}
          />
        </>
      )}

      {/* Submit — final price is rendered by Stripe Checkout, not in our UI. */}
      <div className="border-gray-300 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="submit"
          disabled={
            !accepted ||
            submitting ||
            !cohorteId ||
            (tier === "profesional" && !profesion)
          }
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
