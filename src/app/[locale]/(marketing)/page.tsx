import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { homepageJsonLd } from "@/lib/structuredData";
import { listOpenCohortsSafe, committedSeatsByCohort, formatCohortLabel } from "@/lib/cohorts";
import { Hero } from "@/components/marketing/Hero";
import { ConfianzaCarousel } from "@/components/marketing/ConfianzaCarousel";
import { CursosHome } from "@/components/marketing/CursosHome";
import { CohortWaitlist } from "@/components/marketing/CohortWaitlist";
import { Instructor } from "@/components/marketing/Instructor";
import { VideoIntro } from "@/components/marketing/VideoIntro";
import { FaqClean } from "@/components/marketing/FaqClean";
import { HomeContact } from "@/components/marketing/HomeContact";
import { PhotoBand } from "@/components/marketing/PhotoBand";
import { CtaFinal } from "@/components/marketing/CtaFinal";
import { FloatingCta } from "@/components/marketing/FloatingCta";

// The seat meter reads live cohort capacity − paid enrollments. On-demand
// revalidation (Stripe webhook on payment; admin cohort create/edit/delete)
// keeps it fresh the instant anything changes; this ISR window is the
// backstop for out-of-band edits (e.g. a manual DB change / refund).
export const revalidate = 300;

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

  // Seat-scarcity meter for the waitlist section, from real data: total =
  // the next cohort's capacity, remaining = capacity − COMMITTED seats
  // (paid + admin-approved — see committedSeatsByCohort), so the meter can't
  // oversell once the admin has approved a cohort's worth of students. All
  // best-effort — if the count query fails, the meter is simply hidden.
  let seatTotal: number | null = null;
  let seatRemaining: number | null = null;
  let cohortLabel: string | null = null;
  if (next) {
    seatTotal = next.capacity;
    cohortLabel = formatCohortLabel(next, locale as "es" | "en");
    try {
      const counts = await committedSeatsByCohort();
      seatRemaining = Math.max(0, next.capacity - (counts.get(next.id) ?? 0));
    } catch {
      seatRemaining = null;
    }
  }

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
      {/* SCCA marketing homepage — v2 handoff (design_handoff_scca_website).
          Section order matches the prototype's App():
            Hero            — working-lab slideshow + one CTA
            ConfianzaCarousel — "El primer cohorte" photo carousel
            CursosHome      — two-track course cards, with pricing
            CohortWaitlist  — seat-scarcity meter + waitlist form
            Instructor      — portrait + role facets
            VideoIntro      — instructor Instagram reel + pull-quote
            FaqClean        — assurance badges + accordion FAQ
            HomeContact     — on-page contact form + details + campus map
            PhotoBand       — full-bleed photographic quote break
            CtaFinal        — closing CTA over a pharmacy photograph
            FloatingCta     — fixed "Reserve a seat" pill → #cohort
          v2 drops the real-reviews testimonials band (its credibility role
          is carried by the FAQ assurance badges). */}
      <Hero />
      <ConfianzaCarousel />
      <CursosHome />
      <CohortWaitlist total={seatTotal} remaining={seatRemaining} cohortLabel={cohortLabel} />
      <Instructor />
      <VideoIntro />
      <FaqClean />
      <HomeContact />
      <PhotoBand />
      <CtaFinal />
      <FloatingCta />
    </>
  );
}
