import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { GlassCard } from "@/components/glass/GlassCard";
import { MeshBackground } from "@/components/glass/MeshBackground";
import { db } from "@/lib/db";
import { certificates, users } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Verificación de certificado · SCCA",
  robots: { index: false, follow: true },
};

/**
 * `/verificar/[certNo]` — public certificate verification.
 *
 * Lives outside the `[locale]` segment so the URL printed on every
 * SCCA certificate stays clean (`sccompoundingacademy.com/verificar/
 * SCCA-2026-001`) instead of carrying a locale prefix. Middleware
 * matcher excludes `verificar` so anonymous traffic flows straight to
 * this page without auth gating or i18n redirect.
 *
 * Spanish-only in Phase A (matches the rest of the portal Phase A
 * decisions). We force `setRequestLocale("es")` explicitly because
 * there's no locale param in the route.
 *
 * Data path: LEFT JOIN on `certificates.userId = users.id` so we can
 * render the student's display name straight from the same DB row.
 * Falls back to email if `users.name` is null (Auth.js does not collect
 * a name during magic-link sign-up — we only have whatever the student
 * typed into the inscription form, which lives on Airtable + the JSON
 * metadata, not on this table).
 */
export default async function VerificarPage({
  params,
}: {
  params: Promise<{ certNo: string }>;
}) {
  const { certNo } = await params;
  setRequestLocale("es");

  const [row] = await db
    .select({
      certNo: certificates.certNo,
      issuedAt: certificates.issuedAt,
      studentName: users.name,
      studentEmail: users.email,
    })
    .from(certificates)
    .leftJoin(users, eq(certificates.userId, users.id))
    .where(eq(certificates.certNo, certNo))
    .limit(1);

  const valid = Boolean(row);
  const studentName = row?.studentName?.trim() || row?.studentEmail || "—";
  const issuedAt = row?.issuedAt ?? null;

  return (
    <>
      <MeshBackground />
      <VerifyPanel
        valid={valid}
        certNo={certNo}
        studentName={studentName}
        issuedAt={issuedAt}
      />
    </>
  );
}

function VerifyPanel({
  valid,
  certNo,
  studentName,
  issuedAt,
}: {
  valid: boolean;
  certNo: string;
  studentName: string;
  issuedAt: Date | null;
}) {
  const t = useTranslations("verificar");
  const dateLabel = issuedAt
    ? new Intl.DateTimeFormat("es-PR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(issuedAt)
    : "—";

  return (
    <Container className="max-w-2xl py-20 sm:py-24 lg:py-28">
      <GlassCard className="p-8 sm:p-10 text-center">
        {/* Status seal — chartreuse circle with teal-deep stroke for
            valid certificates, sand circle with gray stroke for the
            "not found" state. Mirrors the visual language of the
            inscription-success and verify pages. */}
        <svg
          aria-hidden
          viewBox="0 0 64 64"
          className="mx-auto h-16 w-16"
        >
          <circle
            cx="32"
            cy="32"
            r="32"
            className={valid ? "fill-chartreuse" : "fill-sand"}
          />
          {valid ? (
            <path
              d="M19 33l9 9 18-20"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-teal-deep"
            />
          ) : (
            <path
              d="M21 21l22 22M43 21L21 43"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-gray-700"
            />
          )}
        </svg>

        <p className="font-heading text-teal-deep/80 mt-6 flex items-center justify-center text-xs font-semibold tracking-[0.18em] uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl">
          {valid ? t("validTitle") : t("invalidTitle")}
        </h1>
        <p className="text-gray-900 mt-4 text-base leading-relaxed sm:text-lg">
          {valid
            ? t("validBody", { name: studentName, date: dateLabel })
            : t("invalidBody", { certNo })}
        </p>

        {valid && (
          <div className="border-gray-300 mt-8 rounded-md border bg-white p-5 text-left">
            <p className="font-heading text-teal-deep text-xs font-semibold tracking-[0.18em] uppercase">
              {certNo}
            </p>
            <p className="font-heading text-gray-900 mt-2 text-base font-semibold leading-snug sm:text-lg">
              {t("courseTitle")}
            </p>
            <p className="text-gray-700 mt-2 text-sm leading-relaxed">
              {t("courseSubtitle")}
            </p>
          </div>
        )}

        <p className="mt-8 text-sm">
          <a
            href="https://sccompoundingacademy.com/"
            className="text-teal-deep hover:text-teal underline underline-offset-2"
          >
            ← {t("backToHome")}
          </a>
        </p>
      </GlassCard>
    </Container>
  );
}
