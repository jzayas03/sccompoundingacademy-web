#!/usr/bin/env node
/**
 * refresh-ig-token.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * Refresh the long-lived Instagram access token before it expires.
 *
 * IG long-lived tokens live 60 days. Calling refresh on a token that's at
 * least 24 hours old (and not yet expired) extends it for another 60 days
 * — so a monthly cron is the safe cadence: refresh ~30 days into the life
 * of the current token.
 *
 * Required env vars:
 *   IG_LONG_LIVED_TOKEN   — the current token (the one we're refreshing)
 *   GH_PAT_REFRESH_IG     — GitHub Personal Access Token with `secrets:write`
 *                            scope on this repo, used to update the secret
 *                            with the new token (the built-in GITHUB_TOKEN
 *                            cannot write secrets).
 *   GITHUB_REPOSITORY     — set automatically by GitHub Actions
 *                            (e.g. "jzayas03/sccompoundingacademy-web").
 *
 * Output: updates the GitHub Secret `IG_LONG_LIVED_TOKEN` via the GitHub
 * API + writes a brief log entry. If the refresh call fails, exits
 * non-zero WITHOUT touching the secret — the existing token continues
 * to work until its actual expiry, giving us a grace window to investigate.
 * ─────────────────────────────────────────────────────────────────────────
 */
import sodium from "libsodium-wrappers";

const TOKEN = process.env.IG_LONG_LIVED_TOKEN;
const PAT = process.env.GH_PAT_REFRESH_IG;
const REPO = process.env.GITHUB_REPOSITORY;

if (!TOKEN || !PAT || !REPO) {
  console.error(
    "[refresh-ig-token] Missing required env vars. Need: IG_LONG_LIVED_TOKEN, GH_PAT_REFRESH_IG, GITHUB_REPOSITORY",
  );
  process.exit(1);
}

// ── 1. Ask IG to extend the token ─────────────────────────────────────────
const refreshUrl =
  `https://graph.instagram.com/refresh_access_token` +
  `?grant_type=ig_refresh_token&access_token=${TOKEN}`;

console.log("[refresh-ig-token] Calling IG refresh endpoint…");
const refreshRes = await fetch(refreshUrl);
if (!refreshRes.ok) {
  const body = await refreshRes.text();
  console.error(`[refresh-ig-token] Refresh failed: HTTP ${refreshRes.status} ${body}`);
  process.exit(1);
}
const refreshJson = await refreshRes.json();
const newToken = refreshJson.access_token;
const expiresIn = refreshJson.expires_in;

if (!newToken) {
  console.error("[refresh-ig-token] Refresh response missing access_token field:", refreshJson);
  process.exit(1);
}

const newExpiryDays = Math.round(expiresIn / 86400);
console.log(`[refresh-ig-token] Got new token (length ${newToken.length}, expires in ~${newExpiryDays} days)`);

// ── 2. Write the new token back as a GitHub Secret ────────────────────────
// GitHub Secrets API requires the new value to be encrypted with libsodium
// using the repository's public key (sealed box).

async function gh(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${PAT}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status} ${path}: ${body.slice(0, 400)}`);
  }
  // PUT endpoints return 201 No Content
  if (res.status === 204) return null;
  return res.json();
}

console.log(`[refresh-ig-token] Fetching repo public key for ${REPO}…`);
const publicKey = await gh(`/repos/${REPO}/actions/secrets/public-key`);
console.log(`[refresh-ig-token] Got key id ${publicKey.key_id}`);

await sodium.ready;
const keyBytes = sodium.from_base64(publicKey.key, sodium.base64_variants.ORIGINAL);
const messageBytes = sodium.from_string(newToken);
const encrypted = sodium.crypto_box_seal(messageBytes, keyBytes);
const encryptedValue = sodium.to_base64(encrypted, sodium.base64_variants.ORIGINAL);

console.log("[refresh-ig-token] Updating secret IG_LONG_LIVED_TOKEN…");
await gh(`/repos/${REPO}/actions/secrets/IG_LONG_LIVED_TOKEN`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    encrypted_value: encryptedValue,
    key_id: publicKey.key_id,
  }),
});

console.log("[refresh-ig-token] ✓ Token refreshed and secret updated.");
console.log(`[refresh-ig-token] Next refresh recommended in ~30 days; token actually expires in ~${newExpiryDays} days.`);
