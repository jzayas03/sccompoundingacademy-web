import { E, FONT, bodyCell, button, renderEmail, esc } from "./_shell";

/**
 * Review-invite email sent 24h after a student becomes cert-eligible
 * (has passed all 3 module post-tests). Voice mirrors the educator-
 * warm tone the portal uses elsewhere — the email reads as if signed
 * by Lcdo. Reyes, not as a faceless transactional notification.
 *
 * Rendered on the shared SCCA email shell (`_shell.ts`) so it matches the
 * rest of the transactional set: pale-teal hero, Montserrat, solid-teal
 * CTA, SCCA footer. The personal letter lives in the body; the "why you
 * received this" disclosure sits in a muted band above the footer.
 */
type InviteParams = {
  nombre: string;
  reviewUrl: string;
};

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

  // The personal letter — left-aligned, warm, signed. Montserrat comes from
  // the shell FONT so it matches the rest of the transactional emails.
  const letter = `
    <p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.7;color:${E.bodyText};">${esc(greeting)},</p>
    <p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.7;color:${E.bodyText};">
      Acabas de completar el curso <strong style="color:${E.ink};">Basic Compounding No Estéril</strong> en Santa Cruz Compounding Academy. ¡Felicidades!
    </p>
    <p style="margin:0 0 24px;font-family:${FONT};font-size:16px;line-height:1.7;color:${E.bodyText};">
      Si tienes un minuto, me ayudaría muchísimo si compartes una reseña corta. Cualquier cosa que aprendiste, algo que cambiarías, lo que más te llevaste. Tu feedback nos ayuda a mejorar el curso para las próximas cohortes — y, si das tu consentimiento, lo mostramos en el sitio para que otros farmacéuticos sepan qué esperar.
    </p>
    ${button(p.reviewUrl, "Dejar mi reseña")}
    <p style="margin:26px 0 16px;font-family:${FONT};font-size:16px;line-height:1.7;color:${E.bodyText};">
      Gracias por confiar en nosotros para esta etapa.
    </p>
    <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.6;color:${E.ink};">
      —Lcdo. Jorge L. Reyes Quiñones, RPh, FACA, FACVP<br />
      <span style="color:${E.muted};font-size:13px;">Santa Cruz Compounding Academy</span>
    </p>`;

  // "Why you received this" disclosure — a muted band just above the footer.
  const disclosure = `
  <tr>
    <td style="background:${E.white};padding:0 44px 34px;">
      <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${E.muted};border-top:1px solid ${E.cardLine};padding-top:18px;">
        ${FOOTER_NOTE}
      </p>
    </td>
  </tr>`;

  const html = renderEmail({
    locale: "es",
    title: subject,
    eyebrow: "¡Felicidades!",
    headline: "Completaste el curso",
    content: bodyCell(letter) + disclosure,
  });

  return { subject, html, text };
}
