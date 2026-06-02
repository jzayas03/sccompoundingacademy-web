import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/glass/GlassCard";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isAdminEmail } from "@/lib/admin";
import { VerificacionForm } from "./VerificacionForm";

export const metadata: Metadata = {
  title: "Verificación · SCCA Portal",
  robots: { index: false, follow: false },
};

export default async function VerificacionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("portal.verificacion");

  const session = await auth();
  if (!session?.user?.email) redirect(`/${locale}/portal/login`);

  // Owners and any approved/non-student user belong on the dashboard, not here.
  if (isAdminEmail(session.user.email)) redirect(`/${locale}/portal`);

  const [user] = await db
    .select({
      tier: users.tier,
      status: users.studentVerification,
      doc: users.verificationDocUrl,
    })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user || user.tier !== "student" || user.status === "approved") {
    redirect(`/${locale}/portal`);
  }

  // "pending WITH a doc already submitted" → awaiting-review state, no form.
  const awaitingReview = user.status === "pending" && Boolean(user.doc);

  return (
    <Container className="max-w-lg py-16 sm:py-20">
      <GlassCard className="p-8 sm:p-10">
        <p className="font-heading text-teal-deep/80 text-xs font-semibold tracking-[0.18em] uppercase">
          {t("eyebrow")}
        </p>
        {awaitingReview ? (
          <>
            <h1 className="font-heading text-teal-deep mt-3 text-2xl font-bold sm:text-3xl">
              {t("pendingTitle")}
            </h1>
            <p className="text-gray-900 mt-3 text-base leading-relaxed">
              {t("pendingBody")}
            </p>
          </>
        ) : (
          <>
            <h1 className="font-heading text-teal-deep mt-3 text-2xl font-bold sm:text-3xl">
              {user.status === "rejected" ? t("rejectedTitle") : t("title")}
            </h1>
            <p className="text-gray-900 mt-3 text-base leading-relaxed">
              {user.status === "rejected" ? t("rejectedBody") : t("intro")}
            </p>
            <VerificacionForm />
          </>
        )}
      </GlassCard>
    </Container>
  );
}
