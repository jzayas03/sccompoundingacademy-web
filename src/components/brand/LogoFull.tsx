import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Primary horizontal lockup — chartreuse U-mark with bookmark + mortar/pestle
 * inside + off-white serif "Santa Cruz / Compounding / Academy" wordmark on a
 * TRANSPARENT background, intended to sit directly on the teal-deep header
 * and footer surfaces.
 *
 * The image is a single PNG (525×160, RGBA) — content was provided by the
 * brand owner pre-stripped to alpha and tight-trimmed (no transparent
 * padding around the mark), so it scales cleanly via `object-contain` at
 * any rendered height without internal whitespace eating the visual size.
 *
 * Sizing: pass `shieldClass` to control the rendered height (e.g. `h-12`
 * in the header). Width auto-scales via aspect ratio (~3.28:1).
 */
export function LogoFull({
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
        src="/brand/logo-full.png"
        alt=""
        width={525}
        height={160}
        priority
        className={cn(shieldClass, "object-contain")}
      />
    </span>
  );
}
