"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Redeems the magic link. Navigation happens only on an explicit click
 * — the target is held in component state, never rendered as an
 * <a href>, so link-following email scanners can't consume the
 * single-use token. `target` is pre-validated by parseConfirmTarget to
 * be a same-origin /api/auth/callback/ path.
 */
export function ConfirmButton({ target }: { target: string }) {
  const t = useTranslations("portal.confirm");
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        window.location.assign(target);
      }}
      className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift focus-visible:ring-chartreuse font-heading mt-8 inline-flex h-12 w-full items-center justify-center rounded-md px-6 text-sm font-semibold ring-1 transition-[color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:text-base motion-safe:hover:-translate-y-px"
    >
      {pending ? t("pending") : t("cta")}
    </button>
  );
}
