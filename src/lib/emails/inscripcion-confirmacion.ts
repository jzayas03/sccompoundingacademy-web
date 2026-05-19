import { brand } from "@/lib/brand";

/**
 * Confirmation email sent to the newly-enrolled student after payment.
 *
 * Hand-written HTML (no React Email dependency) — at 2 templates the
 * dep cost outweighs the convenience. Inline styles only, no external
 * CSS, no <link> tags — that's what email clients (Gmail, Outlook,
 * Apple Mail, GMX, etc.) reliably render.
 *
 * Brand colours are interpolated from `lib/brand.ts` at build time so
 * this file stays free of hex literals (the brand-lint e2e test scans
 * all of src/ for raw hex). The compiled HTML carries actual hex values
 * because email clients can't read TS constants.
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

const c = brand.colors;
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
  - Bata blanca (si la tienes; si no, te facilitamos una el primer día)

${p.receiptUrl ? `Recibo de pago: ${p.receiptUrl}\n\n` : ""}Cualquier pregunta antes del inicio, escríbenos a ${SUPPORT_EMAIL}.

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
  - Lab coat (if you have one; otherwise we provide one on day one)

${p.receiptUrl ? `Payment receipt: ${p.receiptUrl}\n\n` : ""}For any questions before the start, write to ${SUPPORT_EMAIL}.

Santa Cruz Compounding Academy, LLC
Bayamón, Puerto Rico
`;

  const html = `<!DOCTYPE html>
<html lang="${p.locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:${c.gray[100]};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${c.gray[900]};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${c.gray[100]};padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:${c.white};border-radius:12px;overflow:hidden;">

            <!-- Header band -->
            <tr>
              <td style="background:${c.tealDeep};padding:28px 32px;text-align:left;">
                <p style="margin:0;color:${c.chartreuse};font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;">
                  ${es ? "Confirmación de inscripción" : "Enrollment confirmation"}
                </p>
                <p style="margin:8px 0 0;color:${c.offWhite};font-size:22px;font-weight:700;line-height:1.25;">
                  Santa Cruz Compounding Academy
                </p>
              </td>
            </tr>

            <!-- Greeting + summary -->
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                  ${es ? `Hola <strong>${p.nombre}</strong>,` : `Hi <strong>${p.nombre}</strong>,`}
                </p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
                  ${es ? `Gracias por inscribirte. Tu cupo en <strong>${p.cursoTitulo}</strong> está confirmado.` : `Thank you for enrolling. Your seat in <strong>${p.cursoTitulo}</strong> is confirmed.`}
                </p>

                <!-- Cohort detail card -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${c.gray[300]};border-radius:8px;">
                  <tr>
                    <td style="padding:20px 22px;">
                      <p style="margin:0;color:${c.tealDeep};font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;">
                        ${es ? "Detalles de la cohorte" : "Cohort details"}
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:12px;">
                        <tr>
                          <td style="padding:6px 0;font-size:14px;color:${c.gray[700]};width:120px;">${es ? "Cohorte" : "Cohort"}</td>
                          <td style="padding:6px 0;font-size:14px;color:${c.gray[900]};font-weight:600;">${p.cohorteEtiqueta}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;font-size:14px;color:${c.gray[700]};">${es ? "Inicio" : "Start"}</td>
                          <td style="padding:6px 0;font-size:14px;color:${c.gray[900]};font-weight:600;">${p.cohorteFechaInicio}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;font-size:14px;color:${c.gray[700]};">${es ? "Cierre" : "End"}</td>
                          <td style="padding:6px 0;font-size:14px;color:${c.gray[900]};font-weight:600;">${p.cohorteFechaFin}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;font-size:14px;color:${c.gray[700]};">${es ? "Monto" : "Amount"}</td>
                          <td style="padding:6px 0;font-size:14px;color:${c.gray[900]};font-weight:600;">${p.montoFormatted}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Logistics -->
                <p style="margin:28px 0 8px;font-size:14px;font-weight:600;color:${c.tealDeep};letter-spacing:0.06em;text-transform:uppercase;">
                  ${es ? "Sede" : "Campus"}
                </p>
                <p style="margin:0 0 4px;font-size:15px;line-height:1.6;">${SEDE}</p>
                <p style="margin:0;font-size:13px;line-height:1.6;color:${c.gray[700]};">${es ? "Horario administrativo" : "Office hours"}: ${HORARIO}</p>

                <p style="margin:28px 0 8px;font-size:14px;font-weight:600;color:${c.tealDeep};letter-spacing:0.06em;text-transform:uppercase;">
                  ${es ? "Qué traer el primer día" : "What to bring on day one"}
                </p>
                <ul style="margin:0;padding-left:20px;font-size:15px;line-height:1.6;">
                  <li>${es ? "Identificación con foto" : "Photo ID"}</li>
                  <li>${es ? "Bolígrafo y libreta" : "Pen and notebook"}</li>
                  <li>${es ? "Bata blanca (si la tienes; si no, te facilitamos una)" : "Lab coat (if you have one; otherwise we provide one)"}</li>
                </ul>

                ${
                  p.receiptUrl
                    ? `<p style="margin:28px 0 0;font-size:14px;">
                         <a href="${p.receiptUrl}" style="color:${c.tealDeep};font-weight:600;text-decoration:underline;">
                           ${es ? "Ver recibo de pago" : "View payment receipt"} →
                         </a>
                       </p>`
                    : ""
                }

                <p style="margin:32px 0 0;font-size:14px;line-height:1.6;color:${c.gray[700]};">
                  ${es ? `¿Preguntas antes del inicio? Escríbenos a <a href="mailto:${SUPPORT_EMAIL}" style="color:${c.tealDeep};">${SUPPORT_EMAIL}</a>.` : `Questions before the start? Write to <a href="mailto:${SUPPORT_EMAIL}" style="color:${c.tealDeep};">${SUPPORT_EMAIL}</a>.`}
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:${c.gray[100]};padding:20px 32px;text-align:center;">
                <p style="margin:0;font-size:12px;color:${c.gray[700]};">
                  Santa Cruz Compounding Academy, LLC · Bayamón, Puerto Rico
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
