"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

/**
 * FloatingCta — fixed "Reserve a seat" pill (§13 of the v2 handoff).
 *
 * Hidden until the visitor scrolls past 700px, then fades + slides up in
 * the bottom-right. Links straight to enrollment (/inscripcion) so the
 * pill is a direct conversion path (per owner request — it previously
 * scrolled to the #cohort waitlist). Honors reduced motion via the CSS
 * transition being opacity/transform only.
 */
export function FloatingCta() {
  const t = useTranslations("floatingCta");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Link
      href="/inscripcion"
      className="bg-chartreuse text-teal-deep hover:bg-chartreuse/95 font-heading fixed right-6 bottom-6 z-[90] inline-flex h-13 items-center gap-2.5 rounded-full px-6 text-[15px] font-bold tracking-[-0.01em] transition-[opacity,transform] duration-300 ease-out"
      style={{
        boxShadow: "0 12px 32px -8px rgba(25,85,97,0.55)",
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(20px)",
        pointerEvents: show ? "auto" : "none",
      }}
      aria-hidden={!show}
      tabIndex={show ? undefined : -1}
    >
      {t("label")}
    </Link>
  );
}
