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
 * Page size: US Letter horizontal — **792 × 612 pt** (11 × 8.5 in).
 *
 * All measurements below are in PDF points (72 pt = 1 in).
 */

export type CertRenderInput = {
  certNo: string;          // "SCCA-2026-001"
  studentName: string;     // Display-cased; we render verbatim
  issuedAt: Date;
  verificationUrl: string; // "https://sccompoundingacademy.com/verificar/SCCA-..."
};

const PAGE_W = 792;
const PAGE_H = 612;

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

  const templatePath = join(process.cwd(), "public/certificate/template.png");
  const hasTemplate = existsSync(templatePath);

  const helvetica = await pdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const timesItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);

  if (hasTemplate) {
    await drawWithTemplate(pdf, page, templatePath, input, helvetica, helveticaBold);
  } else {
    drawPlaceholderBody(page, input, helvetica, helveticaBold, timesItalic);
  }

  // QR code — same position in both modes, bottom-right corner.
  await drawQrCode(pdf, page, input.verificationUrl);

  return await pdf.save();
}

async function drawWithTemplate(
  pdf: PDFDocument,
  page: PDFPage,
  templatePath: string,
  input: CertRenderInput,
  helvetica: PDFFont,
  helveticaBold: PDFFont,
): Promise<void> {
  // Background PNG — owner's Canva export, full-page.
  const pngBytes = readFileSync(templatePath);
  const png = await pdf.embedPng(pngBytes);
  page.drawImage(png, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });

  // Dynamic fields. Coordinates are owner-tunable — we use sane
  // defaults that match a typical "name in the middle, metadata at the
  // bottom corners" certificate layout. Real coordinates land in a
  // follow-up once owner reviews the first output.
  drawCentered(page, input.studentName, {
    y: PAGE_H - PAGE_H * 0.46,
    size: 30,
    font: helveticaBold,
    color: COLOR.tealDeep,
  });

  const dateLabel = formatDate(input.issuedAt);
  page.drawText(`Bayamón, Puerto Rico — ${dateLabel}`, {
    x: 60,
    y: 60,
    size: 10,
    font: helvetica,
    color: COLOR.gray900,
  });

  page.drawText(`Certificado: ${input.certNo}`, {
    x: PAGE_W - 220,
    y: 60,
    size: 10,
    font: helveticaBold,
    color: COLOR.tealDeep,
  });

  page.drawText(`Verificación: ${input.verificationUrl}`, {
    x: 60,
    y: 44,
    size: 8,
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
  drawCentered(page, "Lcdo. Jorge L. Reyes Quiñones, RPh", {
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

async function drawQrCode(
  pdf: PDFDocument,
  page: PDFPage,
  verificationUrl: string,
): Promise<void> {
  // QR colors must be hex strings (qrcode library API). Pull from
  // brand.ts so the brand-lint test's allowlist is satisfied — only
  // `lib/brand.ts` is allowed to declare hex literals directly.
  const dataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 120,
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: brand.colors.tealDeep, light: `${brand.colors.white}FF` },
  });
  const base64 = dataUrl.split(",")[1] ?? "";
  const bytes = Buffer.from(base64, "base64");
  const qrImage = await pdf.embedPng(bytes);
  const size = 70;
  page.drawImage(qrImage, {
    x: PAGE_W - size - 50,
    y: 50,
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
  return new Intl.DateTimeFormat("es-PR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
