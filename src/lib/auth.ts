import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { Resend as ResendSDK } from "resend";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { buildMagicLinkEmail } from "@/lib/emails/magic-link";

/**
 * Auth.js v5 configuration for the SCCA student portal.
 *
 * Email-only sign-in via magic links delivered through Resend — we reuse
 * the same `RESEND_API_KEY` + `EMAIL_FROM` + `EMAIL_REPLY_TO` env vars
 * already wired for the inscription confirmation flow, plus our branded
 * email template (`buildMagicLinkEmail`). The provider default would send
 * a bare Resend email; overriding `sendVerificationRequest` lets us match
 * the rest of the SCCA transactional emails visually.
 *
 * Session strategy is `database` so the Drizzle adapter handles persistence
 * (matches the schema in `db/schema.ts`). Cookies last 30 days with a
 * 24-hour sliding refresh.
 *
 * Sign-in / verify pages live under the i18n-routed portal namespace
 * (`/[locale]/portal/...`); pages are wired in PR 2 of the portal milestone.
 */

const EMAIL_FROM = process.env.EMAIL_FROM ?? "noreply@sccompoundingacademy.com";
const EMAIL_REPLY_TO =
  process.env.EMAIL_REPLY_TO ?? "info@sccompoundingacademy.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
          locale: "es",
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
  pages: {
    signIn: "/es/portal/login",
    verifyRequest: "/es/portal/verify",
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
});
