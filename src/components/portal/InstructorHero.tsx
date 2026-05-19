import Image from "next/image";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/glass/GlassCard";

/**
 * Compact instructor card surfaced on the portal dashboard.
 *
 * Reads the same `instructor.*` i18n block as the landing-page section
 * so name, title and credentials stay in sync without duplication. The
 * portrait sources from `/public/instructor/jorge-reyes.jpg` (owner-
 * provided, 2026-05-19).
 *
 * Visual logic: glass surface (so it picks up the MeshBackground
 * underneath), small circular crop on the left, text block on the
 * right. Different layout from the landing Instructor section which
 * uses a 1:3 aspect portrait — the portal version is workspace-style
 * and sits above the cert/module banners on /portal.
 */
export function InstructorHero() {
  const t = useTranslations("instructor");
  return (
    <GlassCard className="mt-10 flex flex-col items-center gap-5 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
      <div className="border-chartreuse/40 ring-chartreuse/30 relative h-24 w-24 shrink-0 overflow-hidden rounded-full border bg-sand ring-2 sm:h-28 sm:w-28">
        <Image
          src="/instructor/jorge-reyes.jpg"
          alt={t("photoAlt")}
          fill
          sizes="112px"
          className="object-cover"
        />
      </div>
      <div className="text-center sm:text-left">
        <p className="font-heading text-teal-deep/80 text-xs font-semibold tracking-[0.18em] uppercase">
          {t("eyebrow")}
        </p>
        <p className="font-heading text-teal-deep mt-1 text-lg font-bold leading-snug sm:text-xl">
          {t("heading")}
        </p>
        <p className="font-heading text-teal-deep/80 mt-1 text-xs font-semibold tracking-wide uppercase">
          {t("title")}
        </p>
      </div>
    </GlassCard>
  );
}
