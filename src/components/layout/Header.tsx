"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LogoFull } from "@/components/brand";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { LocaleSwitch } from "@/components/ui/LocaleSwitch";

export function Header({ locale }: { locale: "es" | "en" }) {
  const t = useTranslations("nav");
  return (
    <header className="bg-teal-deep/95 supports-[backdrop-filter]:bg-teal-deep/80 sticky top-0 z-50 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <LogoFull shieldClass="h-9 w-auto" />
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
          <Link href="/cursos">
            <Button variant="primary" size="md">
              {t("enroll")}
            </Button>
          </Link>
        </div>
      </Container>
    </header>
  );
}
