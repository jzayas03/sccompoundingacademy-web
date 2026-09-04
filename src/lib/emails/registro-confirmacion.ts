import { E, FONT, bodyCell, renderEmail, esc } from "./_shell";

/**
 * Email de confirmación del registro liviano (spec 2026-09-04): ofertas
 * "pagar → confirmación" sin cuenta de portal (curso Parte 2, tier
 * subgraduado). Deliberadamente SIN CTA de portal, SIN lista de materiales
 * de curso y SIN welcome packet — este registro no da acceso a material.
 * Mismo shell del design system que el resto de emails transaccionales.
 */
type RegistroParams = {
  nombre: string;
  cursoTitulo: string;
  cohorteEtiqueta: string;
  cohorteFechaInicio: string;
  cohorteFechaFin: string;
  montoFormatted: string;
  receiptUrl?: string;
  locale: "es" | "en";
};

const SEDE = "73 Santa Cruz Medical Building, Suite 201, Bayamón, PR 00961";
const HORARIO = "Lunes a Viernes · 7:30 a.m. – 5:00 p.m.";
const SUPPORT_EMAIL = "info@sccompoundingacademy.com";

export function buildRegistroEmail(p: RegistroParams): {
  subject: string;
  html: string;
  text: string;
} {
  const es = p.locale === "es";
  const subject = es
    ? `Confirmación de registro · ${p.cursoTitulo}`
    : `Registration confirmation · ${p.cursoTitulo}`;

  const text = es
    ? `Hola ${p.nombre},

Gracias por registrarte en ${p.cursoTitulo}. Tu cupo está confirmado.

  Cohorte: ${p.cohorteEtiqueta}
  Inicio:  ${p.cohorteFechaInicio}
  Cierre:  ${p.cohorteFechaFin}
  Monto:   ${p.montoFormatted}

Sede: ${SEDE}
Horario administrativo: ${HORARIO}

Te esperamos el primer día con identificación con foto. Cerca de la fecha
de inicio te enviaremos los detalles logísticos por este mismo correo.
${p.receiptUrl ? `\nRecibo de pago: ${p.receiptUrl}\n` : ""}
Cualquier pregunta antes del inicio, escríbenos a ${SUPPORT_EMAIL}.

Santa Cruz Compounding Academy, LLC
Bayamón, Puerto Rico
`
    : `Hi ${p.nombre},

Thank you for registering for ${p.cursoTitulo}. Your seat is confirmed.

  Cohort: ${p.cohorteEtiqueta}
  Start:  ${p.cohorteFechaInicio}
  End:    ${p.cohorteFechaFin}
  Amount: ${p.montoFormatted}

Campus: ${SEDE}
Office hours: ${HORARIO}

Bring a photo ID on day one. We'll email you the logistics details closer
to the start date.
${p.receiptUrl ? `\nPayment receipt: ${p.receiptUrl}\n` : ""}
For any questions before the start, write to ${SUPPORT_EMAIL}.

Santa Cruz Compounding Academy, LLC
Bayamón, Puerto Rico
`;

  const eyebrow = es ? "Registro confirmado" : "Registration confirmed";
  const headline = es ? "¡Nos vemos en el curso!" : "See you at the course!";

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
        ? `Gracias por registrarte. Tu cupo en <strong>${esc(p.cursoTitulo)}</strong> está confirmado.`
        : `Thank you for registering. Your seat in <strong>${esc(p.cursoTitulo)}</strong> is confirmed.`}
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
          <p style="margin:0 0 12px;font-family:${FONT};font-size:13px;color:${E.muted};line-height:1.6;">${es ? "Horario administrativo" : "Office hours"}: ${HORARIO}</p>
          <p style="margin:0;font-family:${FONT};font-size:13px;color:${E.muted};line-height:1.6;">
            ${es
              ? "Trae identificación con foto el primer día. Cerca de la fecha de inicio te enviaremos los detalles logísticos por este mismo correo."
              : "Bring a photo ID on day one. We'll email you the logistics details closer to the start date."}
          </p>
        </td>
      </tr>
    </table>

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
