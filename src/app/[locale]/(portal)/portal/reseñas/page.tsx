import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/glass/GlassCard";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviews, users } from "@/lib/db/schema";
import { isEligibleForCertificate } from "@/lib/certificates";
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
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.email) redirect(`/${locale}/portal/login`);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
  if (!user) redirect(`/${locale}/portal/login`);
  if (!user.paidAt) redirect(`/${locale}/portal`);

  const eligibility = await isEligibleForCertificate(user.id);
  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.userId, user.id))
    .limit(1);

  return (
    <ReviewsPanel
      eligible={eligibility.eligible}
      alreadySubmitted={Boolean(existing)}
    />
  );
}

function ReviewsPanel({
  eligible,
  alreadySubmitted,
}: {
  eligible: boolean;
  alreadySubmitted: boolean;
}) {
  const t = useTranslations("portal.reviews");

  return (
    <Container className="max-w-3xl py-12 sm:py-16 lg:py-20">
      <p className="text-sm">
        <Link
          href="/portal"
          className="text-teal-deep hover:text-teal underline underline-offset-2"
        >
          ← {t("backToDashboard")}
        </Link>
      </p>

      <div className="mt-6">
        <p className="font-heading text-teal-deep/80 flex items-center text-xs font-semibold tracking-[0.18em] uppercase">
          <span aria-hidden className="bg-chartreuse mr-3 inline-block h-4 w-1 shrink-0 rounded-sm" />
          {t("eyebrow")}
        </p>
        <h1 className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-gray-900 mt-3 text-base leading-relaxed sm:text-lg">
          {t("subtitle")}
        </p>
      </div>

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
          <ReviewForm />
        </GlassCard>
      )}
    </Container>
  );
}
