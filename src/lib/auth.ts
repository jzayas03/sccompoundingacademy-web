import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { Resend as ResendSDK } from "resend";
import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { buildMagicLinkEmail } from "@/lib/emails/magic-link";

/**
 * Auth.js v5 — full Node-runtime instance. Spreads the shared
 * `authConfig` (session strategy, pages, base providers stub) and then
 * adds the things middleware cannot use because they would explode the
 * Edge bundle: the Drizzle adapter and the Resend SDK provider.
 *
 * Magic-link emails reuse the same `RESEND_API_KEY` + `EMAIL_FROM` +
 * `EMAIL_REPLY_TO` env vars already wired for the inscription
 * confirmation flow, and they render through the SCCA-branded template
 * (`buildMagicLinkEmail`). Overriding `sendVerificationRequest` instead
 * of letting the default Resend provider send a generic email keeps the
 * visual identity consistent with the rest of our transactional mail.
 *
 * Session strategy is `jwt` (defined in `authConfig`) so the middleware
 * can validate cookies on the Edge without a DB round-trip. The Drizzle
 * adapter still owns user / account / verification-token persistence —
 * JWTs only replace the `sessions` table.
 */

const EMAIL_FROM = process.env.EMAIL_FROM ?? "noreply@sccompoundingacademy.com";
const EMAIL_REPLY_TO =
  process.env.EMAIL_REPLY_TO ?? "info@sccompoundingacademy.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";

/**
 * Auth.js plumbs the post-click `callbackUrl` query parameter into the
 * magic-link URL but doesn't expose the originating page's locale on
 * its own. Parsing the callbackUrl back out gives us the only signal
 * that survives. Falls back to `es` for malformed or missing values —
 * matches the canonical portal locale per the i18n pathnames config.
 */
function extractLocaleFromCallbackUrl(magicLinkUrl: string): "es" | "en" {
  try {
    const callbackUrl = new URL(magicLinkUrl).searchParams.get("callbackUrl");
    if (!callbackUrl) return "es";
    const path = callbackUrl.startsWith("http")
      ? new URL(callbackUrl).pathname
      : callbackUrl;
    return path.startsWith("/en/") || path === "/en" ? "en" : "es";
  } catch {
    return "es";
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      apiKey: RESEND_API_KEY,
      from: EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url }) {
        if (!RESEND_API_KEY) {
          console.error(
            "[auth] RESEND_API_KEY missing — magic-link email cannot be sent.",
          );
          return;
        }
        const resend = new ResendSDK(RESEND_API_KEY);
        const { subject, html, text } = buildMagicLinkEmail({
          url,
          locale: extractLocaleFromCallbackUrl(url),
        });
        const { error } = await resend.emails.send({
          from: EMAIL_FROM,
          to: email,
          replyTo: EMAIL_REPLY_TO,
          subject,
          html,
          text,
        });
        if (error) {
          console.error("[auth] magic-link send failed", error);
          throw new Error(`Resend send failed: ${error.message}`);
        }
      },
    }),
  ],
});
