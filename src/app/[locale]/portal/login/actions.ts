"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export type LoginState = { error?: string } | null;

/**
 * Server action invoked by the login form. Triggers Auth.js's Resend
 * email provider, which generates a verification token, inserts it into
 * the `verificationToken` table, and sends the branded magic-link email
 * via the SDK call wired in `lib/auth.ts`.
 *
 * On success Auth.js redirects the browser to `pages.verifyRequest`
 * (`/es/portal/verify`) — that redirect surfaces as a Next.js internal
 * `NEXT_REDIRECT` error which we deliberately re-throw so the runtime
 * handles it. Any other error (rate-limit, send failure, bad config)
 * comes back as an `AuthError` and we surface a generic message to the
 * client without leaking provider details.
 *
 * The `redirectTo` argument is where the user lands *after* clicking
 * the magic link in their inbox — i.e. the eventual destination, not
 * the immediate post-submit redirect.
 */
export async function signInWithEmailAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "missing" };
  }
  try {
    await signIn("resend", {
      email,
      redirectTo: "/es/portal",
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      console.error("[portal] sign-in failed", error.type);
      return { error: "send-failed" };
    }
    // Re-throw NEXT_REDIRECT (success path) and any other unknown error.
    throw error;
  }
}
