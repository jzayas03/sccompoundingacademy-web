import { handlers } from "@/lib/auth";

/**
 * Auth.js v5 catch-all route — exposes GET + POST handlers for
 * `/api/auth/signin`, `/api/auth/callback/resend`, `/api/auth/session`,
 * `/api/auth/csrf`, etc. The list of sub-routes is determined by Auth.js
 * based on the providers configured in `lib/auth.ts`.
 *
 * Lives outside the i18n route group so the existing next-intl middleware
 * (matcher excludes `/api/*`) does not redirect auth callbacks.
 */
export const { GET, POST } = handlers;
