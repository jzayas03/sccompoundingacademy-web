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

          {/* Social — Instagram + Facebook of the sister pharmacy.
              Aria-labels keep the bare icon links screen-reader friendly. */}
          <div className="mt-6 flex items-center gap-3">
            <span
              aria-hidden
              className="text-off-white/60 text-xs tracking-wide uppercase"
            >
              {t("socialLabel")}
            </span>
            <a
              href={t("instagramUrl")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("instagramAria")}
              className="text-off-white/70 hover:text-chartreuse inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href={t("facebookUrl")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("facebookAria")}
              className="text-off-white/70 hover:text-chartreuse inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="h-5 w-5"
                fill="currentColor"
              >
                <path d="M13.5 21v-7.5h2.6l.4-3.1h-3V8.4c0-.9.3-1.5 1.6-1.5h1.7V4.1A23.6 23.6 0 0 0 14.3 4c-2.5 0-4.2 1.5-4.2 4.3v2.1H7.5v3.1h2.6V21h3.4Z" />
              </svg>
            </a>
          </div>
        </div>
      </Container>
      <div className="bg-teal-deep/90 text-off-white/80 py-4 text-center text-xs">
        {t("copyright", { year })}
      </div>
    </footer>
  );
}
