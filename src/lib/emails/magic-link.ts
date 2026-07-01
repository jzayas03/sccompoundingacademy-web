import { E, FONT, button, bodyCell, renderEmail, esc } from "./_shell";

/**
 * Magic-link sign-in email for the student portal.
 *
 * Restyled to the SCCA Design System email shell (see `_shell.ts`) —
 * pale-teal hero, teal CTA, monospace fallback-link card. Hand-written
 * table HTML, inline styles only, for cross-client compatibility.
 */

type MagicLinkParams = {
  /** Full sign-in URL produced by Auth.js — short-lived, single-use. */
  url: string;
  /** UI locale to render the email in. */
  locale: "es" | "en";
};

export function buildMagicLinkEmail(p: MagicLinkParams): {
  subject: string;
  html: string;
  text: string;
} {
  const es = p.locale === "es";
  const subject = es
    ? "Tu enlace de acceso · Santa Cruz Compounding Academy"
    : "Your sign-in link · Santa Cruz Compounding Academy";

  const eyebrow = es ? "Acceso al portal" : "Portal access";
  const headline = es ? "Entra a tu portal" : "Enter your portal";
  const greeting = es ? "Hola," : "Hello,";
  const bodyText = es
    ? "Hacé click en el botón para entrar al portal del estudiante. El enlace es válido por una sola vez."
    : "Click the button below to enter the student portal. This link is valid for one-time use only.";
  const ctaLabel = es ? "Entrar al portal →" : "Enter portal →";
  const fallbackLabel = es
    ? "¿El botón no funciona? Copia y pega este enlace:"
    : "Button not working? Copy and paste this link:";
  const expiry = es
    ? "Este enlace expira en 24 horas. Si no solicitaste este correo, ignóralo."
    : "This link expires in 24 hours. If you did not request this email, please ignore it.";

  const text = `${greeting}

${bodyText}

${p.url}

${fallbackLabel}

${expiry}

Santa Cruz Compounding Academy
Bayamón, Puerto Rico
`;

  const content = bodyCell(`
    <p style="margin:0 0 14px;font-family:${FONT};font-size:16px;font-weight:600;color:${E.teal};text-align:center;">${greeting}</p>
    <p style="margin:0 auto 32px;max-width:400px;font-family:${FONT};font-size:15px;color:${E.bodyText};line-height:1.75;text-align:center;">${bodyText}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-bottom:30px;">${button(p.url, ctaLabel)}</td></tr></table>
    <p style="margin:0 0 10px;font-family:${FONT};font-size:12px;color:${E.muted};line-height:1.6;text-align:center;">${fallbackLabel}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:${E.cardBg};border-radius:8px;padding:16px 20px;border:1px solid ${E.cardLine};text-align:center;">
          <a href="${p.url}" style="font-family:'Courier New',monospace;font-size:12px;color:${E.ink};word-break:break-all;line-height:1.55;text-decoration:none;">${esc(p.url)}</a>
        </td>
      </tr>
    </table>
    <p style="margin:28px auto 0;max-width:420px;font-family:${FONT};font-size:12px;color:${E.muted};line-height:1.65;text-align:center;">${expiry}</p>
  `);

  const html = renderEmail({ locale: p.locale, title: subject, eyebrow, headline, content });
  return { subject, html, text };
}
