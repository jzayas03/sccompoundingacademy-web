import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { LogoFull } from "@/components/brand";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();
  return (
    <footer className="bg-teal-deep text-off-white">
      <Container className="grid gap-10 py-12 sm:grid-cols-3">
        <div>
          <LogoFull shieldClass="h-12 w-auto" />
          <p className="text-chartreuse mt-4 max-w-xs text-sm italic">{t("tagline")}</p>
        </div>
        <div>
          <h3 className="font-heading text-chartreuse text-sm font-bold tracking-wide uppercase">
            {t("legal")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/legal/privacidad" className="hover:text-chartreuse">
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/legal/terminos" className="hover:text-chartreuse">
                {t("terms")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-heading text-chartreuse text-sm font-bold tracking-wide uppercase">
            {t("contact")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/contacto" className="hover:text-chartreuse">
                {t("contact")}
              </Link>
            </li>
          </ul>
        </div>
      </Container>
      <div className="bg-teal-deep/90 text-off-white/80 py-4 text-center text-xs">
        {t("copyright", { year })}
      </div>
    </footer>
  );
}
