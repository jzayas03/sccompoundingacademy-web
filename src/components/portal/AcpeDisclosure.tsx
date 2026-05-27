import { GlassCard } from "@/components/glass/GlassCard";

/**
 * ACPE Standard 3.C — learner-facing financial-relationships disclosure.
 *
 * Rendered persistently on the student dashboard above any module
 * content so the disclosure is in front of the learner *before* they
 * engage with the activity. Text is driven by env vars so the owner
 * can update wording (e.g., when a new cohort adds a faculty member
 * with a relationship) without a code change.
 *
 * Defaults reflect the current state confirmed with the owner on
 * 2026-05-24: no faculty or planner has relevant financial
 * relationships to disclose.
 *
 * The ACPE standards reference ("ACPE Standards for Integrity and
 * Independence, Standard 3") is the official English title and stays
 * English in both locales; only the surrounding compliance prefix
 * ("Conforme con" / "Complies with") swaps by locale.
 *
 * **Server-only**: reads `process.env.ACPE_DISCLOSURE_*` directly. The
 * env vars are not `NEXT_PUBLIC_`-prefixed, so this component must
 * never be imported into a `"use client"` subtree — the values would
 * resolve to `undefined` in the browser bundle and the defaults would
 * silently take over.
 */
const DEFAULTS = {
  es: {
    heading: "Divulgación de relaciones financieras",
    body: "El Lcdo. Jorge L. Reyes Quiñones, RPh, FACA, FACVP — instructor de esta actividad de educación continua — no tiene relaciones financieras relevantes con compañías inelegibles que reportar. Ningún miembro del equipo de planificación de esta actividad tiene relaciones financieras relevantes que reportar.",
    compliancePrefix: "Conforme con",
  },
  en: {
    heading: "Financial relationships disclosure",
    body: "Jorge L. Reyes Quiñones, RPh, FACA, FACVP — instructor for this continuing education activity — has no relevant financial relationships with ineligible companies to disclose. No member of the planning team for this activity has relevant financial relationships to disclose.",
    compliancePrefix: "Complies with",
  },
} as const;

export function AcpeDisclosure({ locale }: { locale: "es" | "en" }) {
  const d = DEFAULTS[locale];
  const headingEnv =
    locale === "en"
      ? process.env.ACPE_DISCLOSURE_HEADING_EN
      : process.env.ACPE_DISCLOSURE_HEADING_ES;
  const bodyEnv =
    locale === "en"
      ? process.env.ACPE_DISCLOSURE_BODY_EN
      : process.env.ACPE_DISCLOSURE_BODY_ES;
  const heading = headingEnv?.trim() || d.heading;
  const body = bodyEnv?.trim() || d.body;
  return (
    <GlassCard interactive={false} className="mt-8 p-6 sm:p-7">
      <h2 className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
        {heading}
      </h2>
      <p className="text-gray-900 mt-3 text-sm leading-relaxed">{body}</p>
      <p className="text-gray-700 mt-4 text-xs leading-relaxed">
        {d.compliancePrefix} ACPE Standards for Integrity and Independence,
        Standard 3.
      </p>
    </GlassCard>
  );
}
