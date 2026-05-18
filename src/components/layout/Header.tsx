"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LogoFull } from "@/components/brand";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { LocaleSwitch } from "@/components/ui/LocaleSwitch";

// Header bg is solid teal-deep (no opacity, no blur) so the logo's
// rounded card boundary blends seamlessly against the surrounding
// header. Previous bg-teal-deep/95 + backdrop-blur created a visible
// darker square because the card's solid teal didn't match the
// translucent header tint.
export function Header({ locale }: { locale: "es" | "en" }) {
  const t = useTranslations("nav");
  return (
    <header className="bg-teal-deep sticky top-0 z-50">
      <Container className="flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <LogoFull shieldClass="h-12 w-auto" />
        </Link>
        <nav className="text-off-white hidden items-center gap-6 text-sm font-semibold sm:flex">
          <Link href="/" className="hover:text-chartreuse">
            {t("home")}
          </Link>
          <Link href="/cursos" className="hover:text-chartreuse">
            {t("courses")}
          </Link>
          <Link href="/contacto" className="hover:text-chartreuse">
            {t("contact")}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitch currentLocale={locale} />
          <Link href="/inscripcion">
            <Button variant="primary" size="md">
              {t("enroll")}
            </Button>
          </Link>
        </div>
      </Container>
    </header>
  );
}
