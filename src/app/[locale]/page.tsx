import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { HeroBillboard } from "@/components/marketing/HeroBillboard";
import { TaglineBand } from "@/components/marketing/TaglineBand";
import { FeaturedCoursesPlaceholder } from "@/components/marketing/FeaturedCoursesPlaceholder";
import { WhySCCA } from "@/components/marketing/WhySCCA";
import { InstructorSection } from "@/components/marketing/InstructorSection";
import { PatternDivider } from "@/components/marketing/PatternDivider";
import { FAQ } from "@/components/marketing/FAQ";
import { FooterCTA } from "@/components/marketing/FooterCTA";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title =
    locale === "es"
      ? "Santa Cruz Compounding Academy — Certificación USP 795 y USP 800"
      : "Santa Cruz Compounding Academy — USP 795 & USP 800 Certification";
  const description =
    locale === "es"
      ? "Educamos para formar bienestar y salud. Cursos de compounding no estéril y manejo de medicamentos peligrosos."
      : "We educate to build wellness and health. Non-sterile compounding and hazardous drug handling certification.";
  return pageMetadata({ locale: locale as "es" | "en", title, description, pathname: "/" });
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <HeroBillboard />
      <TaglineBand />
      <FeaturedCoursesPlaceholder locale={locale as "es" | "en"} />
      <WhySCCA />
      <PatternDivider />
      <InstructorSection />
      <FAQ />
      <PatternDivider />
      <FooterCTA />
    </>
  );
}
