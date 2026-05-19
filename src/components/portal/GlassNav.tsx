import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LogoFullInverse } from "@/components/brand";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/app/[locale]/(portal)/portal/actions";

/**
 * Portal-only top navigation — replaces the marketing Header inside
 * `/[locale]/portal/*` routes.
 *
 * Uses the `.glass-nav` utility from globals.css for the medium-
 * intensity blur/translucency that pairs with the MeshBackground in
 * the portal layout. Sticky-top + high z-index so the cert workspace
 * and PDF viewer can scroll under it cleanly.
 *
 * Right-hand actions vary by auth state:
 *   - signed in  → "Salir" submits to `logoutAction` (clears the
 *                  session cookie + DB session row, redirects to /).
 *   - signed out → "Volver al sitio" link back to the public landing.
 *
 * `LocaleSwitch` is intentionally absent — Phase A portal is ES-only
 * (decision 2026-05-19), and surfacing locale toggles here would just
 * surface the gap.
 */
export async function GlassNav() {
  const session = await auth();
  const isSignedIn = Boolean(session?.user?.email);
  return <GlassNavView isSignedIn={isSignedIn} />;
}

function GlassNavView({ isSignedIn }: { isSignedIn: boolean }) {
  const t = useTranslations("portal.nav");
  return (
    <header className="glass-nav sticky top-0 z-50 w-full">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/portal"
          className="flex items-center"
          aria-label={t("homeAria")}
        >
          <LogoFullInverse shieldClass="h-10 w-auto" />
        </Link>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-off-white font-heading inline-flex h-10 items-center rounded-md border px-4 text-sm font-semibold transition-colors"
              >
                {t("logout")}
              </button>
            </form>
          ) : (
            <Link
              href="/"
              className="text-teal-deep hover:text-teal font-heading text-sm font-semibold underline underline-offset-2"
            >
              ← {t("backToHome")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
