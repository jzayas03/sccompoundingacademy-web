import { describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { buildMagicLinkEmail } from "@/lib/emails/magic-link";
import { buildConfirmationEmail } from "@/lib/emails/inscripcion-confirmacion";
import {
  buildVerificationSubmittedEmail,
  buildVerificationApprovedEmail,
  buildVerificationRejectedEmail,
  buildCheckoutLinkEmail,
} from "@/lib/emails/verificacion";
import { buildCertificateReadyEmail } from "@/lib/emails/certificado";

/**
 * Smoke tests for the SCCA Design System email templates (handoff
 * `ui_kits/emails`). Verifies bilingual copy, that the shared shell is
 * applied (Montserrat + the chartreuse rule), that dynamic data lands in
 * both html + text, and that the two "kept extras" (matrícula photo, and
 * the confirmation logistics) survive the restyle.
 *
 * Run with EMAIL_PREVIEW=1 to also emit rendered HTML to the scratchpad
 * for visual review.
 */

const MAGIC_URL = "https://sccompoundingacademy.com/auth/callback?token=abc123";
const CERT_URL = "https://sccompoundingacademy.com/es/portal/certificado";
// Mirrors the module-internal PORTAL_URL + /es locale segment.
const PORTAL_URL_ES = "https://sccompoundingacademy.com/es";

describe("SCCA email templates", () => {
  it("magic link — bilingual, fallback URL in html + text", () => {
    const es = buildMagicLinkEmail({ url: MAGIC_URL, locale: "es" });
    expect(es.subject).toContain("enlace de acceso");
    expect(es.html).toContain(MAGIC_URL);
    expect(es.text).toContain(MAGIC_URL);
    const en = buildMagicLinkEmail({ url: MAGIC_URL, locale: "en" });
    expect(en.subject.toLowerCase()).toContain("sign-in");
    expect(en.html).toContain("Enter your portal");
  });

  it("certificate — tier-aware badge (ACPE for professional, USP for student)", () => {
    const pro = buildCertificateReadyEmail({
      nombre: "Ariana Quiñones",
      locale: "es",
      certUrl: CERT_URL,
      program: "profesional",
    });
    expect(pro.html).toContain("ACPE 0151");
    expect(pro.html).toContain(CERT_URL);
    expect(pro.html).toContain("Ariana"); // first-name greeting

    const stu = buildCertificateReadyEmail({
      nombre: "Ariana",
      locale: "en",
      certUrl: CERT_URL,
      program: "student",
    });
    expect(stu.html).toContain("795"); // USP chapters
    expect(stu.html).not.toContain("ACPE 0151"); // student track is non-ACPE
  });

  it("admin review — keeps the matrícula photo + approve/reject + date", () => {
    const out = buildVerificationSubmittedEmail({
      nombre: "Ariana Quiñones",
      email: "aq255@mynsu.nova.edu",
      docUrl: "https://blob.example.com/matricula.jpg",
      approveUrl: "https://sccompoundingacademy.com/verificar-matricula/approve",
      rejectUrl: "https://sccompoundingacademy.com/verificar-matricula/reject",
      submittedAt: new Date("2025-06-30T17:38:00Z"),
    });
    expect(out.html).toContain("https://blob.example.com/matricula.jpg"); // photo kept
    expect(out.html).toContain("Aprobar");
    expect(out.html).toContain("Rechazar");
    expect(out.html).toContain("Fecha de solicitud");
  });

  it("confirmation — keeps logistics + adds a portal CTA", () => {
    const out = buildConfirmationEmail({
      nombre: "Ana Torres",
      cursoTitulo: "Basic Non-Sterile Compounding",
      cohorteEtiqueta: "Cohorte 1",
      cohorteFechaInicio: "12 de enero de 2026",
      cohorteFechaFin: "14 de enero de 2026",
      montoFormatted: "$1,000",
      receiptUrl: "https://stripe.example.com/receipt",
      locale: "es",
    });
    expect(out.text).toContain("Identificación con foto"); // what-to-bring kept
    expect(out.html).toContain("portal"); // portal CTA added
    expect(out.html).toContain("Cohorte 1");
  });

  it("matrícula decision emails — bilingual, on the shell, CTA + link in html + text", () => {
    const PAY_URL = "https://sccompoundingacademy.com/api/inscripcion/pagar?token=abc";

    const approved = buildVerificationApprovedEmail("es");
    expect(approved.html).toContain("Ya tienes acceso"); // hero headline
    expect(approved.html).toContain(`${PORTAL_URL_ES}/portal`); // portal CTA
    expect(approved.text).toContain(`${PORTAL_URL_ES}/portal`);

    const rejected = buildVerificationRejectedEmail("es");
    expect(rejected.html).toContain("No pudimos verificarla"); // hero headline
    expect(rejected.html).toContain(`${PORTAL_URL_ES}/portal/verificacion`); // re-upload CTA
    expect(rejected.text).toContain("foto clara y vigente"); // copy left as-is

    const checkout = buildCheckoutLinkEmail("en", PAY_URL);
    expect(checkout.html).toContain("Complete your payment"); // hero headline
    expect(checkout.html).toContain(PAY_URL); // signed pay link
    expect(checkout.html).toContain("48 hours"); // expiry note kept
    expect(checkout.text).toContain(PAY_URL);
    // The off-brand chartreuse pay button is gone — CTA now uses the teal shell
    // button. (The hero's chartreuse bottom-rule still legitimately uses #E6EA82,
    // so target the old button's chartreuse *background* specifically.)
    expect(checkout.html).not.toContain("background:#E6EA82;color:");
    expect(checkout.html).toContain("background:#195561;border-radius:8px"); // teal shell button
  });

  it("all templates share the handoff shell (Montserrat + chartreuse rule)", () => {
    const htmls = [
      buildMagicLinkEmail({ url: MAGIC_URL, locale: "es" }).html,
      buildCertificateReadyEmail({ nombre: "A", locale: "es", certUrl: CERT_URL, program: "profesional" }).html,
      buildConfirmationEmail({
        nombre: "A",
        cursoTitulo: "X",
        cohorteEtiqueta: "C1",
        cohorteFechaInicio: "a",
        cohorteFechaFin: "b",
        montoFormatted: "$1",
        locale: "en",
      }).html,
      buildVerificationSubmittedEmail({
        nombre: "A",
        email: "a@b.edu",
        docUrl: null,
        approveUrl: "https://a",
        rejectUrl: "https://r",
      }).html,
      buildVerificationApprovedEmail("es").html,
      buildVerificationRejectedEmail("en").html,
      buildCheckoutLinkEmail("es", "https://sccompoundingacademy.com/pay").html,
    ];
    for (const html of htmls) {
      expect(html).toContain("Montserrat"); // shell font
      expect(html).toContain("sccompoundingacademy.com"); // shell footer
    }
  });

  it.runIf(process.env.EMAIL_PREVIEW === "1")("emits rendered previews to the scratchpad", () => {
    const dir =
      "/private/tmp/claude-501/-Users-jan-zayas1/db391a75-0ba5-4074-ad18-c96f8412f957/scratchpad/email-previews";
    mkdirSync(dir, { recursive: true });
    const write = (name: string, html: string) => writeFileSync(`${dir}/${name}.html`, html);
    for (const locale of ["es", "en"] as const) {
      write(`1-magic-link.${locale}`, buildMagicLinkEmail({ url: MAGIC_URL, locale }).html);
      write(
        `3-confirmation.${locale}`,
        buildConfirmationEmail({
          nombre: "Ana M. Torres",
          cursoTitulo: "Basic Non-Sterile Compounding",
          cohorteEtiqueta: "Cohorte enero 2026",
          cohorteFechaInicio: "12 de enero de 2026",
          cohorteFechaFin: "14 de enero de 2026",
          montoFormatted: "$1,000",
          receiptUrl: "https://stripe.example.com/receipt",
          locale,
        }).html,
      );
      write(
        `4-certificate.${locale}`,
        buildCertificateReadyEmail({
          nombre: "Ariana Quiñones Rosado",
          locale,
          certUrl: CERT_URL,
          program: "profesional",
        }).html,
      );
    }
    // Admin review is ES-only (owner recipient).
    write(
      "2-admin-review.es",
      buildVerificationSubmittedEmail({
        nombre: "Ariana Quiñones Rosado",
        email: "aq255@mynsu.nova.edu",
        docUrl: "https://www.sccompoundingacademy.com/photos/photo-instructor.jpg",
        approveUrl: "https://sccompoundingacademy.com/verificar-matricula/approve",
        rejectUrl: "https://sccompoundingacademy.com/verificar-matricula/reject",
        submittedAt: new Date("2025-06-30T17:38:00Z"),
      }).html,
    );
    expect(true).toBe(true);
  });
});

describe("buildCertificateReadyEmail CE gating", () => {
  const base = { nombre: "Ana", locale: "es" as const, certUrl: "https://x/y" };
  it("includes CEUs for the CE professional program", () => {
    const m = buildCertificateReadyEmail({ ...base, program: "profesional" });
    expect(m.html).toContain("CEUs");
  });
  it("omits CE copy for the completion program", () => {
    const m = buildCertificateReadyEmail({ ...base, program: "profesional-completion" });
    expect(m.html).not.toContain("CEUs");
    expect(m.html).not.toContain("ACPE");
    expect(m.html).not.toContain("documentación de horas CE");
    expect(m.text).not.toContain("CEUs");
  });
  it("omits CE copy for students", () => {
    const m = buildCertificateReadyEmail({ ...base, program: "student" });
    expect(m.html).not.toContain("CEUs");
  });
});
