import { E, FONT, button, bodyCell, renderEmail, esc } from "./_shell";

/**
 * Confirmation email sent to the newly-enrolled student after payment.
 *
 * Restyled to the SCCA Design System email shell (`_shell.ts`) — pale-teal
 * hero, tinted cohort-detail card, and (kept from the live email) the
 * day-one logistics: campus, hours, what-to-bring, PPE note, and the
 * Stripe receipt link. Adds a portal CTA per the handoff. Hand-written
 * table HTML, inline styles only.
 */
type ConfirmationParams = {
  nombre: string;
  cursoTitulo: string;
  cohorteEtiqueta: string;
  cohorteFechaInicio: string; // e.g. "12 de enero de 2026"
  cohorteFechaFin: string;
  montoFormatted: string; // e.g. "$1,000"
  receiptUrl?: string; // Stripe-hosted receipt URL
  locale: "es" | "en";
};

const SEDE = "73 Santa Cruz Medical Building, Suite 201, Bayamón, PR 00961";
const HORARIO = "Lunes a Viernes · 7:30 a.m. – 5:00 p.m.";
const SUPPORT_EMAIL = "info@sccompoundingacademy.com";

export function buildConfirmationEmail(p: ConfirmationParams): {
  subject: string;
  html: string;
  text: string;
} {
  const es = p.locale === "es";
  const subject = es
    ? `Confirmación de inscripción · ${p.cursoTitulo}`
    : `Enrollment confirmation · ${p.cursoTitulo}`;

  const portalUrl = `https://sccompoundingacademy.com/${p.locale}/portal`;

  const text = es
    ? `Hola ${p.nombre},

Gracias por inscribirte en ${p.cursoTitulo}. Tu cupo está confirmado.

  Cohorte: ${p.cohorteEtiqueta}
  Inicio:  ${p.cohorteFechaInicio}
  Cierre:  ${p.cohorteFechaFin}
  Monto:   ${p.montoFormatted}

Sede: ${SEDE}
Horario administrativo: ${HORARIO}

Qué traer al primer día:
  - Identificación con foto
  - Bolígrafo y libreta
  - Computadora portátil

El equipo de protección personal (PPE) se provee en las facilidades — no necesitas traer bata blanca.

Portal del estudiante: ${portalUrl}
${p.receiptUrl ? `Recibo de pago: ${p.receiptUrl}\n` : ""}
Cualquier pregunta antes del inicio, escríbenos a ${SUPPORT_EMAIL}.

Santa Cruz Compounding Academy, LLC
Bayamón, Puerto Rico
`
    : `Hi ${p.nombre},

Thank you for enrolling in ${p.cursoTitulo}. Your seat is confirmed.

  Cohort: ${p.cohorteEtiqueta}
  Start:  ${p.cohorteFechaInicio}
  End:    ${p.cohorteFechaFin}
  Amount: ${p.montoFormatted}

Campus: ${SEDE}
Office hours: ${HORARIO}

What to bring on day one:
  - Photo ID
  - Pen and notebook
  - Laptop computer

Personal protective equipment (PPE) is provided on-site — you don't need to bring a lab coat.

Student portal: ${portalUrl}
${p.receiptUrl ? `Payment receipt: ${p.receiptUrl}\n` : ""}
For any questions before the start, write to ${SUPPORT_EMAIL}.

Santa Cruz Compounding Academy, LLC
Bayamón, Puerto Rico
`;

  const eyebrow = es ? "Matrícula confirmada" : "Enrollment confirmed";
  const headline = es ? "¡Bienvenido a SCCA!" : "Welcome to SCCA!";

  const label = (txt: string) =>
    `<p style="margin:0 0 4px;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:${E.teal};">${txt}</p>`;
  const detailRow = (k: string, v: string) =>
    `<tr>
       <td style="padding:6px 0;font-family:${FONT};font-size:14px;color:${E.muted};width:120px;">${k}</td>
       <td style="padding:6px 0;font-family:${FONT};font-size:14px;color:${E.ink};font-weight:600;">${esc(v)}</td>
     </tr>`;

  const inner = `
    <p style="margin:0 0 14px;font-family:${FONT};font-size:16px;color:${E.ink};line-height:1.6;">
      ${es ? `Hola <strong>${esc(p.nombre)}</strong>,` : `Hi <strong>${esc(p.nombre)}</strong>,`}
    </p>
    <p style="margin:0 0 26px;font-family:${FONT};font-size:15px;color:${E.bodyText};line-height:1.7;">
      ${es
        ? `Gracias por inscribirte. Tu cupo en <strong>${esc(p.cursoTitulo)}</strong> está confirmado.`
        : `Thank you for enrolling. Your seat in <strong>${esc(p.cursoTitulo)}</strong> is confirmed.`}
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${E.tint};border-radius:10px;overflow:hidden;border:1px solid ${E.tintLine};border-left:4px solid ${E.teal};margin-bottom:26px;">
      <tr>
        <td style="padding:22px 26px;">
          ${label(es ? "Detalles de la cohorte" : "Cohort details")}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
            ${detailRow(es ? "Cohorte" : "Cohort", p.cohorteEtiqueta)}
            ${detailRow(es ? "Inicio" : "Start", p.cohorteFechaInicio)}
            ${detailRow(es ? "Cierre" : "End", p.cohorteFechaFin)}
            ${detailRow(es ? "Monto" : "Amount", p.montoFormatted)}
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${E.cardBg};border-radius:10px;border:1px solid ${E.cardLine};margin-bottom:26px;">
      <tr>
        <td style="padding:22px 26px;">
          ${label(es ? "Sede" : "Campus")}
          <p style="margin:2px 0 2px;font-family:${FONT};font-size:15px;color:${E.ink};line-height:1.6;">${SEDE}</p>
          <p style="margin:0 0 16px;font-family:${FONT};font-size:13px;color:${E.muted};line-height:1.6;">${es ? "Horario administrativo" : "Office hours"}: ${HORARIO}</p>
          ${label(es ? "Qué traer el primer día" : "What to bring on day one")}
          <ul style="margin:6px 0 0;padding-left:20px;font-family:${FONT};font-size:14px;color:${E.bodyText};line-height:1.7;">
            <li>${es ? "Identificación con foto" : "Photo ID"}</li>
            <li>${es ? "Bolígrafo y libreta" : "Pen and notebook"}</li>
            <li>${es ? "Computadora portátil" : "Laptop computer"}</li>
          </ul>
          <p style="margin:12px 0 0;font-family:${FONT};font-size:13px;color:${E.muted};line-height:1.6;">
            ${es
              ? "El equipo de protección personal (PPE) se provee en las facilidades — no necesitas traer bata blanca."
              : "Personal protective equipment (PPE) is provided on-site — you don't need to bring a lab coat."}
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-bottom:20px;">${button(portalUrl, es ? "Acceder al portal →" : "Access portal →")}</td></tr></table>

    ${p.receiptUrl
      ? `<p style="margin:0 0 18px;font-family:${FONT};font-size:14px;text-align:center;">
           <a href="${esc(p.receiptUrl)}" style="color:${E.teal};font-weight:600;text-decoration:underline;">${es ? "Ver recibo de pago" : "View payment receipt"} →</a>
         </p>`
      : ""}

    <p style="margin:0;font-family:${FONT};font-size:13px;color:${E.muted};line-height:1.65;text-align:center;">
      ${es
        ? `¿Preguntas antes del inicio? Escríbenos a <a href="mailto:${SUPPORT_EMAIL}" style="color:${E.teal};">${SUPPORT_EMAIL}</a>.`
        : `Questions before the start? Write to <a href="mailto:${SUPPORT_EMAIL}" style="color:${E.teal};">${SUPPORT_EMAIL}</a>.`}
    </p>
  `;

  const html = renderEmail({
    locale: p.locale,
    title: subject,
    eyebrow,
    headline,
    content: bodyCell(inner, "40px 44px 40px"),
  });
  return { subject, html, text };
}
