"use client";

import { usePathname } from "@/i18n/routing";
import { LocaleSwitch } from "@/components/ui/LocaleSwitch";

/**
 * Portal wrapper around `LocaleSwitch`.
 *
 * The marketing-side switch reloads the current route under the other
 * locale, which is the right behavior for static content. Inside an
 * in-progress pre-test/post-test the same reload could wipe in-memory
 * answer state before the user submits, so we suppress the toggle on
 * those routes. Same pattern Khan Academy / Duolingo use during graded
 * sessions: don't offer language changes mid-assessment.
 *
 * `usePathname()` here is next-intl's, which returns the canonical
 * pathname stripped of the locale prefix — so the match works
 * identically regardless of whether the learner is on `/es/...` or
 * `/en/...`.
 */
const HIDE_PATTERNS = [/\/portal\/modulos\/[^/]+\/(pre|post)-test(\/|$)/];

export function PortalLocaleSwitch({
  currentLocale,
  className,
}: {
  currentLocale: "es" | "en";
  className?: string;
}) {
  const pathname = usePathname();
  if (HIDE_PATTERNS.some((re) => re.test(pathname))) return null;
  return (
    <LocaleSwitch
      currentLocale={currentLocale}
      className={className}
      variant="light"
    />
  );
}
