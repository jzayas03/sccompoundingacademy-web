import { LogoShield } from "./LogoShield";
import { cn } from "@/lib/cn";

/**
 * Horizontal lockup for light backgrounds: teal-deep shield + teal-deep
 * serif wordmark. Mirrors LogoFull's typography exactly, with the colors
 * inverted for legibility on sand/off-white surfaces.
 */
export function LogoFullInverse({
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
      className={cn("text-teal-deep inline-flex items-center gap-3", className)}
      aria-label={title}
      role="img"
    >
      <LogoShield
        className={cn("h-12 w-auto", shieldClass)}
        title=""
        inkColor="var(--color-chartreuse)"
      />
      <span className="font-accent text-teal-deep block text-sm leading-[0.95] sm:text-base">
        <span className="block text-[0.55em] font-normal tracking-wide">Santa Cruz</span>
        <span className="block font-medium">Compounding</span>
        <span className="block font-medium">Academy</span>
      </span>
    </div>
  );
}
