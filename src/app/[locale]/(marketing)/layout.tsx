import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Marketing route-group layout. Wraps every public-facing surface
 * (landing, cursos, contacto, inscripción, legal docs) with the SCCA
 * Header at top and Footer at bottom. The portal namespace uses its
 * own chrome — see `[locale]/(portal)/portal/layout.tsx`.
 */
export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Header locale={locale as "es" | "en"} />
      <main id="content">{children}</main>
      <Footer />
    </>
  );
}
