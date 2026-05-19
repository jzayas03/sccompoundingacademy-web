import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Dark monochrome lockup — solid-black mortar/pestle shield + black
 * serif "Santa Cruz / Compounding / Academy" wordmark on transparent.
 * Designed for the **light** surfaces in the design system (portal
 * mesh background, paper-tinted certificate body, white print copy).
 *
 * The colored teal-deep + chartreuse variant (`LogoFull`) blends into
 * the off-white wordmark on light backgrounds and turns into a faint
 * ghost — the portal `/verify` and `/login` surfaces were the
 * regression that motivated this asset.
 *
 * Same 526×160 trimmed aspect ratio as `LogoFull` so call sites that
 * pin a `shieldClass` height (e.g. `h-10`) yield identical widths
 * between the two variants — no layout shift when swapping.
 */
export function LogoFullInverse({
  className,
  shieldClass = "h-12 w-auto",
  title = "Santa Cruz Compounding Academy",
}: {
  className?: string;
  shieldClass?: string;
  title?: string;
}) {
  return (
    <span className={cn("inline-flex items-center", className)} aria-label={title} role="img">
      <Image
        src="/brand/logo-full-dark.png"
        alt=""
        width={526}
        height={160}
        priority
        className={cn(shieldClass, "object-contain")}
      />
    </span>
  );
}
