import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { LogoFull } from "@/components/brand";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();
  return (
    <footer className="bg-teal-deep text-off-white">
      <Container className="grid gap-10 py-12 sm:grid-cols-12 sm:gap-x-12">
        {/* Brand + tagline */}
        <div className="sm:col-span-5">
          <LogoFull shieldClass="h-12 w-auto" />
          <p className="text-chartreuse mt-4 max-w-xs text-sm italic">{t("tagline")}</p>
        </div>

        {/* Legal */}
        <div className="sm:col-span-3">
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

        {/* Contact info */}
        <div className="sm:col-span-4">
          <h3 className="font-heading text-chartreuse text-sm font-bold tracking-wide uppercase">
            {t("contactInfoLabel")}
          </h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex gap-x-3">
              <dt className="text-off-white/60 w-20 shrink-0 text-xs tracking-wide uppercase">
                {t("addressLabel")}
              </dt>
              <dd>{t("address")}</dd>
            </div>
            <div className="flex gap-x-3">
              <dt className="text-off-white/60 w-20 shrink-0 text-xs tracking-wide uppercase">
                {t("phoneLabel")}
              </dt>
              <dd>
                <a
                  href={`tel:+1${t("phone").replace(/-/g, "")}`}
                  className="hover:text-chartreuse"
                >
                  {t("phone")}
                </a>
              </dd>
            </div>
            <div className="flex gap-x-3">
              <dt className="text-off-white/60 w-20 shrink-0 text-xs tracking-wide uppercase">
                {t("whatsappLabel")}
              </dt>
              <dd>
                <a
                  href={`https://wa.me/1${t("whatsapp").replace(/-/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-chartreuse"
                >
                  {t("whatsapp")}
                </a>
              </dd>
            </div>
            <div className="flex gap-x-3">
              <dt className="text-off-white/60 w-20 shrink-0 text-xs tracking-wide uppercase">
                {t("emailLabel")}
              </dt>
              <dd>
                <a href={`mailto:${t("email")}`} className="hover:text-chartreuse break-all">
                  {t("email")}
                </a>
              </dd>
            </div>
          </dl>

          {/* Contact page link */}
          <p className="mt-5">
            <Link
              href="/contacto"
              className="text-chartreuse group inline-flex items-center gap-1.5 text-sm font-semibold"
            >
              <span className="border-chartreuse/60 group-hover:border-chartreuse border-b transition-colors">
                {t("contact")}
              </span>
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </p>
        </div>
      </Container>
      <div className="bg-teal-deep/90 text-off-white/80 py-4 text-center text-xs">
        {t("copyright", { year })}
      </div>
    </footer>
  );
}
