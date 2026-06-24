"use client";

import { usePathname, useSearchParams } from "next/navigation";

/**
 * Owner-only portal preview toggle. Rendered only for ADMIN_EMAILS by
 * GlassNav. Links the current path to ?preview=profesional|student so an
 * owner can view either portal. Non-owners never see this and the param
 * is ignored server-side for them (see resolveEffectiveTier).
 */
export function AdminPortalToggle({
  label,
  profesionalLabel,
  estudianteLabel,
}: {
  label: string;
  profesionalLabel: string;
  estudianteLabel: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("preview") === "student" ? "student" : "profesional";

  function hrefFor(preview: "profesional" | "student"): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("preview", preview);
    return `${pathname}?${params.toString()}`;
  }

  const base =
    "font-heading inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold transition-colors";
  const active = "bg-teal-deep text-off-white";
  const inactive = "text-teal-deep hover:bg-teal-deep/10";

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span className="font-heading text-teal-deep/70 text-xs">{label}</span>
      <div className="border-teal-deep/20 inline-flex items-center gap-1 rounded-lg border p-0.5">
        <a href={hrefFor("profesional")} className={`${base} ${current === "profesional" ? active : inactive}`}>
          {profesionalLabel}
        </a>
        <a href={hrefFor("student")} className={`${base} ${current === "student" ? active : inactive}`}>
          {estudianteLabel}
        </a>
      </div>
    </div>
  );
}
