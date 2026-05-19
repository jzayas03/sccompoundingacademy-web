import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/glass/GlassCard";
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

  return <LoginPanel />;
}

function LoginPanel() {
  const t = useTranslations("portal.login");
  return (
    <Container className="max-w-lg py-20 sm:py-24 lg:py-28">
      <GlassCard className="p-8 sm:p-10">
        <p className="font-heading text-teal-deep/80 flex items-center text-xs font-semibold tracking-[0.18em] uppercase">
          <span aria-hidden className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm" />
          {t("eyebrow")}
        </p>
        <h1 className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-gray-900 mt-3 text-base leading-relaxed">
          {t("subtitle")}
        </p>

        <LoginForm />

        <p className="mt-8 text-center text-sm">
          <Link
            href="/"
            className="text-teal-deep hover:text-teal underline underline-offset-2"
          >
            ← {t("backToHome")}
          </Link>
        </p>
      </GlassCard>
    </Container>
  );
}
