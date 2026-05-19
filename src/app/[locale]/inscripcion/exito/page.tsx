import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "es"
        ? "Inscripción confirmada · SCCA"
        : "Enrollment confirmed · SCCA",
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SuccessPage />;
}

function SuccessPage() {
  const t = useTranslations("inscripcion.success");
  return (
    <section className="bg-white">
      <Container className="max-w-2xl py-20 sm:py-24 lg:py-28 text-center">
        {/* Big chartreuse check — visual confirmation. Two-layer SVG so the
            check stroke uses the teal-deep brand token (Tailwind `stroke-`
            utility), keeping all colors token-driven (no hex literals). */}
        <svg aria-hidden viewBox="0 0 64 64" className="mx-auto h-16 w-16">
          <circle cx="32" cy="32" r="32" className="fill-chartreuse" />
          <path
            d="M19 33l9 9 18-20"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-teal-deep"
          />
        </svg>
        <h1 className="font-heading text-teal-deep mt-8 text-3xl font-bold tracking-[-0.015em] sm:text-4xl lg:text-5xl">
          {t("title")}
        </h1>
        <p className="text-gray-900 mt-5 text-base leading-relaxed sm:text-lg">{t("body")}</p>

        {/* Portal access nudge — surfaces the magic-link sign-in path now
            that the Stripe webhook upserts the user row + sets paidAt.
            Sized as a primary CTA above the secondary "back to home" link
            because driving people into the portal is the priority once
            payment clears. */}
        <div className="border-gray-300 mx-auto mt-10 max-w-xl rounded-lg border bg-white p-6 text-left sm:p-7">
          <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
            {t("portalTitle")}
          </p>
          <p className="text-gray-900 mt-3 text-sm leading-relaxed sm:text-base">
            {t("portalBody")}
          </p>
          <Link
            href="/portal/login"
            className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift focus-visible:ring-chartreuse font-heading mt-5 inline-flex h-12 items-center rounded-md px-6 text-sm font-semibold ring-1 transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none sm:text-base motion-safe:hover:-translate-y-px"
          >
            {t("portalCta")} →
          </Link>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/"
            className="border-teal-deep text-teal-deep bg-white shadow-soft hover:bg-teal-deep hover:text-off-white hover:shadow-lift focus-visible:ring-chartreuse font-heading inline-flex h-12 items-center justify-center rounded-md border-2 px-6 text-sm font-semibold transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none motion-safe:hover:-translate-y-px"
          >
            {t("ctaHome")}
          </Link>
        </div>

        <p className="text-gray-700 mt-12 text-sm">
          {t("supportNote")}{" "}
          <a
            href="mailto:info@sccompoundingacademy.com"
            className="text-teal-deep hover:text-teal underline underline-offset-2"
          >
            info@sccompoundingacademy.com
          </a>
        </p>
      </Container>
    </section>
  );
}
