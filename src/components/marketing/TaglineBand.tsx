import { useTranslations } from "next-intl";

export function TaglineBand() {
  const t = useTranslations("tagline");
  return (
    <section aria-label="tagline" className="bg-teal-deep py-12 sm:py-16">
      <p className="font-heading text-chartreuse mx-auto max-w-6xl px-6 text-center text-4xl leading-tight font-extrabold tracking-tight uppercase sm:text-6xl lg:text-7xl">
        {t("line1")} <em className="font-accent italic">{t("line2")}</em>
      </p>
    </section>
  );
}
