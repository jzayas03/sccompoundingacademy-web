import { setRequestLocale } from "next-intl/server";
import { CursosGrid, type CohortBrief } from "@/components/marketing/CursosGrid";
import { listOpenCohortsSafe, enrollmentCountByCohort } from "@/lib/cohorts";

// Same freshness contract as the landing: on-demand revalidation (payment
// webhook + admin cohort actions) keeps open-cohort references current; this
// ISR window is the backstop. See (marketing)/page.tsx.
export const revalidate = 300;

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
  // Cohorts come from the DB; `listOpenCohortsSafe` degrades to [] if the
  // query fails (see the landing page for the rationale).
  const openCohorts = await listOpenCohortsSafe();
  // Paid seat counts — degrade like the landing: a failed count query marks
  // nothing full rather than crashing the page.
  let counts = new Map<string, number>();
  try {
    counts = await enrollmentCountByCohort();
  } catch {
    counts = new Map();
  }
  const cohortsForGrid: CohortBrief[] = openCohorts.map((c) => ({
    courseId: c.courseId,
    startDate: c.startDate.toISOString().slice(0, 10),
    audience: c.audience,
    full: (counts.get(c.id) ?? 0) >= c.capacity,
  }));
  return <CursosGrid openCohorts={cohortsForGrid} />;
}
