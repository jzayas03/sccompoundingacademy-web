import { setRequestLocale } from "next-intl/server";
import { CursosGrid } from "@/components/marketing/CursosGrid";

/**
 * /cursos (es) and /courses (en) — full catalogue page.
 *
 * Reuses the same CursosGrid component the landing renders, so prices,
 * cohort references, and CTAs are sourced from a single place. The
 * page exists so the header nav and Hero 'Ver cursos' CTA have a
 * dedicated destination users can deep-link or bookmark.
 *
 * Replaced the prior 'Catalog coming soon' placeholder now that the
 * inscription flow is live.
 */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CursosGrid />;
}
