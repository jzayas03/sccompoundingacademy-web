import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { GlassCard } from "@/components/glass/GlassCard";
import { SectionBanner } from "@/components/portal/SectionBanner";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviews, users } from "@/lib/db/schema";
import { isEligibleForCertificate } from "@/lib/certificates";
import { isAdminEmail } from "@/lib/admin";
import { resolveEffectiveTier, type UserTier } from "@/lib/curriculum";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = {
  title: "Reseña · SCCA Portal",
  robots: { index: false, follow: false },
};

/**
 * `/[locale]/portal/reseñas` — three render states:
 *
 *   - **locked**: user has not passed all 3 post-tests → show a locked
 *     GlassCard with a hint and a back-to-dashboard link.
 *   - **already submitted**: a `reviews` row exists for this user →
 *     show the thank-you panel with a CTA into the certificate page.
 *   - **form**: eligible + no existing review → render `<ReviewForm />`.
 *
 * Server-side decision so the client form never mounts when it would
 * be rejected by the server action anyway.
 */
export default async function ReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { locale } = await params;
  const { preview } = await searchParams;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.email) redirect(`/${locale}/portal/login`);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
  if (!user) redirect(`/${locale}/portal/login`);

  // Owners preview the review form without paying or completing the
  // post-tests. If they actually submit a review it lands in the admin
  // queue and can be archived from /portal/admin.
  const isOwner = isAdminEmail(session.user.email);
  if (!user.paidAt && !isOwner) redirect(`/${locale}/portal`);

  // Owner-only `?preview=` selects which tier's module catalogue the
  // review form renders (student → USP 795/800, profesional → Día 1/2/3).
  // Real users always get their own tier (preview is ignored for them).
  const effectiveTier = resolveEffectiveTier({
    isOwner,
    userTier: user.tier,
    preview,
  });

  const eligibility = await isEligibleForCertificate(user.id, effectiveTier);
  const eligible = eligibility.eligible || isOwner;
  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.userId, user.id))
    .limit(1);

  return (
    <ReviewsPanel
      eligible={eligible}
      alreadySubmitted={Boolean(existing)}
      tier={effectiveTier}
    />
  );
}

function ReviewsPanel({
  eligible,
  alreadySubmitted,
  tier,
}: {
  eligible: boolean;
  alreadySubmitted: boolean;
  tier: UserTier;
}) {
  const t = useTranslations("portal.reviews");

  return (
    <>
      <SectionBanner
        photo="/photos/photo-cursos-bench.jpg"
        eyebrow={t("eyebrow")}
        title={t("title")}
      />

      <p className="text-gray-900 -mt-2 mb-2 max-w-2xl text-base leading-relaxed sm:text-lg">
        {t("subtitle")}
      </p>

      {alreadySubmitted ? (
        <GlassCard className="mt-10 p-8 sm:p-10 text-center">
          <svg
            aria-hidden
            viewBox="0 0 64 64"
            className="mx-auto h-16 w-16"
          >
            <circle cx="32" cy="32" r="32" className="fill-chartreuse" />
            <path
              d="M19 33l9 9 18-20"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-teal-deep"
            />
          </svg>
          <p className="font-heading text-teal-deep mt-6 text-xl font-semibold sm:text-2xl">
            {t("successTitle")}
          </p>
          <p className="text-gray-900 mt-3 text-base leading-relaxed">
            {t("successBody")}
          </p>
          <div className="mt-6">
            <Link
              href="/portal/certificado"
              className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift focus-visible:ring-chartreuse font-heading inline-flex h-12 items-center rounded-md px-6 text-sm font-semibold ring-1 transition-[color,background-color,box-shadow,transform] duration-200 sm:text-base motion-safe:hover:-translate-y-px"
            >
              {t("successCta")} →
            </Link>
          </div>
        </GlassCard>
      ) : !eligible ? (
        <GlassCard className="mt-10 p-8 sm:p-10">
          <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
            {t("lockedTitle")}
          </p>
          <p className="text-gray-900 mt-3 text-base leading-relaxed">
            {t("lockedBody")}
          </p>
        </GlassCard>
      ) : (
        <GlassCard className="mt-10 p-6 sm:p-8">
          <ReviewForm tier={tier} />
        </GlassCard>
      )}
    </>
  );
}
