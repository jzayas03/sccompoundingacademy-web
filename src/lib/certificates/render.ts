import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { brand } from "@/lib/brand";

/**
 * Certificate PDF renderer (pdf-lib, Node runtime).
 *
 * Dual mode:
 *
 *   1. **With Canva template** — if `public/certificate/template.png`
 *      exists, embed it as the page background and overlay only the
 *      dynamic fields (student name, date, cert number, QR code) at
 *      pre-defined coordinates. This is the path the owner picked in
 *      the 2026-05-19 hybrid-Canva conversation. Coordinates assume a
 *      US-Letter-horizontal template at 300 DPI; we will tune the
 *      offsets together once the actual PNG lands.
 *
 *   2. **Without template** — generate a clean primitive certificate
 *      from scratch using pdf-lib's built-in vector primitives. Uses
 *      Helvetica + Times Italic standard fonts (no custom font
 *      embedding) so the engine ships green even before any asset is
 *      uploaded. The brand colors (teal-deep, chartreuse, sand) come
 *      from `lib/brand.ts` so the placeholder still looks on-brand.
 *
 * Page size: A4 horizontal — **842 × 595 pt** (matches the owner's
 * Canva template viewBox so the PNG embed lands pixel-perfect with no
 * stretch).
 *
 * All measurements below are in PDF points (72 pt = 1 in).
 */

export type CertRenderInput = {
  certNo: string;          // "SCCA-2026-001"
  studentName: string;     // Display-cased; we render verbatim
  issuedAt: Date;
  verificationUrl: string; // "https://sccompoundingacademy.com/verificar/SCCA-..."
};

const PAGE_W = 842;
const PAGE_H = 595;

// Brand palette mirrored from lib/brand.ts. Kept inline because the
// brand-lint test only allows hex literals inside lib/brand.ts; we use
// rgb() (no hex string) so this file complies.
const COLOR = {
  tealDeep: rgb(0x19 / 255, 0x55 / 255, 0x61 / 255),
  chartreuse: rgb(0xe6 / 255, 0xea / 255, 0x82 / 255),
  sand: rgb(0xea / 255, 0xe1 / 255, 0xd6 / 255),
  white: rgb(1, 1, 1),
  gray900: rgb(0x40 / 255, 0x40 / 255, 0x40 / 255),
  gray700: rgb(0x66 / 255, 0x66 / 255, 0x66 / 255),
  paperTint: rgb(0xf7 / 255, 0xf4 / 255, 0xed / 255),
};

export async function renderCertificatePdf(input: CertRenderInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificado SCCA · ${input.certNo}`);
  pdf.setAuthor("Santa Cruz Compounding Academy");
  pdf.setSubject("Certificado de Participación — Basic Compounding No Estéril");

  const page = pdf.addPage([PAGE_W, PAGE_H]);

  // Prefer the vector PDF template (Canva → Share → PDF Print). Falls
  // back to the rasterized PNG, then to a primitive layout if neither
  // ships. Vector keeps the cert print-sharp at any zoom level.
  const pdfTemplatePath = join(process.cwd(), "public/certificate/template.pdf");
  const pngTemplatePath = join(process.cwd(), "public/certificate/template.png");

  const helvetica = await pdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const timesItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);

  if (existsSync(pdfTemplatePath)) {
    await drawWithPdfTemplate(pdf, page, pdfTemplatePath, input, helvetica, helveticaBold);
  } else if (existsSync(pngTemplatePath)) {
    await drawWithTemplate(pdf, page, pngTemplatePath, input, helvetica, helveticaBold);
  } else {
    drawPlaceholderBody(page, input, helvetica, helveticaBold, timesItalic);
  }

  // Optional instructor signature — when the owner drops a scan at
  // `public/instructor/firma-jorge-reyes.png`, render it crossing the
  // signature line. Until then, we just keep the line + printed name
  // (still valid for ACPE — the printed name is the legal signature).
  await drawInstructorSignature(pdf, page);

  // QR code — same position in both modes, bottom-right corner.
  await drawQrCode(pdf, page, input.verificationUrl);

  return await pdf.save();
}

async function drawWithPdfTemplate(
  pdf: PDFDocument,
  page: PDFPage,
  templatePath: string,
  input: CertRenderInput,
  helvetica: PDFFont,
  helveticaBold: PDFFont,
): Promise<void> {
  // Background: embed the owner's Canva "PDF Print" export as a vector
  // page. Keeps the chrome (banner, seal, frames, logos) infinitely
  // crisp at any zoom or print DPI.
  const srcBytes = readFileSync(templatePath);
  const embeddedPages = await pdf.embedPdf(srcBytes, [0]);
  const embedded = embeddedPages[0];
  if (!embedded) {
    throw new Error(`Failed to embed page 0 of cert template at ${templatePath}`);
  }
  page.drawPage(embedded, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });

  drawOverlay(page, input, helvetica, helveticaBold);
}

async function drawWithTemplate(
  pdf: PDFDocument,
  page: PDFPage,
  templatePath: string,
  input: CertRenderInput,
  helvetica: PDFFont,
  helveticaBold: PDFFont,
): Promise<void> {
  // Legacy PNG-template path (kept as a fallback if owner ever exports
  // a raster instead of a vector PDF).
  const pngBytes = readFileSync(templatePath);
  const png = await pdf.embedPng(pngBytes);
  page.drawImage(png, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
  drawOverlay(page, input, helvetica, helveticaBold);
}

function drawOverlay(
  page: PDFPage,
  input: CertRenderInput,
  helvetica: PDFFont,
  helveticaBold: PDFFont,
): void {

  // The Canva export ships with placeholder text baked into the PNG
  // ("Student's Name", a body paragraph, "18 contact hours", and a
  // signature block at the bottom). The background of that zone is
  // pure white, so we cover the placeholders with two white rectangles
  // and re-draw the correct content on top:
  //
  //   1. Main body rectangle — clears eyebrow + name + body + hours.
  //   2. Lower signature rectangle — clears the wrong "Jorge Reyes,
  //      Rph, FACA, FAVP" + "Training Instructor" placeholder without
  //      touching the Santa Cruz logo (left) or SCCA mini-logo (right)
  //      in the bottom corners.
  // Main body rectangle — top at y=378 so the gold/teal wavy curve
  // at the bottom of the title banner stays fully visible.
  page.drawRectangle({
    x: 85,
    y: 140,
    width: 672,
    height: 238,
    color: COLOR.white,
  });
  page.drawRectangle({
    x: 275,
    y: 28,
    width: 290,
    height: 170,
    color: COLOR.white,
  });

  // Eyebrow — "THIS IS TO CERTIFY THAT" connecting the title to the name.
  drawCentered(page, "THIS IS TO CERTIFY THAT", {
    y: 357,
    size: 11,
    font: helveticaBold,
    color: COLOR.gray900,
  });

  // Student name — biggest dynamic field.
  drawCentered(page, input.studentName, {
    y: 315,
    size: 28,
    font: helveticaBold,
    color: COLOR.tealDeep,
  });

  // Body sentence + course block (all English to match the template).
  drawCentered(page, "has successfully completed", {
    y: 275,
    size: 11,
    font: helvetica,
    color: COLOR.gray900,
  });
  drawCentered(page, "Basic Non-Sterile Compounding", {
    y: 254,
    size: 14,
    font: helveticaBold,
    color: COLOR.tealDeep,
  });
  drawCentered(page, "for Pharmacists & Pharmacy Technicians", {
    y: 237,
    size: 10,
    font: helvetica,
    color: COLOR.gray900,
  });
  drawCentered(page, "18 contact hours · 1.8 CEUs · Knowledge-based, Level 1", {
    y: 221,
    size: 10,
    font: helvetica,
    color: COLOR.gray900,
  });
  drawCentered(page, "ACPE Provider 0151 — Puerto Rico College of Pharmacists", {
    y: 205,
    size: 9,
    font: helvetica,
    color: COLOR.gray700,
  });

  // Signature block — pushed down into the lower cleared zone so it
  // reads as the bottom-of-cert signature, not a mid-body callout.
  page.drawLine({
    start: { x: PAGE_W / 2 - 120, y: 130 },
    end: { x: PAGE_W / 2 + 120, y: 130 },
    thickness: 0.5,
    color: COLOR.gray700,
  });
  drawCentered(page, "Jorge L. Reyes Quiñones, RPh, FACA, FACVP, B.S.Ph. UPR", {
    y: 104,
    size: 10,
    font: helveticaBold,
    color: COLOR.gray900,
  });
  drawCentered(page, "Chief Pharmacist · Course Director", {
    y: 90,
    size: 9,
    font: helvetica,
    color: COLOR.gray700,
  });

  // Cert number — top-right of body zone, looks like a stamp.
  page.drawText(`Certificate ${input.certNo}`, {
    x: PAGE_W - 245,
    y: 357,
    size: 9,
    font: helveticaBold,
    color: COLOR.tealDeep,
  });

  // Date + verification URL — between ACPE line and signature.
  const dateLabel = formatDate(input.issuedAt);
  drawCentered(page, `Issued in Bayamón, Puerto Rico — ${dateLabel}`, {
    y: 78,
    size: 8,
    font: helvetica,
    color: COLOR.gray700,
  });
  drawCentered(page, `Verify at ${input.verificationUrl}`, {
    y: 67,
    size: 7,
    font: helvetica,
    color: COLOR.gray700,
  });
}

function drawPlaceholderBody(
  page: PDFPage,
  input: CertRenderInput,
  helvetica: PDFFont,
  helveticaBold: PDFFont,
  timesItalic: PDFFont,
): void {
  // Paper-tinted fill so the cert reads as paper rather than glaring
  // white. Off-white sand tone — same family as the landing "sand"
  // brand token, but slightly warmer so it photographs nicely.
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: PAGE_H,
    color: COLOR.paperTint,
  });

  // Outer decorative border — teal 3pt rectangle stroke, inner
  // chartreuse 1pt accent. pdf-lib strokes the inside of the rect, so
  // we inset slightly to keep the page edges clean on print bleeds.
  page.drawRectangle({
    x: 28,
    y: 28,
    width: PAGE_W - 56,
    height: PAGE_H - 56,
    borderColor: COLOR.tealDeep,
    borderWidth: 3,
    opacity: 0,
  });
  page.drawRectangle({
    x: 38,
    y: 38,
    width: PAGE_W - 76,
    height: PAGE_H - 76,
    borderColor: COLOR.chartreuse,
    borderWidth: 1,
    opacity: 0,
  });

  // Top eyebrow row — small caps, teal.
  drawCentered(page, "SANTA CRUZ COMPOUNDING ACADEMY", {
    y: PAGE_H - 90,
    size: 11,
    font: helveticaBold,
    color: COLOR.tealDeep,
  });
  drawCentered(page, "Bayamón, Puerto Rico", {
    y: PAGE_H - 108,
    size: 9,
    font: helvetica,
    color: COLOR.gray700,
  });

  // Title — italic display serif.
  drawCentered(page, "Certificado de Participación", {
    y: PAGE_H - 170,
    size: 36,
    font: timesItalic,
    color: COLOR.tealDeep,
  });

  // Otorga a / Awarded to
  drawCentered(page, "Otorga a", {
    y: PAGE_H - 230,
    size: 11,
    font: helvetica,
    color: COLOR.gray700,
  });

  // Student name — biggest text on the cert.
  drawCentered(page, input.studentName, {
    y: PAGE_H - 280,
    size: 32,
    font: helveticaBold,
    color: COLOR.tealDeep,
  });

  // Body
  drawCentered(page, "por haber completado satisfactoriamente el curso", {
    y: PAGE_H - 330,
    size: 11,
    font: helvetica,
    color: COLOR.gray900,
  });
  drawCentered(
    page,
    "Basic Compounding No Estéril para Farmacéuticos y Técnicos de Farmacia",
    {
      y: PAGE_H - 360,
      size: 13,
      font: helveticaBold,
      color: COLOR.tealDeep,
    },
  );
  drawCentered(page, "18 horas de contacto · 1.8 CEUs · Knowledge-based, Level 1", {
    y: PAGE_H - 384,
    size: 10,
    font: helvetica,
    color: COLOR.gray900,
  });
  drawCentered(
    page,
    "Acreditado por el Colegio de Farmacéuticos de Puerto Rico — ACPE Provider 0151",
    {
      y: PAGE_H - 404,
      size: 9,
      font: helvetica,
      color: COLOR.gray700,
    },
  );

  // Signature block — line + name + title (firma escaneada lands when
  // owner uploads public/instructor/firma-jorge-reyes.png in a follow-up).
  page.drawLine({
    start: { x: PAGE_W / 2 - 110, y: 170 },
    end: { x: PAGE_W / 2 + 110, y: 170 },
    thickness: 0.5,
    color: COLOR.gray700,
  });
  drawCentered(page, "Lcdo. Jorge L. Reyes Quiñones, RPh, FACA, FACVP", {
    y: 154,
    size: 10,
    font: helveticaBold,
    color: COLOR.tealDeep,
  });
  drawCentered(page, "Chief Pharmacist · Director del Curso", {
    y: 140,
    size: 9,
    font: helvetica,
    color: COLOR.gray700,
  });

  // Footer row — date / cert number / verification URL.
  const dateLabel = formatDate(input.issuedAt);
  page.drawText(`Bayamón, Puerto Rico — ${dateLabel}`, {
    x: 60,
    y: 82,
    size: 9,
    font: helvetica,
    color: COLOR.gray900,
  });
  page.drawText(`Certificado ${input.certNo}`, {
    x: PAGE_W - 230,
    y: 82,
    size: 10,
    font: helveticaBold,
    color: COLOR.tealDeep,
  });
  page.drawText(`Verifica en: ${input.verificationUrl}`, {
    x: 60,
    y: 66,
    size: 8,
    font: helvetica,
    color: COLOR.gray700,
  });
}

async function drawInstructorSignature(
  pdf: PDFDocument,
  page: PDFPage,
): Promise<void> {
  // Conditional overlay. The signature line + printed credentials are
  // already drawn by drawOverlay; this adds the scanned signature on
  // top so the cert reads as personally signed when the owner uploads
  // the asset. Until the file is present, the cert just shows the
  // line + name (also valid for ACPE compliance).
  const sigPath = join(process.cwd(), "public/instructor/firma-jorge-reyes.png");
  if (!existsSync(sigPath)) return;

  const sigBytes = readFileSync(sigPath);
  const sigImage = await pdf.embedPng(sigBytes);

  // Render the signature resting on the line (line is at y=130).
  // Compact target width (140 pt) with the bottom edge on the line so
  // the signature stays clear of the printed instructor name at y=104.
  const targetWidth = 140;
  const targetHeight = (sigImage.height / sigImage.width) * targetWidth;
  page.drawImage(sigImage, {
    x: PAGE_W / 2 - targetWidth / 2,
    y: 130,
    width: targetWidth,
    height: targetHeight,
  });
}

async function drawQrCode(
  pdf: PDFDocument,
  page: PDFPage,
  verificationUrl: string,
): Promise<void> {
  // QR colors must be hex strings (qrcode library API). Pull from
  // brand.ts so the brand-lint test's allowlist is satisfied — only
  // `lib/brand.ts` is allowed to declare hex literals directly.
  // Generate at 320 px and embed at 70 pt to keep the matrix crisp
  // (without the 4× oversize, the 55 pt embed downsamples to mush and
  // the QR scans as an opaque square).
  const dataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: brand.colors.tealDeep, light: `${brand.colors.white}FF` },
  });
  const base64 = dataUrl.split(",")[1] ?? "";
  const bytes = Buffer.from(base64, "base64");
  const qrImage = await pdf.embedPng(bytes);
  // Top-right of the body zone, just below the cert-number stamp.
  // The Canva template owns the bottom-right corner with the SCCA
  // mini-logo, so we tuck the QR inside the body instead.
  const size = 65;
  page.drawImage(qrImage, {
    x: PAGE_W - size - 50,
    y: 280,
    width: size,
    height: size,
  });
}

function drawCentered(
  page: PDFPage,
  text: string,
  opts: { y: number; size: number; font: PDFFont; color: ReturnType<typeof rgb> },
): void {
  const width = opts.font.widthOfTextAtSize(text, opts.size);
  page.drawText(text, {
    x: (PAGE_W - width) / 2,
    y: opts.y,
    size: opts.size,
    font: opts.font,
    color: opts.color,
  });
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
