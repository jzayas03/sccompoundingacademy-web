import { useTranslations } from "next-intl";

/**
 * PhotoBand — full-bleed photographic quote band.
 *
 * Recreated from the SCCA Design System handoff: a working-lab
 * photograph under an angled teal scrim, carrying a single positioning
 * statement. Purely a visual/rhythm break between Contact and the final
 * CTA. The photo is a decorative CSS background (aria-hidden); the quote
 * carries the section's accessible name.
 */
export function PhotoBand() {
  const t = useTranslations("photoBand");
  return (
    <section aria-label={t("quote")} className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/photos/photo-mortar.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center 35%",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(110deg, rgba(25,85,97,0.80) 0%, rgba(25,85,97,0.52) 45%, rgba(25,85,97,0.24) 100%)",
        }}
      />
      <div className="relative z-[1] mx-auto flex min-h-[20rem] max-w-7xl items-center px-6 py-14 sm:min-h-[22rem] sm:px-8">
        <p className="font-heading text-off-white max-w-xl text-2xl font-bold leading-tight tracking-[-0.025em] text-balance sm:text-3xl lg:text-4xl">
          {t("quote")}
        </p>
      </div>
    </section>
  );
}
