import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santa Cruz Compounding Academy",
  description: "Educamos para formar bienestar y salud.",
  // Favicons: prefer the self-contained SVG (sharp at any DPR); fall back
  // to sized PNGs for browsers that can't render SVG favicons, and to the
  // .ico for the oldest UAs. apple-touch-icon serves iOS Safari + the
  // 'Add to Home Screen' / shared-link thumbnails.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
