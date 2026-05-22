/* eslint-disable scca-brand/no-hex-literal */
/**
 * Sample cert renderer — local-only preview tool.
 *
 * Mirrors src/lib/certificates/render.ts (template-mode branch) so we
 * can iterate on overlay coordinates without spinning up the Next.js
 * server. Run with: `node scripts/render-sample-cert.mjs`.
 * Writes the output to `./sample-certificate.pdf` in the repo root.
 *
 * Hex literals inline are owner-tuning friendly; the brand-lint rule
 * is disabled at the top because this dev tool never ships.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

const PAGE_W = 842;
const PAGE_H = 595;

const COLOR = {
  tealDeep: rgb(0x19 / 255, 0x55 / 255, 0x61 / 255),
  gray900: rgb(0x40 / 255, 0x40 / 255, 0x40 / 255),
  gray700: rgb(0x66 / 255, 0x66 / 255, 0x66 / 255),
  white: rgb(1, 1, 1),
};

const SAMPLE = {
  certNo: "SCCA-2026-001",
  studentName: "María del Carmen Rivera Santiago",
  issuedAt: new Date("2026-06-15T12:00:00-04:00"),
  verificationUrl: "https://sccompoundingacademy.com/verificar/SCCA-2026-001",
};

const TEMPLATE_PDF = join(process.cwd(), "public/certificate/template.pdf");
const TEMPLATE_PNG = join(process.cwd(), "public/certificate/template.png");

const pdf = await PDFDocument.create();
const page = pdf.addPage([PAGE_W, PAGE_H]);

const helvetica = await pdf.embedFont(StandardFonts.Helvetica);
const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold);

if (existsSync(TEMPLATE_PDF)) {
  const [embedded] = await pdf.embedPdf(readFileSync(TEMPLATE_PDF), [0]);
  page.drawPage(embedded, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
} else if (existsSync(TEMPLATE_PNG)) {
  const png = await pdf.embedPng(readFileSync(TEMPLATE_PNG));
  page.drawImage(png, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
} else {
  console.error("Template missing — looked for", TEMPLATE_PDF, "and", TEMPLATE_PNG);
  process.exit(1);
}

// White-cover the placeholder body baked into the Canva PNG.
// Main body zone — top at y=378 to keep the wavy banner curve visible:
page.drawRectangle({
  x: 85,
  y: 140,
  width: 672,
  height: 238,
  color: COLOR.white,
});
// Lower signature zone — centered between the bottom logos.
// Tall enough to cover the Canva placeholder signature line + the
// wrong "Jorge Reyes, Rph, FACA, FAVP" text + "Training Instructor"
// — stops just under our ACPE line at y=205.
page.drawRectangle({
  x: 275,
  y: 28,
  width: 290,
  height: 170,
  color: COLOR.white,
});

function drawCentered(text, opts) {
  const width = opts.font.widthOfTextAtSize(text, opts.size);
  page.drawText(text, {
    x: (PAGE_W - width) / 2,
    y: opts.y,
    size: opts.size,
    font: opts.font,
    color: opts.color,
  });
}

drawCentered("THIS IS TO CERTIFY THAT", {
  y: 357,
  size: 11,
  font: helveticaBold,
  color: COLOR.gray900,
});

drawCentered(SAMPLE.studentName, {
  y: 315,
  size: 28,
  font: helveticaBold,
  color: COLOR.tealDeep,
});

drawCentered("has successfully completed", {
  y: 275,
  size: 11,
  font: helvetica,
  color: COLOR.gray900,
});
drawCentered("Basic Non-Sterile Compounding", {
  y: 254,
  size: 14,
  font: helveticaBold,
  color: COLOR.tealDeep,
});
drawCentered("for Pharmacists & Pharmacy Technicians", {
  y: 237,
  size: 10,
  font: helvetica,
  color: COLOR.gray900,
});
drawCentered("18 contact hours · 1.8 CEUs · Knowledge-based, Level 1", {
  y: 221,
  size: 10,
  font: helvetica,
  color: COLOR.gray900,
});
drawCentered("ACPE Provider 0151 — Puerto Rico College of Pharmacists", {
  y: 205,
  size: 9,
  font: helvetica,
  color: COLOR.gray700,
});

page.drawLine({
  start: { x: PAGE_W / 2 - 120, y: 130 },
  end: { x: PAGE_W / 2 + 120, y: 130 },
  thickness: 0.5,
  color: COLOR.gray700,
});
drawCentered("Jorge L. Reyes Quiñones, RPh, FACA, FACVP", {
  y: 104,
  size: 10,
  font: helveticaBold,
  color: COLOR.gray900,
});
drawCentered("Chief Pharmacist · Course Director", {
  y: 90,
  size: 9,
  font: helvetica,
  color: COLOR.gray700,
});

page.drawText(`Certificate ${SAMPLE.certNo}`, {
  x: PAGE_W - 245,
  y: 357,
  size: 9,
  font: helveticaBold,
  color: COLOR.tealDeep,
});

const dateLabel = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
}).format(SAMPLE.issuedAt);
drawCentered(`Issued in Bayamón, Puerto Rico — ${dateLabel}`, {
  y: 78,
  size: 8,
  font: helvetica,
  color: COLOR.gray700,
});
drawCentered(`Verify at ${SAMPLE.verificationUrl}`, {
  y: 67,
  size: 7,
  font: helvetica,
  color: COLOR.gray700,
});

const qrDataUrl = await QRCode.toDataURL(SAMPLE.verificationUrl, {
  width: 320,
  margin: 1,
  errorCorrectionLevel: "M",
  color: { dark: "#195561", light: "#FFFFFFFF" },
});
const qrBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
const qrImg = await pdf.embedPng(qrBytes);
const qrSize = 65;
page.drawImage(qrImg, {
  x: PAGE_W - qrSize - 50,
  y: 280,
  width: qrSize,
  height: qrSize,
});

// Instructor signature — mirrors drawInstructorSignature in render.ts.
const SIG = join(process.cwd(), "public/instructor/firma-jorge-reyes.png");
if (existsSync(SIG)) {
  const sigImg = await pdf.embedPng(readFileSync(SIG));
  const sigWidth = 140;
  const sigHeight = (sigImg.height / sigImg.width) * sigWidth;
  page.drawImage(sigImg, {
    x: PAGE_W / 2 - sigWidth / 2,
    y: 130,
    width: sigWidth,
    height: sigHeight,
  });
}

writeFileSync("sample-certificate.pdf", await pdf.save());
console.log("Wrote ./sample-certificate.pdf");
