/**
 * Airtable client helper.
 *
 * We don't use the official @airtable/airtable SDK — its bundle is large
 * and we only need a single POST. The REST API is well-documented at
 * https://airtable.com/developers/web/api/create-records.
 *
 * Env vars (set in Vercel dashboard once owner provisions Airtable):
 *   AIRTABLE_TOKEN      — Personal Access Token with data.records:write
 *                         scope on the SCCA base
 *   AIRTABLE_BASE_ID    — appXXXXXXXXXXXXXX (from base API docs URL)
 *
 * Graceful degradation: if env vars are missing, calls log a warning and
 * return null instead of throwing. The webhook handler keeps going so the
 * student still gets their confirmation email — losing an Airtable insert
 * is much better than losing a confirmed payment record. The owner sees
 * the warning in Vercel logs and can fix it without code changes.
 */

export type InscripcionRecord = {
  // Identity
  nombre: string;
  email: string;
  telefono: string;
  licencia?: string;
  // Course
  curso_id: string;
  cohorte_id: string;
  /** Pricing tier the student paid under — needed for downstream
   * reconciliation between Stripe Price IDs and the portal's `users.tier`. */
  tier: "profesional" | "student";
  // Payment
  stripe_session_id: string;
  stripe_payment_intent: string;
  monto_pagado_usd_cents: number;
  estado: "pagado" | "reembolsado" | "cancelado";
  // Audit trail of legal acceptance (required for E-SIGN/UETA defensibility)
  acepto_terminos: boolean;
  acepto_timestamp: string;
  acepto_ip: string;
  acepto_user_agent: string;
  acepto_version_docs: string;
  // Free-form
  notas?: string;
  // Locale captured at form submit (for follow-up emails)
  locale: "es" | "en";
};

const AIRTABLE_API = "https://api.airtable.com/v0";
const TABLE_INSCRIPCIONES = "Inscripciones";

export async function recordInscripcion(record: InscripcionRecord): Promise<unknown | null> {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) {
    console.warn(
      "[airtable] AIRTABLE_TOKEN or AIRTABLE_BASE_ID missing — skipping persistence. " +
        "Set both in Vercel env vars to enable enrollment registry.",
    );
    return null;
  }
  const url = `${AIRTABLE_API}/${baseId}/${encodeURIComponent(TABLE_INSCRIPCIONES)}`;
  // Airtable column names mirror our TS field names verbatim — owner sets
  // up the base accordingly (see plan Track 5 step 1 for schema).
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      records: [{ fields: record }],
      typecast: true, // forgiving: lets Airtable coerce e.g. string → date
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[airtable] insert failed: HTTP ${res.status} ${body}`);
    return null;
  }
  return res.json();
}
