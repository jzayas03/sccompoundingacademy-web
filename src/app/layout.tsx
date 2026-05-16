import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santa Cruz Compounding Academy",
  description: "Educamos para formar bienestar y salud.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
