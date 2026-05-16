"use client";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/cn";

type Locale = "es" | "en";

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
      className={cn("bg-teal-deep/10 inline-flex items-center rounded-full p-1 text-sm", className)}
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
              "rounded-full px-3 py-1 font-semibold tracking-wide uppercase transition-colors",
              active ? "bg-teal-deep text-chartreuse" : "text-teal-deep hover:bg-teal-deep/10",
            )}
          >
            {locale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
