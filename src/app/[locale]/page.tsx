import { setRequestLocale } from "next-intl/server";
import { HeroBillboard } from "@/components/marketing/HeroBillboard";
import { TaglineBand } from "@/components/marketing/TaglineBand";
import { FeaturedCoursesPlaceholder } from "@/components/marketing/FeaturedCoursesPlaceholder";
import { WhySCCA } from "@/components/marketing/WhySCCA";
import { InstructorSection } from "@/components/marketing/InstructorSection";
import { PatternDivider } from "@/components/marketing/PatternDivider";
import { FAQ } from "@/components/marketing/FAQ";
import { FooterCTA } from "@/components/marketing/FooterCTA";

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
