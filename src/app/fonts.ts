import { Outfit, IBM_Plex_Mono, Cormorant_Garamond } from "next/font/google";

// Heading/body — a free geometric sans standing in for ITC Avant Garde (the
// brand display face is commercial/unlicensed for web). Outfit's circular
// forms + large x-height are the closest free match.
export const heading = Outfit({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
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
