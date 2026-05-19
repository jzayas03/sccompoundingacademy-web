"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LogoFull } from "@/components/brand";
import { LogoShield } from "@/components/brand/LogoShield";
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
        {/* Logo: compact shield on mobile (< sm) so the locale switch
            + enroll CTA have room without crushing the wordmark; full
            horizontal lockup at sm+ where there's space for both the
            mark and the wordmark to read at full size. aria-label on
            the wrapper Link gives screen-reader users the full brand
            name even when only the shield renders. */}
        <Link href="/" className="flex items-center" aria-label="Santa Cruz Compounding Academy">
          <LogoShield className="h-10 w-auto sm:hidden" />
          <LogoFull shieldClass="h-12 w-auto" className="hidden sm:inline-flex" />
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
          {/* Portal entry point — text link (not a button) so it stays
              visually subordinate to the Inscribirme primary CTA.
              Middleware routes anonymous visitors to the magic-link
              login page; signed-in students land on the dashboard. */}
          <Link
            href="/portal"
            className="text-off-white hover:text-chartreuse hidden text-sm font-semibold sm:inline"
          >
            {t("signIn")}
          </Link>
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
