import { LogoShield } from "./LogoShield";
import { cn } from "@/lib/cn";

/**
 * Horizontal lockup for dark backgrounds: teal-deep shield (via currentColor
 * on .text-teal-deep) + off-white wordmark.
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
      className={cn("text-teal-deep inline-flex items-center gap-3", className)}
      aria-label={title}
      role="img"
    >
      <LogoShield className={cn("h-12 w-auto", shieldClass)} title="" />
      <span className="font-heading leading-none">
        <span className="text-off-white block text-xs font-medium">Santa Cruz</span>
        <span className="text-off-white block text-xl font-bold">Compounding</span>
        <span className="text-off-white block text-xl font-bold">Academy</span>
      </span>
    </div>
  );
}
