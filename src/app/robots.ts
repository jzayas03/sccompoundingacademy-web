import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Module PDFs are middleware-gated; even so, asking crawlers to
        // skip /modulos/ + /portal/ + /verificar/ avoids surfacing them
        // in search results before the content is finalised.
        disallow: ["/modulos/", "/portal/", "/verificar/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
