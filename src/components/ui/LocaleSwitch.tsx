"use client";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/cn";

type Locale = "es" | "en";

/**
 * LocaleSwitch — bilingual pill toggle.
 *
 * Designed for the teal-deep header surface: a frosted-glass pill
 * container (off-white at 10% opacity + backdrop-blur + 1px white ring)
 * with the active locale rendered as a solid off-white pill so it
 * reads as the "selected" state at a glance.
 *
 * The previous design used `bg-teal-deep/10 + text-teal-deep` which on
 * the teal-deep header was effectively invisible — only the active
 * chartreuse text was readable, with no surrounding pill affordance.
 * The crystalline glass treatment fixes that without changing the
 * header background.
 */
export function LocaleSwitch({
  currentLocale,
  className,
}: {
  currentLocale: Locale;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <div
      className={cn(
        "ring-off-white/25 bg-off-white/10 shadow-soft inline-flex items-center rounded-full p-1 text-sm ring-1 backdrop-blur-md",
        className,
      )}
    >
      {(["es", "en"] as const).map((locale) => {
        const active = locale === currentLocale;
        return (
          <Link
            key={locale}
            href={pathname as never}
            locale={locale}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-full px-3.5 py-1.5 font-semibold tracking-wide uppercase transition-colors",
              active
                ? "bg-off-white text-teal-deep shadow-soft"
                : "text-off-white/80 hover:bg-off-white/10 hover:text-off-white",
            )}
          >
            {locale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
