import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { Atrium } from "@/components/marketing/Atrium";
import { Epigraph } from "@/components/marketing/Epigraph";
import { Manifiesto } from "@/components/marketing/Manifiesto";
import { Frontispiece } from "@/components/marketing/Frontispiece";
import { Cursos } from "@/components/marketing/Cursos";
import { Especialidades } from "@/components/marketing/Especialidades";
import { Metodo } from "@/components/marketing/Metodo";
import { Galeria } from "@/components/marketing/Galeria";
import { Preguntas } from "@/components/marketing/Preguntas";
import { Inscripcion } from "@/components/marketing/Inscripcion";
import { Ubicacion } from "@/components/marketing/Ubicacion";

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
      {/* Apothecary Editorial — full editorial composition, top to bottom.
            §00    Atrium         (sand cover, stacked tagline, chartreuse seal)
            §00.5  Epigraph       (pattern-backed brand tagline pull quote)
            §01    Manifiesto     (drop-cap journal paragraph + marginalia)
            §01.5  Frontispiece   (full-bleed editorial photograph + caption)
            §02    Cursos         (TOC catalog with workplace photo header)
            §02.5  Especialidades (6 practice areas — sister-pharmacy scope)
            §03    Método         (4 numbered tenets, asymmetric layout)
            §04    Galería        (3-photo editorial grid with captions)
            §05    Preguntas      (editorial Q&A — replaces accordion FAQ)
            §06    Inscripción    (letterpress closing CTA — replaces FooterCTA)
            §07    Ubicación      (address card + embedded Google Maps)
          Old marketing-batch components (PatternDivider, FAQ, FooterCTA)
          fully retired with this batch. */}
      <Atrium />
      <Epigraph />
      <Manifiesto />
      <Frontispiece />
      <Cursos />
      <Especialidades />
      <Metodo />
      <Galeria />
      <Preguntas />
      <Inscripcion />
      <Ubicacion />
    </>
  );
}
