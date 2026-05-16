import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Santa Cruz Compounding Academy",
  description: "Educamos para formar bienestar y salud.",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
