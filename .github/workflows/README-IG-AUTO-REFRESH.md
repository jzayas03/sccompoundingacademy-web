# Instagram feed auto-refresh — setup guide

This repo automatically refreshes the @santacruzpharmacare posts shown on
the landing page every 6 hours, via two GitHub Actions workflows:

| Workflow | Cadence | What it does |
|---|---|---|
| `refresh-ig.yml` | Every 6 hours | Pulls latest 4 IG posts via Graph API, downloads thumbnails, commits to main → Vercel auto-deploys |
| `refresh-ig-token.yml` | Monthly (1st @ 03:00 UTC) | Extends the IG long-lived token's 60-day expiry by another 60 days |

Once configured, this runs forever with **zero manual intervention**.

---

## One-time setup (owner)

### Step 1 · Make @santacruzpharmacare an IG Business account

Required because IG Graph API only exposes data for Business accounts
connected to a Facebook Page.

1. Open Instagram app → @santacruzpharmacare profile → menu → **Settings
   and privacy** → **For professionals** → **Switch to professional
   account** → choose **Business** → category **Pharmaceuticals** or
   **Medical & Health**.
2. When asked to connect a Facebook Page: connect to the **Santa Cruz
   Pharma Care** FB Page (or create one if none exists — required for
   Graph API access).

### Step 2 · Create a Facebook Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com) →
   **My Apps** → **Create App**
2. Use case: **Other** → **Business**
3. App name: `SCCA Feed Refresher` (or similar — only visible to you)
4. Add **Instagram Graph API** product to the app
5. Add **Facebook Login for Business** product (needed to mint the token)

### Step 3 · Get the long-lived token + IG Business User ID

#### Token

1. In your FB Dev App → **Tools** → **Graph API Explorer**
2. Select your app from the dropdown
3. **Generate Access Token** → add permissions: `instagram_basic`,
   `pages_show_list`, `instagram_manage_insights` (last one optional but
   useful for v2 features)
4. Login as the FB user that owns the Page
5. Copy the **short-lived** token from the Explorer
6. Exchange for a **long-lived** (60-day) token via this URL in your
   browser (replace `{APP_ID}`, `{APP_SECRET}`, `{SHORT_LIVED_TOKEN}`
   with real values from your Dev App settings):
   ```
   https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}
   ```
7. The response contains `access_token` — that's your **long-lived
   token**. Copy it.

#### IG Business User ID

In Graph API Explorer (or a browser tab with the long-lived token),
hit this URL:
```
https://graph.facebook.com/v23.0/me/accounts?access_token={LONG_LIVED_TOKEN}
```
Find the Page that's connected to @santacruzpharmacare; copy its `id`,
then query:
```
https://graph.facebook.com/v23.0/{PAGE_ID}?fields=instagram_business_account&access_token={LONG_LIVED_TOKEN}
```
The response includes `instagram_business_account.id` — that's the
**IG Business User ID** the workflow needs (starts with `17841…`
typically).

### Step 4 · Create a fine-grained GitHub PAT

The token-refresh workflow needs permission to update a GitHub Secret.
The default `GITHUB_TOKEN` cannot do this, so we use a Personal Access
Token with the narrow `secrets:write` scope.

1. GitHub → your profile → **Settings** → **Developer settings** →
   **Personal access tokens** → **Fine-grained tokens** → **Generate
   new token**
2. Token name: `SCCA-refresh-ig-secret`
3. Expiration: **1 year** (you'll get a reminder email a week before)
4. Repository access: **Only select repositories** → pick
   `sccompoundingacademy-web`
5. Permissions: under **Repository permissions**, find **Secrets** →
   set to **Read and write**
6. Generate → copy the token

### Step 5 · Add 3 GitHub Secrets to the repo

Go to: GitHub → `sccompoundingacademy-web` repo → **Settings** →
**Secrets and variables** → **Actions** → **New repository secret**.

Add these three (Name → Value):

| Name | Value |
|---|---|
| `IG_LONG_LIVED_TOKEN` | Long-lived token from Step 3 |
| `IG_BUSINESS_USER_ID` | IG Business User ID from Step 3 (the `17841…` number) |
| `GH_PAT_REFRESH_IG` | Fine-grained PAT from Step 4 |

### Step 6 · Trigger the first refresh manually

1. GitHub → repo → **Actions** tab → **Refresh Instagram feed** workflow
   in the left sidebar
2. Click **Run workflow** → **Run workflow** (green button)
3. Wait ~1-2 minutes; if it succeeds you'll see a green ✓ and a new
   commit on `main` named `chore(ig): refresh feed from @santacruzpharmacare`
4. Vercel auto-deploys; check `https://sccompoundingacademy.com/es`
   after ~2 more minutes — the Instagram section should show the latest
   4 posts from the account

### Step 7 · Verify everything works

- **Publish a new post** on @santacruzpharmacare
- **Wait up to 6 hours** (or manually trigger the workflow again from
  Actions tab)
- **Confirm the new post appears** on the landing page

---

## Day-to-day operation

After setup, the workflows run on their own forever. No action needed
unless one of these triggers an email from GitHub:

| Email | Meaning | Fix |
|---|---|---|
| "Refresh Instagram feed failed" (rare) | Graph API rate-limited or returned an error. The previous posts stay on the site — no broken state. | Wait 1 hour and trigger the workflow again from the Actions tab. If it persists, check Step 3 token expiry. |
| "Refresh Instagram token failed" (rare) | Token couldn't be refreshed. The current token continues to work until its actual expiry (~30 days). | Investigate — possibly the FB Page was disconnected from IG or the PAT expired. Re-run Step 3 + 4 if needed. |
| "Your fine-grained personal access token expires in 7 days" | The GitHub PAT (`GH_PAT_REFRESH_IG`) is about to expire. | Repeat Step 4 to mint a new one, update the secret in Step 5. |

---

## Manual override (override an auto-curated post temporarily)

If a post comes in that you don't want featured (e.g., a typo, a draft, a
non-educational post), you have two options:

1. **Delete the post on IG** — at the next refresh cycle it disappears
2. **Manual rotation**: edit `instagramFeatured.items[]` in
   `src/messages/{es,en}.json` directly, commit + push. The next
   scheduled refresh will overwrite your manual edits unless you
   temporarily disable the workflow:
   - GitHub → repo → Actions → **Refresh Instagram feed** → **⋯** →
     **Disable workflow**
   - Re-enable when ready to resume auto-refresh

---

## How to change the cadence or number of posts

- **Cadence**: edit `cron: "0 */6 * * *"` in `.github/workflows/refresh-ig.yml`.
  Format is standard cron (UTC). Examples:
  - `"0 */3 * * *"` = every 3 hours
  - `"0 8,20 * * *"` = twice daily at 8 AM and 8 PM UTC
- **Number of posts**: add a `IG_POST_COUNT` secret (Step 5) with value
  e.g. `6`. Default is 4. If you go above 4, also update the
  `InstagramFeatured` component's grid (`lg:grid-cols-4` → `lg:grid-cols-6`).
