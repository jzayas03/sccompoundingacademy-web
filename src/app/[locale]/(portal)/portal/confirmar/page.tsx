import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { parseConfirmTarget } from "@/lib/portal/magic-link-confirm";
import { ConfirmButton } from "./confirm-button";

export const metadata: Metadata = {
  title: "Confirma tu acceso · SCCA",
  robots: { index: false, follow: false },
};

/**
 * Magic-link interstitial. The sign-in email lands here instead of on
 * the token-consuming Auth.js callback, so email security scanners that
 * prefetch links can no longer burn the single-use token — it is only
 * redeemed when the student presses the button (a client-side
 * navigation; the callback URL never appears in an <a href> a crawler
 * could follow). See src/lib/portal/magic-link-confirm.ts.
 */
export default async function PortalConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ target?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { target: rawTarget } = await searchParams;
  const target = parseConfirmTarget(rawTarget);
  return <ConfirmPanel target={target} />;
}

function ConfirmPanel({ target }: { target: string | null }) {
  const t = useTranslations("portal.confirm");
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div
        className="glass-modal relative z-[1] w-full max-w-[400px] rounded-[20px] border border-white/50 p-8 sm:p-10"
        style={{ boxShadow: "var(--shadow-deep)" }}
      >
        {/* Chartreuse-tinted key badge — sibling of the verify page's envelope */}
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
            <circle cx="7" cy="10" r="4" />
            <path d="M11 10h6.5M15 10v2.5M17.5 10v2.5" />
          </svg>
        </span>

        <h1 className="font-heading text-teal-deep text-2xl font-extrabold tracking-[-0.02em]">
          {target ? t("title") : t("invalidTitle")}
        </h1>
        <p className="text-gray-700 mt-2 text-sm leading-relaxed">
          {target ? t("body") : t("invalidBody")}
        </p>

        {target ? (
          <ConfirmButton target={target} />
        ) : (
          <p className="mt-7 text-sm">
            <Link
              href="/portal/login"
              className="text-teal-deep hover:text-teal inline-flex items-center gap-1.5 font-semibold"
            >
              ← {t("requestNew")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
