"use client";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/cn";

type Locale = "es" | "en";
type Variant = "dark" | "light";

/**
 * LocaleSwitch — bilingual pill toggle.
 *
 * Two surface variants:
 *   - `dark`  (default) — frosted off-white pills on the teal-deep
 *     marketing header. Solid off-white pill marks the active locale.
 *   - `light` — teal-deep pills on the portal's near-white glass
 *     surface. Same shape, inverted color logic so the active state
 *     still reads as "selected" without losing contrast.
 */
const SURFACE = {
  dark: {
    container: "ring-off-white/25 bg-off-white/10",
    active: "bg-off-white text-teal-deep shadow-soft",
    inactive:
      "text-off-white/90 hover:bg-off-white/10 hover:text-off-white",
  },
  light: {
    container: "ring-teal-deep/15 bg-off-white/60",
    active: "bg-teal-deep text-off-white shadow-soft",
    inactive:
      "text-teal-deep/70 hover:bg-teal-deep/10 hover:text-teal-deep",
  },
} as const;

export function LocaleSwitch({
  currentLocale,
  className,
  variant = "dark",
}: {
  currentLocale: Locale;
  className?: string;
  variant?: Variant;
}) {
  const pathname = usePathname();
  const surface = SURFACE[variant];
  return (
    <div
      className={cn(
        "shadow-soft inline-flex items-center rounded-full p-1 text-sm ring-1 backdrop-blur-md",
        surface.container,
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
              active ? surface.active : surface.inactive,
            )}
          >
            {locale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
