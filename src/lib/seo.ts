import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

type Args = {
  locale: "es" | "en";
  title: string;
  description: string;
  pathname: string;
  ogImage?: string;
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function pageMetadata({ locale, title, description, pathname, ogImage }: Args): Metadata {
  const url = `${BASE_URL}/${locale}${pathname === "/" ? "" : pathname}`;
  const altLocales = routing.locales.filter((l) => l !== locale);
  const og = ogImage ?? `/og-image-${locale}.png`;

  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        [...altLocales, locale].map((l) => [
          l,
          `${BASE_URL}/${l}${pathname === "/" ? "" : pathname}`,
        ]),
      ),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Santa Cruz Compounding Academy",
      images: [{ url: og, width: 1200, height: 630 }],
      locale: locale === "es" ? "es_PR" : "en_US",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}
