import sharp from "sharp";
import fs from "node:fs/promises";

// Pull brand hex from lib/brand.ts so this script tracks the spec instead of
// drifting (and satisfies the no-hex-literal rule).
const brandText = await fs.readFile(new URL("../src/lib/brand.ts", import.meta.url), "utf8");
const pick = (name) => {
  const m = brandText.match(new RegExp(`${name}:\\s*"(#[0-9A-Fa-f]{3,8})"`));
  if (!m) throw new Error(`brand color '${name}' not found in src/lib/brand.ts`);
  return m[1];
};
const TEAL_DEEP = pick("tealDeep");
const CHARTREUSE = pick("chartreuse");
const OFF_WHITE = pick("offWhite");

const SHIELD_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 58 58">
  <rect width="58" height="58" rx="14" fill="${TEAL_DEEP}"/>
  <path d="M14 17h16v18c0 7.5 6.2 13.5 13.7 13.5H48v6H28.5C20.5 54.5 14 48 14 40V17Z" fill="${CHARTREUSE}"/>
  <path d="M31 17h14v26h-8.5L31 35.5V17Z" fill="${CHARTREUSE}"/>
  <path d="M18 27l25 24" stroke="${TEAL_DEEP}" stroke-width="6" stroke-linecap="round"/>
  <path d="M18 27l25 24" stroke="${CHARTREUSE}" stroke-width="3" stroke-linecap="round"/>
</svg>
`.trim();

await fs.writeFile("public/icon.svg", SHIELD_SVG);

await sharp(Buffer.from(SHIELD_SVG)).resize(180, 180).png().toFile("public/apple-touch-icon.png");
await sharp(Buffer.from(SHIELD_SVG)).resize(32, 32).png().toFile("public/favicon-32.png");
await sharp(Buffer.from(SHIELD_SVG)).resize(16, 16).png().toFile("public/favicon-16.png");
// One-resolution ICO via sharp — fine for a launch favicon.
await fs.copyFile("public/favicon-32.png", "public/favicon.ico");

function ogSvg(slogan, secondary) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${TEAL_DEEP}"/>
  <g transform="translate(80,140)">
    <text x="0" y="0" font-family="Montserrat, sans-serif" font-weight="800" font-size="84" fill="${CHARTREUSE}">${slogan}</text>
    <text x="0" y="120" font-family="Montserrat, sans-serif" font-weight="600" font-size="40" fill="${OFF_WHITE}">${secondary}</text>
    <text x="0" y="380" font-family="Montserrat, sans-serif" font-weight="700" font-size="32" fill="${OFF_WHITE}">Santa Cruz Compounding Academy</text>
    <text x="0" y="420" font-family="Montserrat, sans-serif" font-weight="500" font-size="24" fill="${OFF_WHITE}" fill-opacity="0.8">USP 795 · USP 800</text>
  </g>
</svg>
`;
}

await sharp(Buffer.from(ogSvg("Educamos para formar", "Bienestar y salud.")))
  .png()
  .toFile("public/og-image-es.png");
await sharp(Buffer.from(ogSvg("We educate to build", "Wellness and health.")))
  .png()
  .toFile("public/og-image-en.png");

console.log(`Static assets built (palette: ${TEAL_DEEP}, ${CHARTREUSE}, ${OFF_WHITE}).`);
