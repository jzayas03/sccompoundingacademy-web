import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { Atrium } from "@/components/marketing/Atrium";
import { Epigraph } from "@/components/marketing/Epigraph";
import { Manifiesto } from "@/components/marketing/Manifiesto";
import { Cursos } from "@/components/marketing/Cursos";
import { Metodo } from "@/components/marketing/Metodo";
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
  void locale; // reserved for sections that need per-locale data
  return (
    <>
      {/* Apothecary Editorial — top-to-bottom:
            §00   Atrium      (sand cover, stacked tagline)
            §00.5 Epigraph    (pattern-backed brand tagline pull quote)
            §01   Manifiesto  (drop-cap journal paragraph + marginalia)
            §02   Cursos      (table-of-contents catalog with hours + cohort)
            §03   Método      (4 numbered tenets in asymmetric layout)
          Below this we keep the previous-batch sections (Instructor,
          PatternDivider, FAQ, FooterCTA) until they get converted in the
          next batch. */}
      <Atrium />
      <Epigraph />
      <Manifiesto />
      <Cursos />
      <Metodo />
      <PatternDivider />
      <InstructorSection />
      <FAQ />
      <PatternDivider />
      <FooterCTA />
    </>
  );
}
