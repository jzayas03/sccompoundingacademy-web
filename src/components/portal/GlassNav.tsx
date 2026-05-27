import { useTranslations } from "next-intl";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { LogoFullInverse } from "@/components/brand";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { logoutAction } from "@/app/[locale]/(portal)/portal/actions";
import { PortalLocaleSwitch } from "@/components/portal/PortalLocaleSwitch";

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
 * The portal-flavored `PortalLocaleSwitch` lives next to those actions
 * so a learner who signed in through the wrong locale (or just wants
 * to switch) doesn't have to sign out first. The wrapper suppresses
 * itself on in-progress pre-test / post-test routes to avoid wiping
 * answer state mid-assessment.
 */
export async function GlassNav() {
  const session = await auth();
  const isSignedIn = Boolean(session?.user?.email);
  const isAdmin = isAdminEmail(session?.user?.email);
  const locale = (await getLocale()) === "en" ? "en" : "es";
  return (
    <GlassNavView isSignedIn={isSignedIn} isAdmin={isAdmin} locale={locale} />
  );
}

function GlassNavView({
  isSignedIn,
  isAdmin,
  locale,
}: {
  isSignedIn: boolean;
  isAdmin: boolean;
  locale: "es" | "en";
}) {
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
          <PortalLocaleSwitch currentLocale={locale} />
          {isAdmin ? (
            <Link
              href="/portal/admin"
              className="bg-teal-deep text-off-white hover:bg-teal font-heading inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold transition-colors"
            >
              Admin
            </Link>
          ) : null}
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
