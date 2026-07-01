import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { LogoFullInverse } from "@/components/brand";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Acceso al portal · SCCA",
  robots: { index: false, follow: false },
};

export default async function PortalLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Already signed in → skip the form and go straight to the dashboard.
  const session = await auth();
  if (session?.user) {
    redirect(`/${locale}/portal`);
  }

  return <LoginPanel locale={locale} />;
}

function LoginPanel({ locale }: { locale: string }) {
  const t = useTranslations("portal.login");
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      {/* Centered glass modal over the shared portal backdrop. */}
      <div
        className="glass-modal relative z-[1] w-full max-w-[400px] rounded-[20px] border border-white/50 p-8 sm:p-10"
        style={{ boxShadow: "var(--shadow-deep)" }}
      >
        <LogoFullInverse shieldClass="h-9 w-auto" className="mb-7" />
        <h1 className="font-heading text-teal-deep text-2xl font-extrabold tracking-[-0.02em]">
          {t("title")}
        </h1>
        <p className="text-gray-700 mt-2 text-sm leading-relaxed">{t("subtitle")}</p>

        <LoginForm locale={locale} />

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-teal-deep hover:text-teal underline underline-offset-2">
            ← {t("backToHome")}
          </Link>
        </p>
      </div>
    </div>
  );
}
