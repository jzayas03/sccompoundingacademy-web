/* eslint-disable scca-brand/no-hex-literal -- email HTML needs inline hex
   colors; mail clients can't use the Tailwind brand tokens. Values mirror
   @/lib/brand (tealDeep #195561, chartreuse #E6EA82, grays). */

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
  /** Public Vercel Blob URL of the uploaded matrícula photo, if present. */
  docUrl: string | null;
  /** Signed one-click confirm links (open a confirmation page, no login). */
  approveUrl: string;
  rejectUrl: string;
}): { subject: string; text: string; html: string } {
  const subject = `Verificación pendiente · ${p.nombre || p.email}`;
  const text = `NUEVA MATRÍCULA PARA REVISAR

Estudiante: ${p.nombre || "(sin nombre)"}
Email:      ${p.email}

Aprobar:  ${p.approveUrl}
Rechazar: ${p.rejectUrl}

(O revisa en el panel: ${PORTAL_URL}/es/portal/admin)
`;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const photo = p.docUrl
    ? `<img src="${esc(p.docUrl)}" alt="Matrícula" style="max-width:100%;max-height:340px;border:1px solid #E0E0E0;border-radius:8px;margin:16px 0;" />`
    : `<p style="color:#666666;font-size:13px;">(Sin foto adjunta — revisa en el panel.)</p>`;
  const btn = (href: string, label: string, bg: string, fg: string) =>
    `<a href="${esc(href)}" style="display:inline-block;background:${bg};color:${fg};font-weight:600;text-decoration:none;padding:12px 22px;border-radius:8px;font-family:system-ui,sans-serif;font-size:15px;">${label}</a>`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#404040;max-width:520px;">
  <p style="font-weight:600;margin:0 0 4px;color:#195561;">Nueva matrícula para revisar</p>
  <p style="margin:0;color:#666666;">${esc(p.nombre || "(sin nombre)")}<br>${esc(p.email)}</p>
  ${photo}
  <p style="margin:0 0 14px;">
    ${btn(p.approveUrl, "✓ Aprobar", "#E6EA82", "#195561")}
    &nbsp;&nbsp;
    ${btn(p.rejectUrl, "✗ Rechazar", "#DC2626", "#FFFFFF")}
  </p>
  <p style="color:#666666;font-size:13px;margin:0;">Cada botón abre una página de confirmación; nada se aprueba con solo abrir el correo. También puedes revisar en el <a href="${PORTAL_URL}/es/portal/admin" style="color:#195561;">panel de administración</a>.</p>
</div>`;
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
