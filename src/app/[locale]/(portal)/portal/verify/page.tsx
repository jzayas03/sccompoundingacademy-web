import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
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
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div
        className="glass-modal relative z-[1] w-full max-w-[400px] rounded-[20px] border border-white/50 p-8 sm:p-10"
        style={{ boxShadow: "var(--shadow-deep)" }}
      >
        {/* Chartreuse-tinted envelope badge */}
        <span className="bg-chartreuse/30 text-teal-deep mb-6 flex h-13 w-13 items-center justify-center rounded-full">
          <svg
            aria-hidden
            width="24"
            height="24"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
            <path d="M3 5.5l7 5.5 7-5.5" />
          </svg>
        </span>

        <h1 className="font-heading text-teal-deep text-2xl font-extrabold tracking-[-0.02em]">
          {t("title")}
        </h1>
        <p className="text-gray-700 mt-2 text-sm leading-relaxed">{t("body")}</p>
        <p className="text-gray-500 mt-3 text-[13px] leading-relaxed">{t("hint")}</p>

        <p className="mt-7 text-sm">
          <Link
            href="/portal/login"
            className="text-teal-deep hover:text-teal inline-flex items-center gap-1.5 font-semibold"
          >
            ← {t("tryAgain")}
          </Link>
        </p>
      </div>
    </div>
  );
}
