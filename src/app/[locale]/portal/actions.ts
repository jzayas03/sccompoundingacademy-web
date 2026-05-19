"use server";

import { signOut } from "@/lib/auth";

/**
 * Logout server action — clears the Auth.js session cookie + DB session
 * row, then redirects the browser to the public landing root. Used by
 * the dashboard sign-out form.
 */
export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
