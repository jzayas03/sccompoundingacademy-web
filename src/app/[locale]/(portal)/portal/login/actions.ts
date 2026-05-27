"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

export type LoginState = { error?: string } | null;

function normalizeLocale(value: FormDataEntryValue | null): "es" | "en" {
  return value === "en" ? "en" : "es";
}

/**
 * Server action invoked by the login form. Triggers Auth.js's Resend
 * email provider, which generates a verification token, inserts it into
 * the `verificationToken` table, and sends the branded magic-link email
 * via the SDK call wired in `lib/auth.ts`.
 *
 * We pass `redirect: false` so signIn returns instead of throwing
 * NEXT_REDIRECT — the static `pages.verifyRequest` (es) would otherwise
 * lock every user into the Spanish verify page regardless of the
 * originating locale. After a successful send we issue our own redirect
 * to `/{locale}/portal/verify`. The `redirectTo` arg here is the
 * destination after the email link is clicked.
 *
 * Any other error (rate-limit, send failure, bad config) comes back as
 * an `AuthError` and we surface a generic message to the client without
 * leaking provider details.
 */
export async function signInWithEmailAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const locale = normalizeLocale(formData.get("locale"));
  // Auth.js's Resend provider (via the underlying Email provider's
  // `normalizeIdentifier`) already trims + lowercases the identifier
  // before insert. We mirror that here so the value we pass back to
  // the client (for error messaging) matches what gets persisted, and
  // so any future opt-out of normalizeIdentifier wouldn't silently
  // create case-mismatched user rows.
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return { error: "missing" };
  }
  try {
    await signIn("resend", {
      email,
      redirectTo: `/${locale}/portal`,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      console.error("[portal] sign-in failed", error.type);
      return { error: "send-failed" };
    }
    throw error;
  }
  // `redirect()` throws NEXT_REDIRECT — must run outside the try/catch
  // so the AuthError branch above doesn't swallow it.
  redirect(`/${locale}/portal/verify`);
}
