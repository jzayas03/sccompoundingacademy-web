import { Montserrat, IBM_Plex_Mono, Cormorant_Garamond } from "next/font/google";

// Heading/body — Montserrat, per the SCCA Design System handoff. The brand
// display face (ITC Avant Garde) is commercial/unlicensed for web; Montserrat
// is the handoff's named brand substitute (geometric, wide weight range).
export const heading = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-heading-loaded",
});

// Utility/data face for spec-tags + figures (hours, dates, ACPE #, USP chapters).
export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono-loaded",
});

export const accent = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-accent-loaded",
});
