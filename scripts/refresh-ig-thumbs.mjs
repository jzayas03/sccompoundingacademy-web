#!/usr/bin/env node
/**
 * refresh-ig-thumbs.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * Refresh the Instagram featured-post thumbnails from the URLs declared in
 * `src/messages/es.json → instagramFeatured.items[].href`.
 *
 * Why: we curate Instagram posts manually (no Graph API, no embed iframe —
 * see InstagramFeatured.tsx for the rationale). When the user wants to
 * rotate featured posts they:
 *   1. Update the four href values in es.json + en.json (keep parity).
 *   2. Run `pnpm refresh:ig` (this script).
 * The script fetches each post page as `facebookexternalhit/1.1` (the same
 * UA Facebook uses for link previews — Instagram exposes og:image to it
 * without auth), downloads the og:image to /public/instagram/post-N.jpg,
 * and reports the result.
 *
 * No deps beyond Node's built-in fetch + fs. No tokens. No rate limits in
 * practice for <10 calls. Re-runnable safely (idempotent — overwrites).
 * ─────────────────────────────────────────────────────────────────────────
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MESSAGES = resolve(ROOT, "src/messages/es.json");
const OUT_DIR = resolve(ROOT, "public/instagram");

const UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

function decodeHtml(s) {
  return s
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

async function ogImage(postUrl) {
  const res = await fetch(postUrl, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${postUrl} → HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (!m) throw new Error(`${postUrl} → no og:image found`);
  // Returns Instagram's canonical 640×640 centre-cropped thumbnail.
  // The signed CDN URL can't be modified (oh/oe params bind to the
  // exact crop directive), so we accept the same crop IG uses in the
  // profile-grid preview — by definition the most familiar framing.
  return decodeHtml(m[1]);
}

async function download(url, outPath) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`download ${url} → HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buf);
  return buf.byteLength;
}

(async () => {
  const messages = JSON.parse(await readFile(MESSAGES, "utf8"));
  const items = messages.instagramFeatured?.items ?? [];
  if (items.length === 0) {
    console.error("No instagramFeatured.items found in es.json");
    process.exit(1);
  }
  await mkdir(OUT_DIR, { recursive: true });
  for (let i = 0; i < items.length; i++) {
    const { href, src } = items[i];
    const outPath = resolve(ROOT, "public" + src);
    try {
      const og = await ogImage(href);
      const size = await download(og, outPath);
      console.log(`✓ ${href}`);
      console.log(`  → ${src}  (${(size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`✗ ${href}`);
      console.error(`  ${err.message}`);
      process.exitCode = 1;
    }
  }
})();
