import { LogoShield } from "./LogoShield";
import { cn } from "@/lib/cn";

/**
 * Horizontal lockup for dark backgrounds (the primary brand lockup from the
 * Compounding Academy Brandsheet): chartreuse shield + off-white serif
 * wordmark stacked "Santa Cruz / Compounding / Academy".
 *
 * Typography per brandsheet:
 *   - The whole wordmark is in `font-accent` (Khmer MN → Cormorant Garamond)
 *   - "Santa Cruz" small (about 1/3 the size of the lower lines)
 *   - "Compounding" and "Academy" large, same size, stacked tightly
 */
export function LogoFull({
  className,
  shieldClass,
  title = "Santa Cruz Compounding Academy",
}: {
  className?: string;
  shieldClass?: string;
  title?: string;
}) {
  return (
    <div
      className={cn("text-chartreuse inline-flex items-center gap-3", className)}
      aria-label={title}
      role="img"
    >
      <LogoShield className={cn("h-12 w-auto", shieldClass)} title="" />
      {/* Per the brandsheet, the wordmark total height roughly matches the
          shield. Default base 14px sized for the 36-48px shield range used
          across header and footer. Tight leading keeps the three lines
          stacked compactly. Override via `wordmarkClass` if needed. */}
      <span className="font-accent text-off-white block text-sm leading-[0.95] sm:text-base">
        <span className="block text-[0.55em] font-normal tracking-wide">Santa Cruz</span>
        <span className="block font-medium">Compounding</span>
        <span className="block font-medium">Academy</span>
      </span>
    </div>
  );
}
