import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "es"
        ? "Revisando tu matrícula · SCCA"
        : "Reviewing your matrícula · SCCA",
    robots: { index: false, follow: false },
  };
}

export default async function RevisionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "inscripcion.revision" });
  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="font-heading text-teal-deep text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-4 text-gray-700">{t("body")}</p>
      <p className="mt-6 text-sm text-gray-700">{t("contact")}</p>
    </main>
  );
}
