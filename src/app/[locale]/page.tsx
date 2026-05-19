import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { homepageJsonLd } from "@/lib/structuredData";
import { Hero } from "@/components/marketing/Hero";
import { Confianza } from "@/components/marketing/Confianza";
import { CursosGrid } from "@/components/marketing/CursosGrid";
import { Instructor } from "@/components/marketing/Instructor";
import { Aprenderas } from "@/components/marketing/Aprenderas";
import { ParaQuienEs } from "@/components/marketing/ParaQuienEs";
import { Especialidades } from "@/components/marketing/Especialidades";
import { Galeria } from "@/components/marketing/Galeria";
import { FaqClean } from "@/components/marketing/FaqClean";
import { Ubicacion } from "@/components/marketing/Ubicacion";
import { InstagramFeatured } from "@/components/marketing/InstagramFeatured";
import { CtaFinal } from "@/components/marketing/CtaFinal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title =
    locale === "es"
      ? "Santa Cruz Compounding Academy — Formación práctica en compounding · USP 795 y USP 800"
      : "Santa Cruz Compounding Academy — Practical compounding training · USP 795 & USP 800";
  const description =
    locale === "es"
      ? "Cursos estructurados de compounding farmacéutico para profesionales en Puerto Rico. Práctica supervisada, alineados con USP 795 y 800. Sede en Bayamón."
      : "Structured pharmaceutical compounding courses for professionals in Puerto Rico. Supervised practice, aligned with USP 795 and 800. Campus in Bayamón.";
  return pageMetadata({
    locale: locale as "es" | "en",
    title,
    description,
    pathname: "/",
    // Use a real laboratory photograph for OG / Twitter card preview instead
    // of the locale-specific fallback. 1280×~720 source, fits 1200×630 well.
    ogImage: "/photos/photo-frontispiece.jpg",
  });
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const jsonLd = homepageJsonLd(locale as "es" | "en");
  return (
    <>
      {/* SEO: Organization + LocalBusiness + Course graph. Server-rendered
          so Google reads it on initial crawl without executing JS. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Clean medical-pharma landing — top to bottom:
            Hero           — eyebrow + display headline + 2 CTAs + trust signals + photo
            Confianza      — 3 columns of credentials (affiliated · supervised · USP-aligned)
            CursosGrid     — single-course detail with 3-module breakdown
            Instructor     — course director (Lcdo. Jorge L. Reyes) bio + credentials
            Aprenderas     — 6-item learning-outcomes checklist
            ParaQuienEs    — 4-card audience grid (pharmacists / techs / owners / students)
            Especialidades — 6 practice areas covered by the program (kept, restyled)
            Galeria        — 3 lab proof photos (kept, simplified)
            FaqClean       — 6-item accordion FAQ (kept content via faq.items[])
            Ubicacion      — address card + embedded Google Maps (kept, restyled)
            InstagramFeat. — 4-card grid of featured posts from @santacruzpharmacare
            CtaFinal       — closing teal-deep CTA band (anchors the page visually)
          The prior "Apothecary Editorial" components (Atrium, Epigraph,
          Manifiesto, Frontispiece, Cursos TOC, Metodo, Preguntas, Inscripcion)
          have been retired with this batch. */}
      <Hero />
      <Confianza />
      <CursosGrid />
      <Instructor />
      <Aprenderas />
      <ParaQuienEs />
      <Especialidades />
      <Galeria />
      <FaqClean />
      <Ubicacion />
      <InstagramFeatured />
      <CtaFinal />
    </>
  );
}
