/* eslint-disable scca-brand/no-hex-literal -- Transactional email HTML needs
   inline hex; mail clients can't read the Tailwind brand tokens. This module
   is the single source of truth for the SCCA Design System email shell
   (pale-teal hero band, teal/chartreuse rules, tinted cards, pale footer),
   recreated from the handoff `ui_kits/emails/index.html`. Values mirror
   @/lib/brand where they overlap (tealDeep #195561, chartreuse #E6EA82). */

/**
 * Shared shell for SCCA transactional emails.
 *
 * Every template composes: `renderEmail({ hero eyebrow/headline, content
 * rows })`. The hero is a pale-teal band with the dark logo, a teal
 * eyebrow, and an ink headline, framed by a teal top-rule and a
 * chartreuse bottom-rule; the footer is a pale-teal band. Cards use the
 * warm off-white / pale-teal tints with a teal left-border.
 *
 * Hand-written table HTML, inline styles only — that is what Gmail,
 * Outlook, and Apple Mail reliably render. Montserrat is requested via
 * <link> for clients that honour it and falls back to Arial elsewhere.
 */

// ── Palette (from the handoff) ──────────────────────────────────────
export const E = {
  teal: "#195561",
  chartreuse: "#E6EA82",
  ink: "#20343a",
  bodyText: "#3a3f41",
  muted: "#7c868a",
  white: "#FFFFFF",
  heroBg: "#EBF3F2",
  footerBg: "#EBF3F2",
  cardBg: "#FAF9F5",
  cardLine: "#EBE7DE",
  tint: "#EFF6F5",
  tintLine: "#D5E6E3",
  canvas: "#E7ECEB",
  rejectText: "#9a5b5b",
  rejectLine: "#d9dcde",
} as const;

// Absolute URLs — email clients cannot resolve relative paths. Always the
// canonical production domain so assets load regardless of which
// deployment dispatched the mail.
const LOGO_DARK = "https://www.sccompoundingacademy.com/brand/logo-full-dark.png";
export const MARK_URL = "https://www.sccompoundingacademy.com/brand/logo-mark.png";
export const FONT = "'Montserrat',Arial,sans-serif";

/** HTML-escape a dynamic string before interpolating into email markup. */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Pale-teal hero band: dark logo, teal eyebrow, ink headline, framed by
 *  a teal top-rule and a chartreuse bottom-rule. */
export function hero(eyebrow: string, headline: string): string {
  return `
  <tr><td style="background:${E.teal};height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr>
    <td align="center" bgcolor="${E.heroBg}" style="background:${E.heroBg};padding:40px 44px 34px;text-align:center;">
      <img src="${LOGO_DARK}" alt="Santa Cruz Compounding Academy" width="180" style="display:block;margin:0 auto 26px;border:0;outline:none;height:auto;" />
      <p style="margin:0 0 8px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${E.teal};">${eyebrow}</p>
      <h1 style="margin:0;font-family:${FONT};font-size:26px;font-weight:700;letter-spacing:-0.02em;color:${E.ink};line-height:1.2;">${headline}</h1>
    </td>
  </tr>
  <tr><td style="background:${E.chartreuse};height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

/** Pale-teal footer band. */
export function footer(locale: "es" | "en"): string {
  const rights = locale === "es" ? "Todos los derechos reservados" : "All rights reserved";
  const year = new Date().getFullYear();
  return `
  <tr>
    <td bgcolor="${E.footerBg}" style="background:${E.footerBg};padding:28px 44px;text-align:center;">
      <p style="margin:0 0 6px;font-family:${FONT};font-size:12px;color:${E.teal};line-height:1.7;font-weight:600;">
        Santa Cruz Compounding Academy, LLC · Bayamón, Puerto Rico<br />
        <a href="https://sccompoundingacademy.com" style="color:${E.teal};text-decoration:underline;font-weight:700;">sccompoundingacademy.com</a>
      </p>
      <p style="margin:0;font-family:${FONT};font-size:11px;color:${E.muted};">© ${year} SCCA · ${rights}</p>
    </td>
  </tr>`;
}

/** Solid teal CTA button (centered). */
export function button(href: string, label: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
    <tr>
      <td style="background:${E.teal};border-radius:8px;">
        <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:14px;font-weight:600;color:${E.white};text-decoration:none;letter-spacing:0.01em;">${label}</a>
      </td>
    </tr>
  </table>`;
}

/** A white body cell `<tr>` — the standard content band under the hero.
 *  Pass fully-formed inner HTML. `pad` overrides the default padding. */
export function bodyCell(inner: string, pad = "40px 44px 36px"): string {
  return `
  <tr>
    <td style="background:${E.white};padding:${pad};">
      ${inner}
    </td>
  </tr>`;
}

/** Wrap composed rows into a full, send-ready email document. */
export function renderEmail(opts: {
  locale: "es" | "en";
  title: string;
  eyebrow: string;
  headline: string;
  /** Body `<tr>` rows between hero and footer (use `bodyCell`). */
  content: string;
}): string {
  return `<!DOCTYPE html>
<html lang="${opts.locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>${opts.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background:${E.canvas};font-family:${FONT};color:${E.bodyText};-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${E.canvas};padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:${E.white};border-radius:8px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.08);">
            ${hero(opts.eyebrow, opts.headline)}
            ${opts.content}
            ${footer(opts.locale)}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
