import { brand } from "@/lib/brand";

/**
 * Magic-link sign-in email for the student portal.
 *
 * Hand-written HTML (no React Email dependency) — keeps inline styles only
 * for maximum cross-client compatibility (Gmail, Outlook, Apple Mail). The
 * compiled output carries actual hex values because email clients cannot
 * read TS constants; the brand-lint test allowlists this file via its
 * import of `brand.colors`.
 */

type MagicLinkParams = {
  /** Full sign-in URL produced by Auth.js — short-lived, single-use. */
  url: string;
  /** UI locale to render the email in. */
  locale: "es" | "en";
};

const c = brand.colors;
// Absolute URL — email clients cannot resolve relative paths. Always
// the canonical production domain so the asset loads regardless of
// which deployment dispatched the mail.
const LOGO_URL = "https://www.sccompoundingacademy.com/brand/logo-email.png";

export function buildMagicLinkEmail(p: MagicLinkParams): {
  subject: string;
  html: string;
  text: string;
} {
  const es = p.locale === "es";
  const subject = es
    ? "Tu enlace de acceso · Santa Cruz Compounding Academy"
    : "Your sign-in link · Santa Cruz Compounding Academy";

  const ctaLabel = es ? "Entrar al portal" : "Sign in to the portal";
  const helperBody = es
    ? "Este enlace expira en 24 horas. Si no solicitaste este correo, ignóralo."
    : "This link expires in 24 hours. If you did not request this email, you can safely ignore it.";

  const text = es
    ? `Hola,

Hacé click en el siguiente enlace para entrar al portal de Santa Cruz Compounding Academy:

${p.url}

${helperBody}

Santa Cruz Compounding Academy
Bayamón, Puerto Rico
`
    : `Hi,

Click the link below to sign in to the Santa Cruz Compounding Academy portal:

${p.url}

${helperBody}

Santa Cruz Compounding Academy
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

            <tr>
              <td style="background:${c.tealDeep};padding:26px 32px;text-align:left;">
                <img src="${LOGO_URL}" alt="Santa Cruz Compounding Academy" width="150" style="display:block;border:0;outline:none;margin:0 0 14px;" />
                <p style="margin:0;color:${c.chartreuse};font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;">
                  ${es ? "Acceso al portal" : "Portal sign-in"}
                </p>
                <p style="margin:8px 0 0;color:${c.offWhite};font-size:22px;font-weight:700;line-height:1.25;">
                  Santa Cruz Compounding Academy
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                  ${es ? "Hola," : "Hi,"}
                </p>
                <p style="margin:0 0 28px;font-size:16px;line-height:1.6;">
                  ${es
                    ? "Hacé click en el botón para entrar al portal del estudiante. El enlace es válido por una sola vez."
                    : "Click the button below to sign in to the student portal. The link is valid for a single use."}
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                  <tr>
                    <td align="center" style="background:${c.chartreuse};border-radius:8px;">
                      <a href="${p.url}" target="_blank" rel="noopener noreferrer"
                        style="display:inline-block;padding:14px 28px;color:${c.tealDeep};font-weight:700;text-decoration:none;font-size:16px;letter-spacing:0.02em;">
                        ${ctaLabel} →
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:32px 0 0;font-size:13px;line-height:1.6;color:${c.gray[700]};">
                  ${es
                    ? "¿El botón no funciona? Copia y pega este enlace en tu navegador:"
                    : "Button not working? Copy and paste this link into your browser:"}
                  <br />
                  <a href="${p.url}" style="color:${c.tealDeep};word-break:break-all;">${p.url}</a>
                </p>

                <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:${c.gray[700]};">
                  ${helperBody}
                </p>
              </td>
            </tr>

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
