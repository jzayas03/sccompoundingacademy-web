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
