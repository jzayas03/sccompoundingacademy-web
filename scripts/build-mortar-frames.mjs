import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "blender/renders";
const DST = "public/hero/mortar";
const QUALITY = 78;
const TARGET_FRAMES = 80;

await fs.mkdir(DST, { recursive: true });

let files;
try {
  files = (await fs.readdir(SRC)).filter((f) => /^frame_\d+\.png$/.test(f)).sort();
} catch {
  console.error(`No renders found at ${SRC}. Render in Blender first (Ctrl-F12).`);
  process.exit(1);
}

if (files.length === 0) {
  console.error(`No PNG frames in ${SRC}.`);
  process.exit(1);
}

// Resample to exactly TARGET_FRAMES frames (in case Blender outputs more/fewer)
const step = files.length / TARGET_FRAMES;
const picked = Array.from({ length: TARGET_FRAMES }, (_, i) => files[Math.floor(i * step)]);

const manifest = { frameCount: TARGET_FRAMES, width: 1600, height: 1600, frames: [] };
for (let i = 0; i < picked.length; i++) {
  const inFile = path.join(SRC, picked[i]);
  const outName = `frame_${String(i + 1).padStart(4, "0")}.webp`;
  const outFile = path.join(DST, outName);
  await sharp(inFile).webp({ quality: QUALITY }).toFile(outFile);
  manifest.frames.push(`/hero/mortar/${outName}`);
  process.stdout.write(`\r${i + 1}/${TARGET_FRAMES}`);
}
process.stdout.write("\n");
await fs.writeFile(path.join(DST, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Wrote ${TARGET_FRAMES} WebP frames + manifest.json`);
