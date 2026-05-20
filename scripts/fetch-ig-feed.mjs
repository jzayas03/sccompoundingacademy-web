#!/usr/bin/env node
/**
 * fetch-ig-feed.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * Pull the N most recent posts from @santacruzpharmacare via the Instagram
 * Graph API, update src/messages/{es,en}.json `instagramFeatured.items[]`
 * with the new URLs + captions, and download each post's thumbnail to
 * /public/instagram/post-N.jpg.
 *
 * Designed to run inside a GitHub Action on a 6-hour cron so the live site
 * always shows the latest 4 posts without any manual intervention. The
 * workflow itself handles commit + push; this script only touches files.
 *
 * Required env vars:
 *   IG_LONG_LIVED_TOKEN   — long-lived access token (60-day expiry) for
 *                            the IG Business account. Refreshed monthly
 *                            by refresh-ig-token.mjs.
 *   IG_BUSINESS_USER_ID   — the IG Business User ID (NOT the IG handle).
 *                            Get via Graph API: `me/accounts` → look at
 *                            `instagram_business_account.id` of the
 *                            connected Facebook Page.
 *
 * Optional env vars:
 *   IG_POST_COUNT         — how many posts to surface (default: 4)
 *   IG_GRAPH_VERSION      — Graph API version (default: v23.0)
 *
 * Safety: if the Graph API call fails (rate limit, expired token, network
 * error), the script exits non-zero WITHOUT touching any files. This
 * preserves the previously-good data on the site. The workflow's status
 * checks surface the failure.
 * ─────────────────────────────────────────────────────────────────────────
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ES = resolve(ROOT, "src/messages/es.json");
const EN = resolve(ROOT, "src/messages/en.json");
const OUT_DIR = resolve(ROOT, "public/instagram");

const TOKEN = process.env.IG_LONG_LIVED_TOKEN;
const IG_USER_ID = process.env.IG_BUSINESS_USER_ID;
const POST_COUNT = Number(process.env.IG_POST_COUNT ?? "4");
const GRAPH_VERSION = process.env.IG_GRAPH_VERSION ?? "v23.0";

if (!TOKEN || !IG_USER_ID) {
  // Graceful skip rather than a hard failure. The Instagram feed is a
  // nice-to-have decorative section; when the Graph API credentials
  // are not configured the landing page just shows the last committed
  // feed. Exiting 0 keeps the scheduled `refresh-ig.yml` workflow green
  // (it will simply detect no changes) instead of emailing a failure
  // every 6 hours. Set IG_LONG_LIVED_TOKEN + IG_BUSINESS_USER_ID as
  // GitHub Secrets to enable the live refresh.
  console.warn(
    "[fetch-ig-feed] IG_LONG_LIVED_TOKEN / IG_BUSINESS_USER_ID not set — " +
      "skipping Instagram refresh (feed stays at its last committed state).",
  );
  process.exit(0);
}

const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

/**
 * Trim a caption to a single readable line for the card. IG captions are
 * often long, multiline, hashtag-heavy. We take the first paragraph,
 * strip leading/trailing hashtags, and cap length.
 */
function cleanCaption(raw) {
  if (!raw) return "";
  // First non-empty line
  const firstLine = raw
    .split("\n")
    .map((s) => s.trim())
    .find((s) => s.length > 0) ?? "";
  // Strip hashtag clusters at the end of the line
  const noTrailingTags = firstLine.replace(/(\s+#\w+)+\s*$/, "").trim();
  // Cap at 140 chars with ellipsis if longer
  if (noTrailingTags.length <= 140) return noTrailingTags;
  return noTrailingTags.slice(0, 137).trimEnd() + "…";
}

/**
 * Pick the right thumbnail URL for the post based on media type. IG returns
 * different fields depending on whether the post is an image, video, or
 * carousel album.
 */
function pickThumbnailUrl(media) {
  // Video → thumbnail_url is the still frame; media_url is the .mp4
  if (media.media_type === "VIDEO") {
    return media.thumbnail_url ?? media.media_url;
  }
  // CAROUSEL_ALBUM → media_url is the first child by default in Graph API
  // IMAGE → media_url is the image directly
  return media.media_url;
}

async function fetchFeed() {
  const url =
    `${GRAPH}/${IG_USER_ID}/media` +
    `?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp` +
    `&limit=${POST_COUNT}` +
    `&access_token=${TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Graph API ${res.status}: ${body.slice(0, 500)}\n` +
        `If 'OAuthException', the token may be expired — run refresh-ig-token.mjs.\n` +
        `If 'rate limit', wait and retry in 1 hour.`,
    );
  }
  const json = await res.json();
  const data = json.data ?? [];
  if (data.length === 0) {
    throw new Error("Graph API returned 0 posts — empty account or filter issue.");
  }
  return data;
}

async function downloadThumb(url, outPath) {
  const res = await fetch(url, {
    // IG CDN sometimes requires a real-browser UA to serve image bytes
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SCCA-feed-refresher/1.0)" },
  });
  if (!res.ok) throw new Error(`thumb download ${res.status} ${url.slice(0, 80)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buf);
  return buf.byteLength;
}

(async () => {
  console.log(`[fetch-ig-feed] Fetching latest ${POST_COUNT} posts from IG user ${IG_USER_ID}…`);
  const posts = await fetchFeed();
  console.log(`[fetch-ig-feed] Received ${posts.length} posts from Graph API.`);

  await mkdir(OUT_DIR, { recursive: true });

  // Build the new items[] payload + download each thumbnail. We build both
  // the ES + EN versions identically (IG captions aren't translated; v3
  // could add Translation API).
  const items = [];
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const thumbUrl = pickThumbnailUrl(post);
    if (!thumbUrl) {
      console.warn(`[fetch-ig-feed] post ${post.id} has no usable thumb — skipping`);
      continue;
    }
    const outRel = `/instagram/post-${i + 1}.jpg`;
    const outAbs = resolve(ROOT, "public" + outRel);
    try {
      const bytes = await downloadThumb(thumbUrl, outAbs);
      console.log(`✓ post ${i + 1}: ${post.permalink}`);
      console.log(`  → ${outRel} (${(bytes / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`✗ post ${i + 1} thumb failed: ${err.message}`);
      throw err; // abort the run so we don't half-update
    }
    items.push({
      caption: cleanCaption(post.caption),
      href: post.permalink,
      src: outRel,
    });
  }

  if (items.length < POST_COUNT) {
    throw new Error(
      `Only ${items.length}/${POST_COUNT} posts processed successfully — aborting to preserve previous data.`,
    );
  }

  // Write the new items[] to both locales. Read → modify → write so we
  // don't disturb sibling keys.
  for (const path of [ES, EN]) {
    const raw = await readFile(path, "utf8");
    const json = JSON.parse(raw);
    if (!json.instagramFeatured) {
      throw new Error(`${path} missing instagramFeatured key — bailing.`);
    }
    json.instagramFeatured.items = items;
    // Preserve the original 2-space indentation + trailing newline that
    // the rest of the repo uses (matches prettier config).
    await writeFile(path, JSON.stringify(json, null, 2) + "\n");
    console.log(`✓ updated ${path.replace(ROOT, ".")}`);
  }

  console.log("[fetch-ig-feed] Done.");
})().catch((err) => {
  console.error(`[fetch-ig-feed] FAILED: ${err.message}`);
  process.exit(1);
});
