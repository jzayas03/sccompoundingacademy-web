import { z } from "zod";

/**
 * Enrollment form request-body schema — extracted from
 * `src/app/api/inscripcion/route.ts` so it can be unit-tested without
 * pulling in the route's server-only deps (`db`, `stripe`) at module load.
 *
 * The `.superRefine` below enforces that a `profesional`-tier submission
 * carries a non-empty `tipo_profesional`. CE eligibility keys on that field
 * being `farmaceutico`/`tecnico` — a pharmacist who pays without recording
 * their profession would otherwise silently fall to a no-CE completion
 * cert. New enrollments only; this does not touch existing rows.
 */
export const inscripcionSchema = z
  .object({
    nombre: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    telefono: z.string().trim().min(7).max(40),
    licencia: z.string().trim().max(60).optional().or(z.literal("")),
    curso_id: z.string().trim().min(1),
    cohorte_id: z.string().trim().min(1),
    tier: z.enum(["profesional", "student"]),
    // Public Blob URL of the student's matrícula photo, uploaded before
    // checkout. Required for the student tier (enforced in the handler);
    // empty/absent for profesional.
    matricula_doc_url: z.string().trim().max(512).optional().or(z.literal("")),
    // Profession captured for the profesional tier — "farmaceutico" /
    // "tecnico" (ACPE registry), a profession code (medico/…), or the free
    // text typed under "Otro". Free-form string; empty for the student tier.
    tipo_profesional: z.string().trim().max(80).optional().or(z.literal("")),
    notas: z.string().trim().max(1000).optional().or(z.literal("")),
    acepto_terminos: z.literal(true, {
      errorMap: () => ({ message: "Debes aceptar los Términos, Privacidad y Reembolsos." }),
    }),
    acepto_version_docs: z.string().trim().min(1),
    locale: z.enum(["es", "en"]),
    // Cloudflare Turnstile token from the browser widget. Optional in the
    // schema so the form keeps working before Turnstile is wired up; when
    // TURNSTILE_SECRET_KEY is configured, `verifyTurnstile` rejects a missing
    // or invalid token below.
    turnstile_token: z.string().trim().max(2048).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.tier === "profesional" && !(data.tipo_profesional ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tipo_profesional"],
        message: "Selecciona tu profesión para la inscripción profesional.",
      });
    }
  });

export type InscripcionInput = z.infer<typeof inscripcionSchema>;

/**
 * Friendly, field-aware message for a validation failure. The form is
 * `noValidate` (browser checks disabled), so the server is the sole validator —
 * a single generic sentence would leave the user guessing which field is wrong.
 * This names the first user-fixable field instead; fields the user cannot fix
 * (set programmatically) fall back to the generic sentence.
 */
const FIELD_MESSAGES: Record<string, { es: string; en: string }> = {
  nombre: {
    es: "Escribe tu nombre completo (mínimo 2 caracteres).",
    en: "Enter your full name (at least 2 characters).",
  },
  email: {
    es: "El correo electrónico no tiene un formato válido.",
    en: "The email address is not valid.",
  },
  telefono: {
    es: "El teléfono debe tener al menos 7 dígitos.",
    en: "The phone number must have at least 7 digits.",
  },
  tipo_profesional: {
    es: "Selecciona tu profesión para la inscripción profesional.",
    en: "Select your profession to continue.",
  },
  acepto_terminos: {
    es: "Debes aceptar los Términos, la Privacidad y los Reembolsos.",
    en: "You must accept the Terms, Privacy and Refund policies.",
  },
  curso_id: {
    es: "Selecciona un curso válido.",
    en: "Select a valid course.",
  },
  cohorte_id: {
    es: "Selecciona una cohorte disponible.",
    en: "Select an available cohort.",
  },
};

const GENERIC_MESSAGE = {
  es: "Revisa los datos del formulario — hay un campo incompleto o con formato inválido (por ejemplo el correo electrónico).",
  en: "Please review the form — a field is incomplete or has an invalid format (for example the email address).",
} as const;

export function inscripcionErrorMessage(
  flattened: { fieldErrors: Record<string, string[] | undefined> },
  locale: "es" | "en",
): string {
  const failing = Object.keys(flattened.fieldErrors).find(
    (field) => (flattened.fieldErrors[field]?.length ?? 0) > 0,
  );
  if (failing && FIELD_MESSAGES[failing]) {
    return FIELD_MESSAGES[failing][locale];
  }
  return GENERIC_MESSAGE[locale];
}
