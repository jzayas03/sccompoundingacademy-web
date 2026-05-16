import type { Metadata } from "next";
import { heading, accent } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santa Cruz Compounding Academy",
  description: "Educamos para formar bienestar y salud.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${heading.variable} ${accent.variable}`}>
      <body>{children}</body>
    </html>
  );
}
