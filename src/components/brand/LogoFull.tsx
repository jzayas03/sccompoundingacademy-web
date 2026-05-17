import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Primary horizontal lockup — pixel-perfect render of the brandsheet asset
 * (chartreuse U-mark with bookmark + mortar/pestle inside + off-white serif
 * "Santa Cruz / Compounding / Academy" wordmark on a TRANSPARENT background,
 * intended to sit directly on the teal-deep header/footer surface).
 *
 * Source: `Untitled design.pdf` page 3, extracted at 300 DPI via pdftoppm
 * and trimmed in Sharp; teal-deep (#195561) card was then stripped to
 * alpha so the lockup blends seamlessly into any teal-deep container —
 * no visible card edge or color-mismatch halo around the logo.
 *
 * The image is a single PNG (3646×1566, RGBA) — the wordmark and mark
 * live inside it. We don't render the wordmark as HTML text because the
 * brandsheet positions the letters with very specific kerning + relative
 * sizing that's hard to reproduce in CSS; embedding the rendered lockup
 * keeps the brand identity unambiguous.
 *
 * Sizing: pass `shieldClass` to control the rendered height (e.g. `h-9`
 * in the header, `h-12` in the footer). Width auto-scales via aspect.
 */
export function LogoFull({
  className,
  shieldClass = "h-9 w-auto",
  title = "Santa Cruz Compounding Academy",
}: {
  className?: string;
  shieldClass?: string;
  title?: string;
}) {
  return (
    <span className={cn("inline-flex items-center", className)} aria-label={title} role="img">
      <Image
        src="/brand/logo-full.png"
        alt=""
        width={3646}
        height={1566}
        priority
        className={cn(shieldClass, "object-contain")}
      />
    </span>
  );
}
