import { desc, eq, isNotNull, and, isNull } from "drizzle-orm";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
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

async function loadApprovedReviews(locale: Locale, limit = 5): Promise<Card[]> {
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
          // `limit(5)` isn't silently eaten by empty entries. The JS
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

export async function Resenas({ locale }: { locale: Locale }) {
  const cards = await loadApprovedReviews(locale);
  // ACPE-credibility constraint + owner preference: never render an
  // anaemic section. Require ≥3 approved reviews before showing
  // anything publicly.
  if (cards.length < 3) return null;
  return <ResenasView cards={cards} />;
}

function ResenasView({ cards }: { cards: Card[] }) {
  const t = useTranslations("resenas");
  return (
    <section
      aria-labelledby="resenas-heading"
      className="bg-off-white border-gray-300 border-t"
    >
      <Container className="max-w-5xl py-20 sm:py-24 lg:py-28">
        <p className="font-heading text-teal-deep/80 flex items-center text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
          <span
            aria-hidden
            className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm"
          />
          {t("eyebrow")}
        </p>
        <h2
          id="resenas-heading"
          className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl"
        >
          {t("heading")}
        </h2>
        <p className="text-gray-700 mt-3 max-w-2xl text-base leading-relaxed">
          {t("subheading")}
        </p>

        <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <li key={card.id}>
              <ResenaCard card={card} />
            </li>
          ))}
        </ul>
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
  const clampedRating = Math.max(0, Math.min(5, Math.round(card.rating)));
  return (
    <article className="border-gray-300 rounded-xl border bg-white p-5 shadow-sm sm:p-6">
      <Stars
        clampedRating={clampedRating}
        ariaLabel={t("starsAriaLabel", { rating: clampedRating })}
      />
      <p className="text-gray-900 mt-4 text-sm leading-relaxed">&ldquo;{card.bestComment}&rdquo;</p>
      <p className="font-heading text-teal-deep mt-5 text-sm font-semibold">{card.displayName}</p>
      <p className="text-gray-700 mt-1 text-xs">
        {[tierLabel, card.cohortLabel && `${t("cohortPrefix")} ${card.cohortLabel}`]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </article>
  );
}

/**
 * Presentational only. The caller owns the aria-label string so it can
 * be locale-aware (next-intl `t()` is in scope on `ResenaCard` but not
 * here). `clampedRating` is expected to already be in [0,5].
 */
function Stars({ clampedRating, ariaLabel }: { clampedRating: number; ariaLabel: string }) {
  return (
    <div aria-label={ariaLabel} className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={i < clampedRating ? "text-chartreuse" : "text-gray-300"}
        >
          ★
        </span>
      ))}
    </div>
  );
}
