import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LandingPageInner />;
}

function LandingPageInner() {
  const t = useTranslations("hero");
  return (
    <main className="bg-teal-deep min-h-screen p-8">
      <h1 className="font-heading text-chartreuse text-4xl">{t("headline")}</h1>
      <p className="text-off-white mt-2">{t("subhead")}</p>
    </main>
  );
}
