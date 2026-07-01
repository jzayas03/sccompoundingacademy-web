import { desc, eq, isNotNull, and, isNull } from "drizzle-orm";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { db } from "@/lib/db";
import { reviews, users, cohorts } from "@/lib/db/schema";
import { formatReviewerName } from "@/lib/reviews/format";
import { formatCohortLabel } from "@/lib/cohorts";

type Locale = "es" | "en";

type Card = {
  id: string;
  rating: number;
  bestComment: string;
  displayName: string;
  // "pharmacist" is a legacy tier value preserved in the enum; treat it
  // the same as "profesional" for display purposes.
  tier: "profesional" | "student" | "pharmacist" | null;
  cohortLabel: string;
};

async function loadApprovedReviews(locale: Locale, limit = 4): Promise<Card[]> {
  try {
    const rows = await db
      .select({
        id: reviews.id,
        rating: reviews.overallRating,
        bestComment: reviews.bestComment,
        userName: users.name,
        userTier: users.tier,
        cohortId: users.cohortId,
        publishedAt: reviews.publishedAt,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(
        and(
          eq(reviews.publicConsent, true),
          isNotNull(reviews.publishedAt),
          isNull(reviews.archivedAt),
          // Exclude rows with NULL best_comment at the SQL layer so the
          // `limit` isn't silently eaten by empty entries. The JS
          // `.trim()` filter below still catches whitespace-only edge.
          isNotNull(reviews.bestComment),
        ),
      )
      .orderBy(desc(reviews.publishedAt))
      .limit(limit);

    const cohortRows = await db.select().from(cohorts);
    const cohortById = new Map(cohortRows.map((c) => [c.id, c]));

    return rows
      .filter((r) => Boolean(r.bestComment?.trim()))
      .map((r) => {
        const cohort = r.cohortId ? cohortById.get(r.cohortId) : undefined;
        return {
          id: r.id,
          rating: r.rating,
          bestComment: r.bestComment!.trim(),
          displayName: formatReviewerName(r.userName),
          tier: r.userTier ?? null,
          cohortLabel: cohort ? formatCohortLabel(cohort, locale) : "",
        };
      });
  } catch (err) {
    // Graceful degradation: if the DB is unreachable (e.g., during e2e
    // tests where the server cannot reach Neon), do not throw — the
    // landing page is more important than this section.
    console.warn("[Resenas] DB query failed, rendering without reviews", err);
    return [];
  }
}

/**
 * Resenas — testimonials band, teal-deep surface.
 *
 * Recreated from the SCCA Design System handoff (Testimonials section):
 * translucent quote cards on the brand-teal field, each with the review
 * text, a reviewer name in chartreuse, and a mono role line.
 *
 * IMPORTANT: cards come exclusively from *real, consented, published*
 * reviews in the DB — the handoff's placeholder named quotes are NOT
 * used (publishing invented endorsements would be deceptive). The
 * section renders nothing until at least three approved reviews exist,
 * matching the owner's "never show an anaemic section" constraint.
 */
export async function Resenas({ locale }: { locale: Locale }) {
  const cards = await loadApprovedReviews(locale);
  if (cards.length < 3) return null;
  return <ResenasView cards={cards} />;
}

function ResenasView({ cards }: { cards: Card[] }) {
  const t = useTranslations("resenas");
  return (
    <section
      aria-labelledby="resenas-heading"
      className="bg-teal-deep border-t border-white/10"
    >
      <Container className="py-16 sm:py-20 lg:py-24">
        <h2 id="resenas-heading" className="sr-only">
          {t("heading")}
        </h2>
        <Reveal
          as="ul"
          className="grid grid-cols-1 gap-5 md:grid-cols-2 md:items-stretch"
        >
          {cards.map((card) => (
            <li key={card.id}>
              <ResenaCard card={card} />
            </li>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}

function ResenaCard({ card }: { card: Card }) {
  const t = useTranslations("resenas");
  // "pharmacist" is a legacy tier value — display it as "Profesional".
  const tierLabel =
    card.tier === "profesional" || card.tier === "pharmacist"
      ? t("tierProfesional")
      : card.tier === "student"
        ? t("tierStudent")
        : "";
  const role = [tierLabel, card.cohortLabel && `${t("cohortPrefix")} ${card.cohortLabel}`]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className="flex h-full flex-col rounded-[13px] border border-white/10 bg-white/[0.07] p-8 sm:p-9">
      <p className="text-off-white/90 text-base leading-relaxed">&ldquo;{card.bestComment}&rdquo;</p>
      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="font-heading text-chartreuse text-sm font-semibold">{card.displayName}</p>
        {role && (
          <p className="font-mono text-off-white/50 mt-1 text-[0.62rem] tracking-[0.08em] uppercase">
            {role}
          </p>
        )}
      </div>
    </article>
  );
}
