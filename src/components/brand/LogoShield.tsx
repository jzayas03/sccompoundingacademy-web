import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * SCCA shield mark — pixel-perfect render of the brandsheet asset
 * (chartreuse rounded shield containing SCCA + mortar/pestle/bookmark
 * in teal-deep). The PNG ships with a TRANSPARENT background so the
 * shield can sit on any surface without a visible white card edge —
 * the original capture's white backdrop was stripped to alpha via
 * Sharp (tolerance 18 + 12px feather to preserve antialiasing).
 *
 * Source: `Untitled design.pdf` page 5, extracted at 300 DPI via
 * pdftoppm and trimmed in Sharp.
 *
 * No tinting / color overrides — the brandsheet provides this as a
 * self-contained asset. For the horizontal lockup with wordmark, use
 * LogoFull (also transparent RGBA).
 */
export function LogoShield({
  className,
  title = "SCCA",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span className={cn("inline-flex", className)} aria-label={title} role="img">
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={1887}
        height={1878}
        className="h-full w-auto object-contain"
      />
    </span>
  );
}
