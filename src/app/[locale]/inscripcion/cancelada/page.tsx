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
      locale === "es" ? "Pago cancelado · SCCA" : "Payment cancelled · SCCA",
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CancelledPage />;
}

function CancelledPage() {
  const t = useTranslations("inscripcion.cancelled");
  return (
    <section className="bg-white">
      <Container className="max-w-2xl py-20 sm:py-24 lg:py-28 text-center">
        <h1 className="font-heading text-teal-deep text-3xl font-bold tracking-[-0.015em] sm:text-4xl lg:text-5xl">
          {t("title")}
        </h1>
        <p className="text-gray-900 mt-5 text-base leading-relaxed sm:text-lg">{t("body")}</p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/inscripcion"
            className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift focus-visible:ring-chartreuse font-heading inline-flex h-12 items-center justify-center rounded-md px-6 text-sm font-semibold ring-1 transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none motion-safe:hover:-translate-y-px"
          >
            {t("ctaRetry")}
          </Link>
          <Link
            href="/contacto"
            className="border-teal-deep text-teal-deep bg-white shadow-soft hover:bg-teal-deep hover:text-off-white hover:shadow-lift focus-visible:ring-chartreuse font-heading inline-flex h-12 items-center justify-center rounded-md border-2 px-6 text-sm font-semibold transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none motion-safe:hover:-translate-y-px"
          >
            {t("ctaContact")}
          </Link>
        </div>
      </Container>
    </section>
  );
}
