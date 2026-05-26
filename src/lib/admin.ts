/**
 * Admin authorization for the owner-facing `/portal/admin` view AND for
 * unrestricted content-preview access throughout the student portal.
 *
 * There is no admin role on the `users` table — the portal's only auth
 * is the student magic-link. Admin access is instead an allowlist of
 * emails in the `ADMIN_EMAILS` env var (comma-separated). The owner
 * signs in through the same magic-link flow; if their email is on the
 * list, the admin pages render, otherwise they are bounced.
 *
 * The same allowlist also unlocks the *student* surfaces — module PDFs,
 * pre-tests, post-tests, cert preview — without requiring `paidAt` or
 * a passing post-test. This lets the academy preview the full learner
 * flow from `sccapr2025@gmail.com` (the academy mailbox) without
 * running a real Stripe transaction or polluting the cert sequence.
 * The cert API issues a preview PDF (no DB row) for these emails.
 *
 * Keeping this in an env var (not the DB) means granting/revoking
 * access is a Vercel settings change with no migration, which suits a
 * single-owner business with at most a handful of admins.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.trim().toLowerCase());
}
