/**
 * Admin authorization for the owner-facing `/portal/admin` view.
 *
 * There is no admin role on the `users` table — the portal's only auth
 * is the student magic-link. Admin access is instead an allowlist of
 * emails in the `ADMIN_EMAILS` env var (comma-separated). The owner
 * signs in through the same magic-link flow; if their email is on the
 * list, the admin pages render, otherwise they are bounced.
 *
 * Keeping this in an env var (not the DB) means granting/revoking admin
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
