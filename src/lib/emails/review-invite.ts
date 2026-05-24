import { brand } from "@/lib/brand";

/**
 * Review-invite email sent 24h after a student becomes cert-eligible
 * (has passed all 3 module post-tests). Voice mirrors the educator-
 * warm tone the portal uses elsewhere — the email reads as if signed
 * by Lcdo. Reyes, not as a faceless transactional notification.
 *
 * No-React-Email convention: hand-written HTML with inline styles,
 * brand colours interpolated from lib/brand.ts at build time so the
 * no-hex-literal lint rule does not fail.
 */
type InviteParams = {
  nombre: string;
  reviewUrl: string;
};

const c = brand.colors;
const LOGO_URL = "https://www.sccompoundingacademy.com/brand/logo-email.png";
const FOOTER_NOTE =
  "Recibes este mensaje porque completaste recientemente el curso Basic Compounding No Estéril en SCCA.";

function firstName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/);
  return parts[0] ?? "";
}

export function buildReviewInviteEmail(p: InviteParams): {
  subject: string;
  html: string;
  text: string;
} {
  const first = firstName(p.nombre);
  const greeting = first ? `Hola ${first}` : "Hola";
  const subject = first
    ? `${first}, ¿cómo te fue en el curso? · SCCA`
    : "¿Cómo te fue en el curso? · SCCA";

  const text = `${greeting},

Acabas de completar el curso Basic Compounding No Estéril en Santa Cruz Compounding Academy. ¡Felicidades!

Si tienes un minuto, me ayudaría muchísimo si compartes una reseña corta. Cualquier cosa que aprendiste, algo que cambiarías, lo que más te llevaste. Tu feedback nos ayuda a mejorar el curso para las próximas cohortes — y, si das tu consentimiento, lo mostramos en el sitio para que otros farmacéuticos sepan qué esperar.

Dejar la reseña: ${p.reviewUrl}

Gracias por confiar en nosotros para esta etapa.

—Lcdo. Jorge L. Reyes Quiñones, RPh, FACA, FACVP
Santa Cruz Compounding Academy

${FOOTER_NOTE}
`;

  const html = `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:${c.offWhite};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${c.gray[900]};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${c.offWhite};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:${c.white};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:${c.tealDeep};padding:24px 32px;text-align:left;">
                <img src="${LOGO_URL}" alt="Santa Cruz Compounding Academy" width="160" style="display:block;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">${greeting},</p>
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">
                  Acabas de completar el curso <strong>Basic Compounding No Estéril</strong> en Santa Cruz Compounding Academy. ¡Felicidades!
                </p>
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">
                  Si tienes un minuto, me ayudaría muchísimo si compartes una reseña corta. Cualquier cosa que aprendiste, algo que cambiarías, lo que más te llevaste. Tu feedback nos ayuda a mejorar el curso para las próximas cohortes — y, si das tu consentimiento, lo mostramos en el sitio para que otros farmacéuticos sepan qué esperar.
                </p>
                <p style="margin:24px 0;">
                  <a href="${p.reviewUrl}"
                     style="background-color:${c.chartreuse};color:${c.tealDeep};display:inline-block;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">
                    Dejar mi reseña
                  </a>
                </p>
                <p style="margin:0 0 8px 0;font-size:16px;line-height:1.6;">
                  Gracias por confiar en nosotros para esta etapa.
                </p>
                <p style="margin:0;font-size:15px;line-height:1.6;color:${c.gray[900]};">
                  —Lcdo. Jorge L. Reyes Quiñones, RPh, FACA, FACVP<br/>
                  <span style="color:${c.gray[700]};font-size:13px;">Santa Cruz Compounding Academy</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px 32px;font-size:12px;color:${c.gray[700]};line-height:1.5;">
                ${FOOTER_NOTE}
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
