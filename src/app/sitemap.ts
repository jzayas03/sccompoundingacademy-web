import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/siteUrl";

const PATHS: Record<string, { es: string; en: string }> = {
  home: { es: "/es", en: "/en" },
  courses: { es: "/es/cursos", en: "/en/courses" },
  contact: { es: "/es/contacto", en: "/en/contact" },
  privacy: { es: "/es/legal/privacidad", en: "/en/legal/privacy" },
  terms: { es: "/es/legal/terminos", en: "/en/legal/terms" },
};

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [];
  const lastModified = new Date();
  for (const paths of Object.values(PATHS)) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${base}${paths[locale]}`,
        lastModified,
        alternates: {
          languages: Object.fromEntries(routing.locales.map((l) => [l, `${base}${paths[l]}`])),
        },
      });
    }
  }
  return entries;
}
