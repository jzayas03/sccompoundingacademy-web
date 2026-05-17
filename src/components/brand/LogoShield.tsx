import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * SCCA shield mark — pixel-perfect render of the brandsheet asset
 * (chartreuse rounded square card containing the mortar/pestle/bookmark
 * mark in teal-deep, used as a standalone badge).
 *
 * Source: `Untitled design.pdf` page 5, extracted at 300 DPI via pdftoppm
 * and trimmed in Sharp.
 *
 * No tinting / color overrides — the brandsheet provides this as a
 * self-contained asset. If a context needs a different palette pairing,
 * use LogoFull (which embeds the off-white wordmark on teal-deep) or
 * reach for the bare PNG path `/brand/logo-mark.png`.
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
