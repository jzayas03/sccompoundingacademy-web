import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { homepageJsonLd } from "@/lib/structuredData";
import { listOpenCohortsSafe } from "@/lib/cohorts";
import { Hero } from "@/components/marketing/Hero";
import { Confianza } from "@/components/marketing/Confianza";
import { CursosHome } from "@/components/marketing/CursosHome";
import { Instructor } from "@/components/marketing/Instructor";
import { Resenas } from "@/components/marketing/Resenas";
import { FaqClean } from "@/components/marketing/FaqClean";
import { HomeContact } from "@/components/marketing/HomeContact";
import { PhotoBand } from "@/components/marketing/PhotoBand";
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

  // Cohorts live in the DB. `listOpenCohortsSafe` never throws — a local
  // build without DATABASE_URL, or a preview deploy whose Neon branch
  // predates the latest migration, just renders without cohort data.
  // Production has the migrated DB; admin cohort edits revalidate this page.
  const openCohorts = await listOpenCohortsSafe();
  const next = openCohorts[0];
  const jsonLd = homepageJsonLd(
    locale as "es" | "en",
    next
      ? {
          startDate: next.startDate.toISOString().slice(0, 10),
          endDate: next.endDate.toISOString().slice(0, 10),
        }
      : null,
  );
  return (
    <>
      {/* SEO: Organization + LocalBusiness + Course graph. Server-rendered
          so Google reads it on initial crawl without executing JS. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* SCCA Design System handoff — Marketing Homepage. Section order
          matches the handoff's ui_kit exactly:
            Hero        — full-bleed working-lab slideshow + one CTA
            Confianza   — three tonal trust cards (affiliated · supervised · USP)
            CursosGrid  — two-track course cards (professional + student)
            Instructor  — course director portrait + career timeline
            Resenas     — testimonials band (real, consented reviews only)
            FaqClean    — accordion FAQ (faq.items[])
            HomeContact — on-page contact form + details + campus map
            PhotoBand   — full-bleed photographic quote break
            CtaFinal    — closing CTA over a pharmacy photograph
          The handoff drops the prior Aprenderás / ParaQuiénEs /
          Especialidades / Galería / Instagram sections (components remain
          in the repo; simply no longer composed on '/'). */}
      <Hero />
      <Confianza />
      <CursosHome />
      <Instructor />
      <Resenas locale={locale as "es" | "en"} />
      <FaqClean />
      <HomeContact />
      <PhotoBand />
      <CtaFinal />
    </>
  );
}
