import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/glass/GlassCard";
import { Link } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Revisa tu correo · SCCA",
  robots: { index: false, follow: false },
};

export default async function PortalVerifyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <VerifyPanel />;
}

function VerifyPanel() {
  const t = useTranslations("portal.verify");
  return (
    <Container className="max-w-lg py-20 sm:py-24 lg:py-28">
      <GlassCard className="p-8 sm:p-10 text-center">
        {/* Big chartreuse envelope check — visual cue that the email is out. */}
        <svg
          aria-hidden
          viewBox="0 0 64 64"
          className="mx-auto h-16 w-16"
        >
          <circle cx="32" cy="32" r="32" className="fill-chartreuse" />
          <path
            d="M18 26l14 10 14-10v18a3 3 0 01-3 3H21a3 3 0 01-3-3V26z"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-teal-deep"
          />
          <path
            d="M18 26l14 10 14-10"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-teal-deep"
          />
        </svg>

        <p className="font-heading text-teal-deep/80 mt-6 flex items-center justify-center text-xs font-semibold tracking-[0.18em] uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-gray-900 mt-3 text-base leading-relaxed">
          {t("body")}
        </p>
        <p className="text-gray-700 mt-3 text-sm">{t("hint")}</p>

        <p className="mt-8 text-sm">
          <Link
            href="/portal/login"
            className="text-teal-deep hover:text-teal underline underline-offset-2"
          >
            {t("tryAgain")}
          </Link>
        </p>
      </GlassCard>
    </Container>
  );
}
