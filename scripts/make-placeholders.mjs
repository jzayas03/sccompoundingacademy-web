import sharp from "sharp";
import fs from "node:fs/promises";

// Pull brand hex from the single source of truth so this script stays in sync
// with lib/brand.ts and doesn't trip the no-hex-literal ESLint rule.
const { brand } = await import("../src/lib/brand.ts").catch(async () => {
  // .ts can't be imported by plain node at runtime; parse the file for the hex
  // values we need instead.
  const text = await fs.readFile(new URL("../src/lib/brand.ts", import.meta.url), "utf8");
  const pick = (name) => {
    const m = text.match(new RegExp(`${name}:\\s*"(#[0-9A-Fa-f]{3,8})"`));
    if (!m) throw new Error(`brand color '${name}' not found in src/lib/brand.ts`);
    return m[1];
  };
  return {
    brand: {
      colors: {
        tealDeep: pick("tealDeep"),
        chartreuse: pick("chartreuse"),
        offWhite: pick("offWhite"),
        sand: pick("sand"),
      },
    },
  };
});

const { tealDeep, chartreuse, offWhite, sand } = brand.colors;

await fs.mkdir("public/hero", { recursive: true });

const pharmacistSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
    <rect width="600" height="800" fill="${tealDeep}"/>
    <circle cx="300" cy="300" r="120" fill="${chartreuse}"/>
    <rect x="200" y="420" width="200" height="320" rx="40" fill="${offWhite}"/>
  </svg>`,
);
await sharp(pharmacistSvg).webp({ quality: 80 }).toFile("public/hero/pharmacist-placeholder.webp");

const mortarSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
    <rect width="800" height="800" fill="rgba(0,0,0,0)"/>
    <ellipse cx="400" cy="540" rx="220" ry="60" fill="${sand}" opacity="0.9"/>
    <path d="M180 460 Q400 700 620 460 Z" fill="${sand}"/>
    <rect x="380" y="220" width="40" height="320" rx="18" transform="rotate(15 400 380)" fill="${sand}"/>
  </svg>`,
);
await sharp(mortarSvg).webp({ quality: 80 }).toFile("public/hero/mortar-poster.webp");

console.log(
  `Placeholders written using brand palette (${tealDeep}, ${chartreuse}, ${offWhite}, ${sand}).`,
);
