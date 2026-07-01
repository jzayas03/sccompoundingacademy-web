import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { heading, accent, mono } from "@/app/fonts";
import { SkipLink } from "@/components/layout/SkipLink";

/**
 * Root locale layout — owns the `<html>` + `<body>` + i18n context.
 *
 * Header + Footer used to live here, but PR 8 split the locale tree
 * into two route groups so the marketing surfaces and the portal can
 * carry their own chrome without one bleeding into the other:
 *
 *   - `[locale]/(marketing)/layout.tsx` — Header + Footer (landing + cursos
 *     + contacto + inscripcion + legal docs)
 *   - `[locale]/(portal)/portal/layout.tsx` — GlassNav + MeshBackground
 *     (everything under /[locale]/portal/*)
 *
 * Anything genuinely global — locale provider, skip-link, font CSS vars —
 * still lives here so both groups inherit it.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "es" | "en")) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale} className={`${heading.variable} ${accent.variable} ${mono.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <SkipLink />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
