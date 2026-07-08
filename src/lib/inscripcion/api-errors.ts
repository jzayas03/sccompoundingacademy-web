/**
 * Locale-aware error copy for /api/inscripcion.
 *
 * The form is `noValidate` and renders `json.error` verbatim, so the server
 * owns ALL user-facing error copy. The ES strings are verbatim the route's
 * historical literals (zero copy change for Spanish users); EN is a faithful
 * translation. Same pattern as `inscripcionErrorMessage` (field validation)
 * and `audienceMismatchMessage` (audience gate).
 */
export type InscripcionApiErrorCode =
  | "rate-limited"
  | "turnstile"
  | "invalid-cohort"
  | "cohort-closed"
  | "matricula-required"
  | "already-enrolled"
  | "register-failed"
  | "invalid-tier"
  | "price-missing"
  | "cohort-full"
  | "checkout-no-url"
  | "checkout-failed";

const MESSAGES: Record<InscripcionApiErrorCode, { es: string; en: string }> = {
  "rate-limited": {
    es: "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
    en: "Too many attempts. Please wait a moment and try again.",
  },
  turnstile: {
    es: "No pudimos verificar que eres una persona. Recarga la página e inténtalo de nuevo.",
    en: "We couldn't verify you're a person. Reload the page and try again.",
  },
  "invalid-cohort": {
    es: "Curso o cohorte inválido.",
    en: "Invalid course or cohort.",
  },
  "cohort-closed": {
    es: "Cohorte cerrada para inscripciones.",
    en: "This cohort is closed for enrollment.",
  },
  "matricula-required": {
    es: "Sube una foto de tu matrícula activa para inscribirte como estudiante.",
    en: "Upload a photo of your active enrollment document to register as a student.",
  },
  "already-enrolled": {
    es: "Ya tienes una inscripción registrada con este correo. Escríbenos si necesitas ayuda.",
    en: "There is already a registration under this email. Contact us if you need help.",
  },
  "register-failed": {
    es: "No pudimos registrar tu matrícula. Intenta nuevamente o escríbenos.",
    en: "We couldn't register your enrollment. Try again or contact us.",
  },
  "invalid-tier": {
    es: "Tier de precio inválido.",
    en: "Invalid pricing tier.",
  },
  "price-missing": {
    es: "Servicio de cobro no configurado. Por favor escríbenos.",
    en: "Payment service is not configured. Please contact us.",
  },
  "cohort-full": {
    es: "Este cohorte ya está lleno. Escríbenos y te avisamos del próximo cupo disponible.",
    en: "This cohort is full. Contact us and we'll let you know when a seat opens.",
  },
  "checkout-no-url": {
    es: "Stripe no devolvió URL de checkout.",
    en: "Stripe did not return a checkout URL.",
  },
  "checkout-failed": {
    es: "No se pudo iniciar el cobro. Intenta nuevamente o escríbenos.",
    en: "We couldn't start the payment. Try again or contact us.",
  },
};

export function inscripcionApiError(
  code: InscripcionApiErrorCode,
  locale: "es" | "en",
): string {
  return MESSAGES[code][locale];
}
