"use client";
import { useTranslations } from "next-intl";

export function SkipLink() {
  const t = useTranslations("common");
  return (
    <a
      href="#content"
      className="focus:bg-chartreuse focus:text-teal-deep sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:font-semibold"
    >
      {t("skipToContent")}
    </a>
  );
}
