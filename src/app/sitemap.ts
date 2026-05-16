import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const PATHS: Record<string, { es: string; en: string }> = {
  home: { es: "/es", en: "/en" },
  courses: { es: "/es/cursos", en: "/en/courses" },
  contact: { es: "/es/contacto", en: "/en/contact" },
  privacy: { es: "/es/legal/privacidad", en: "/en/legal/privacy" },
  terms: { es: "/es/legal/terminos", en: "/en/legal/terms" },
};

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const lastModified = new Date();
  for (const paths of Object.values(PATHS)) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${BASE}${paths[locale]}`,
        lastModified,
        alternates: {
          languages: Object.fromEntries(routing.locales.map((l) => [l, `${BASE}${paths[l]}`])),
        },
      });
    }
  }
  return entries;
}
