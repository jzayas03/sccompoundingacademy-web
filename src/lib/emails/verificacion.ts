/**
 * Emails for the matrícula verification flow. One internal notification to
 * the ops inbox when a student submits, and two student-facing notes for the
 * owner's approve / reject decisions. Bilingual (es/en) by the `locale` arg.
 */
type Locale = "es" | "en";

const PORTAL_URL = "https://sccompoundingacademy.com";

export function buildVerificationSubmittedEmail(p: {
  nombre: string;
  email: string;
}): { subject: string; text: string; html: string } {
  const subject = `Verificación pendiente · ${p.nombre || p.email}`;
  const text = `NUEVA MATRÍCULA PARA REVISAR

Estudiante: ${p.nombre || "(sin nombre)"}
Email:      ${p.email}

Revisa y aprueba/rechaza en el panel:
${PORTAL_URL}/es/portal/admin
`;
  const html = `<pre style="font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.5;">${text.replace(/</g, "&lt;")}</pre>`;
  return { subject, text, html };
}

export function buildVerificationApprovedEmail(
  locale: Locale,
): { subject: string; text: string; html: string } {
  const es = {
    subject: "Verificación aprobada · SCCA",
    body: `Tu matrícula fue verificada. Ya tienes acceso completo al portal del curso.\n\nEntra aquí: ${PORTAL_URL}/es/portal`,
  };
  const en = {
    subject: "Verification approved · SCCA",
    body: `Your student ID was verified. You now have full access to the course portal.\n\nSign in here: ${PORTAL_URL}/en/portal`,
  };
  const c = locale === "en" ? en : es;
  const html = `<p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;">${c.body.replace(/\n/g, "<br>")}</p>`;
  return { subject: c.subject, text: c.body, html };
}

export function buildVerificationRejectedEmail(
  locale: Locale,
): { subject: string; text: string; html: string } {
  const es = {
    subject: "No pudimos verificar tu matrícula · SCCA",
    body: `No pudimos verificar la foto de matrícula que subiste. Por favor sube una foto clara y vigente desde el portal.\n\nSubir de nuevo: ${PORTAL_URL}/es/portal/verificacion`,
  };
  const en = {
    subject: "We couldn't verify your student ID · SCCA",
    body: `We couldn't verify the student-ID photo you uploaded. Please upload a clear, current photo from the portal.\n\nUpload again: ${PORTAL_URL}/en/portal/verificacion`,
  };
  const c = locale === "en" ? en : es;
  const html = `<p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;">${c.body.replace(/\n/g, "<br>")}</p>`;
  return { subject: c.subject, text: c.body, html };
}
