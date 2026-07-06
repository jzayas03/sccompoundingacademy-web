import { E, FONT, MARK_URL, button, bodyCell, renderEmail, esc } from "./_shell";

/**
 * Certificate-ready email — sent once when a student passes every module
 * post-test and their participation certificate becomes downloadable.
 *
 * Recreated from the SCCA Design System handoff (Certificate template):
 * congratulations, a badge card (mark + "Certificate ready" + program
 * line), a download CTA, and an instructor sign-off card. Bilingual; the
 * badge subline is tier-aware (professional carries ACPE CE; the student
 * track is a non-ACPE completion certificate).
 */

type CertProgram = "profesional" | "profesional-completion" | "student";

type CertParams = {
  nombre: string;
  locale: "es" | "en";
  /** Absolute URL to the portal certificate page where the PDF downloads. */
  certUrl: string;
  program: CertProgram;
};

export function buildCertificateReadyEmail(p: CertParams): {
  subject: string;
  html: string;
  text: string;
} {
  const es = p.locale === "es";
  const first = (p.nombre || "").trim().split(/\s+/)[0] ?? "";
  const awardsCeus = p.program === "profesional";

  const subject = es
    ? "Tu certificado está listo · Santa Cruz Compounding Academy"
    : "Your certificate is ready · Santa Cruz Compounding Academy";

  const eyebrow = es ? "Curso completado" : "Course completed";
  const headline = es ? "¡Felicidades!" : "Congratulations!";
  const congrats = first ? `${first},` : es ? "¡Felicidades!" : "Congratulations!";
  const bodyText = es
    ? `Completaste el curso <strong>Basic Non-Sterile Compounding</strong> satisfactoriamente. Tu certificado SCCA${awardsCeus ? " y la documentación de horas CE están listos" : " está listo"} para descargar.`
    : `You successfully completed <strong>Basic Non-Sterile Compounding</strong>. Your SCCA certificate${awardsCeus ? " and CE hour documentation are ready" : " is ready"} to download.`;
  const badgeBig = es ? "Certificado listo" : "Certificate ready";
  const badgeSub = awardsCeus
    ? "ACPE 0151 · 1.8 CEUs"
    : p.program === "student"
      ? es
        ? "USP 〈795〉 y 〈800〉 · Certificado de finalización"
        : "USP 〈795〉 & 〈800〉 · Certificate of completion"
      : es
        ? "Certificado de finalización"
        : "Certificate of completion";
  const ctaLabel = es ? "Descargar certificado →" : "Download certificate →";
  const closing = es
    ? "Gracias por confiar en Santa Cruz Compounding Academy."
    : "Thank you for trusting Santa Cruz Compounding Academy.";
  const instructorLabel = es ? "Instructor" : "Instructor";
  const instructorName = "Prof. Jorge Reyes, B.S.Ph.";

  const text = `${congrats}

${(es
    ? `Completaste el curso Basic Non-Sterile Compounding satisfactoriamente. Tu certificado SCCA${awardsCeus ? " y la documentación de horas CE están listos" : " está listo"} para descargar.`
    : `You successfully completed Basic Non-Sterile Compounding. Your SCCA certificate${awardsCeus ? " and CE hour documentation are ready" : " is ready"} to download.`)}

${badgeBig} — ${badgeSub}

${es ? "Descargar" : "Download"}: ${p.certUrl}

${closing}

${instructorLabel}: ${instructorName}
Santa Cruz Compounding Academy
Bayamón, Puerto Rico
`;

  const content = bodyCell(`
    <p style="margin:0 0 14px;font-family:${FONT};font-size:17px;font-weight:700;color:${E.ink};text-align:center;">${esc(congrats)}</p>
    <p style="margin:0 auto 30px;max-width:420px;font-family:${FONT};font-size:15px;color:${E.bodyText};line-height:1.75;text-align:center;">${bodyText}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${E.tint};border-radius:10px;overflow:hidden;margin-bottom:30px;border:1px solid ${E.tintLine};border-left:4px solid ${E.chartreuse};">
      <tr>
        <td width="78" style="padding:22px 24px;vertical-align:middle;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="background:${E.teal};border-radius:10px;padding:11px;text-align:center;">
              <img src="${MARK_URL}" alt="" width="32" style="display:block;height:auto;border:0;" />
            </td>
          </tr></table>
        </td>
        <td style="padding:22px 26px 22px 0;vertical-align:middle;">
          <p style="margin:0 0 3px;font-family:${FONT};font-size:17px;font-weight:700;color:${E.ink};letter-spacing:-0.01em;">${badgeBig}</p>
          <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:600;color:${E.muted};letter-spacing:0.03em;">${badgeSub}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-bottom:28px;">${button(p.certUrl, ctaLabel)}</td></tr></table>
    <p style="margin:0 0 26px;font-family:${FONT};font-size:14px;color:${E.bodyText};line-height:1.7;text-align:center;">${closing}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${E.cardBg};border-radius:10px;overflow:hidden;border:1px solid ${E.cardLine};">
      <tr>
        <td style="padding:18px 26px;text-align:center;">
          <p style="margin:0 0 3px;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:${E.teal};">${instructorLabel}</p>
          <p style="margin:0;font-family:${FONT};font-size:15px;font-weight:700;color:${E.ink};">${instructorName}</p>
        </td>
      </tr>
    </table>
  `);

  const html = renderEmail({ locale: p.locale, title: subject, eyebrow, headline, content });
  return { subject, html, text };
}
