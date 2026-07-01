import { useTranslations } from "next-intl";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { LogoFull } from "@/components/brand";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { logoutAction } from "@/app/[locale]/(portal)/portal/actions";
import { PortalLocaleSwitch } from "@/components/portal/PortalLocaleSwitch";
import { AdminPortalToggle } from "@/components/portal/AdminPortalToggle";

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
    <GlassNavView
      isSignedIn={isSignedIn}
      isAdmin={isAdmin}
      locale={locale}
      email={session?.user?.email ?? ""}
    />
  );
}

function GlassNavView({
  isSignedIn,
  isAdmin,
  locale,
  email,
}: {
  isSignedIn: boolean;
  isAdmin: boolean;
  locale: "es" | "en";
  email: string;
}) {
  const t = useTranslations("portal.nav");
  const initials = email.slice(0, 2).toUpperCase();
  return (
    <header className="glass-nav sticky top-0 z-50 w-full border-b border-[rgba(25,85,97,0.10)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/portal" className="flex items-center" aria-label={t("homeAria")}>
          <LogoFull shieldClass="h-8 w-auto" />
        </Link>

        <div className="flex items-center gap-3">
          <PortalLocaleSwitch currentLocale={locale} />
          {isAdmin ? (
            <AdminPortalToggle
              label={t("previewLabel")}
              profesionalLabel={t("previewProfesional")}
              estudianteLabel={t("previewEstudiante")}
            />
          ) : null}
          {isAdmin ? (
            <span className="bg-chartreuse text-teal-deep font-heading rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.06em] uppercase">
              {t("adminBadge")}
            </span>
          ) : null}
          {isSignedIn ? (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="bg-teal-deep text-chartreuse font-heading flex h-[30px] w-[30px] items-center justify-center rounded-full text-[11.5px] font-bold">
                  {initials}
                </span>
                <span className="text-gray-700 max-w-[150px] truncate text-[13px]">{email}</span>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-teal-deep hover:text-teal focus-visible:ring-chartreuse font-heading rounded-sm border-b border-[rgba(25,85,97,0.3)] pb-px text-[13px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
                >
                  {t("logout")}
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/"
              className="text-teal-deep hover:text-teal focus-visible:ring-chartreuse font-heading rounded-sm text-sm font-semibold underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
            >
              ← {t("backToHome")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
