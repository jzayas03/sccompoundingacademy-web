/* eslint-disable scca-brand/no-hex-literal -- email HTML needs inline hex
   colors; mail clients can't use the Tailwind brand tokens. Values mirror
   @/lib/brand (tealDeep #195561, chartreuse #E6EA82, grays). */

import { E, FONT, bodyCell, renderEmail, esc } from "./_shell";

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
  /** When the student submitted — rendered as the review date. */
  submittedAt?: Date;
}): { subject: string; text: string; html: string } {
  // Recipient is the Spanish-speaking owner/ops inbox, so this stays ES-only
  // (unlike the student-facing templates). Restyled to the SCCA email shell,
  // keeping the matrícula photo — the actual thing the reviewer inspects.
  const subject = `Verificación pendiente · ${p.nombre || p.email}`;
  const fecha = p.submittedAt
    ? new Intl.DateTimeFormat("es-PR", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "America/Puerto_Rico",
      }).format(p.submittedAt)
    : null;
  const text = `NUEVA MATRÍCULA PARA REVISAR

Estudiante: ${p.nombre || "(sin nombre)"}
Email:      ${p.email}${fecha ? `\nFecha:      ${fecha}` : ""}

Aprobar:  ${p.approveUrl}
Rechazar: ${p.rejectUrl}

(O revisa en el panel: ${PORTAL_URL}/es/portal/admin)
`;

  const photo = p.docUrl
    ? `<img src="${esc(p.docUrl)}" alt="Matrícula" style="display:block;margin:0 auto 24px;max-width:100%;max-height:360px;border:1px solid ${E.cardLine};border-radius:8px;" />`
    : `<p style="margin:0 0 24px;font-family:${FONT};font-size:13px;color:${E.muted};text-align:center;">(Sin foto adjunta — revisa en el panel.)</p>`;

  const inner = `
    <p style="margin:0 auto 26px;max-width:420px;font-family:${FONT};font-size:15px;color:${E.bodyText};line-height:1.75;text-align:center;">
      Se recibió una nueva solicitud de matrícula. Revisa los datos del estudiante y toma una acción.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${E.tint};border-radius:10px;overflow:hidden;border:1px solid ${E.tintLine};border-left:4px solid ${E.teal};margin-bottom:24px;">
      <tr>
        <td style="padding:22px 26px;text-align:center;${fecha ? `border-bottom:1px solid ${E.tintLine};` : ""}">
          <p style="margin:0;font-family:${FONT};font-size:17px;font-weight:700;color:${E.ink};">${esc(p.nombre || "(sin nombre)")}</p>
          <p style="margin:5px 0 0;font-family:${FONT};font-size:13px;color:${E.muted};">${esc(p.email)}</p>
        </td>
      </tr>
      ${fecha
        ? `<tr>
             <td style="padding:16px 26px;text-align:center;">
               <p style="margin:0 0 4px;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:${E.teal};">Fecha de solicitud</p>
               <p style="margin:0;font-family:${FONT};font-size:14px;color:${E.ink};">${esc(fecha)}</p>
             </td>
           </tr>`
        : ""}
    </table>

    ${photo}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 16px;">
      <tr>
        <td style="padding-right:12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="background:${E.teal};border-radius:8px;">
              <a href="${esc(p.approveUrl)}" style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:14px;font-weight:600;color:${E.white};text-decoration:none;">✓ Aprobar</a>
            </td>
          </tr></table>
        </td>
        <td>
          <a href="${esc(p.rejectUrl)}" style="display:inline-block;padding:12px 28px;background:${E.white};border:1px solid ${E.rejectLine};border-radius:8px;font-family:${FONT};font-size:14px;font-weight:600;color:${E.rejectText};text-decoration:none;">✗ Rechazar</a>
        </td>
      </tr>
    </table>

    <p style="margin:0 auto 12px;max-width:420px;font-family:${FONT};font-size:12px;color:${E.muted};line-height:1.65;text-align:center;">
      Cada botón abre una página de confirmación; nada se aprueba con solo abrir el correo.
    </p>
    <p style="margin:0;text-align:center;">
      <a href="${PORTAL_URL}/es/portal/admin" style="font-family:${FONT};font-size:13px;font-weight:700;color:${E.teal};text-decoration:none;">Revisar en el panel de administración →</a>
    </p>
  `;

  const html = renderEmail({
    locale: "es",
    title: subject,
    eyebrow: "Revisión pendiente",
    headline: "Nueva matrícula",
    content: bodyCell(inner, "38px 44px 34px"),
  });
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

/**
 * Sent to the student when the owner APPROVES a pre-payment matrícula. Carries
 * the signed 48-hour "Pagar ahora" link. (The already-paid approval path keeps
 * using buildVerificationApprovedEmail.)
 */
export function buildCheckoutLinkEmail(
  locale: Locale,
  payUrl: string,
): { subject: string; text: string; html: string } {
  const es = {
    subject: "Matrícula aprobada — completa tu pago · SCCA",
    body: `¡Tu matrícula fue aprobada! Completa tu inscripción con el pago seguro.\n\nEste enlace vence en 48 horas:\n${payUrl}`,
  };
  const en = {
    subject: "Matrícula approved — complete your payment · SCCA",
    body: `Your matrícula was approved! Complete your enrollment with secure payment.\n\nThis link expires in 48 hours:\n${payUrl}`,
  };
  const c = locale === "en" ? en : es;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const label = locale === "en" ? "Pay now" : "Pagar ahora";
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#404040;max-width:520px;">
  <p>${esc(c.body.split("\n")[0] ?? "")}</p>
  <p style="margin:18px 0;">
    <a href="${esc(payUrl)}" style="display:inline-block;background:#E6EA82;color:#195561;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px;">${label}</a>
  </p>
  <p style="color:#666666;font-size:13px;">${locale === "en" ? "This link expires in 48 hours." : "Este enlace vence en 48 horas."}</p>
</div>`;
  return { subject: c.subject, text: c.body, html };
}
