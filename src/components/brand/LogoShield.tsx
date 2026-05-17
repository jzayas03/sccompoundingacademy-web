import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * SCCA shield mark — chartreuse rounded shield containing the SCCA
 * letterform header + mortar/pestle/bookmark composition in off-white,
 * on a TRANSPARENT background so the shield can sit on any surface
 * without a visible card edge.
 *
 * The PNG is tight-trimmed (373×496, RGBA) — no transparent padding
 * around the mark, so it scales cleanly via `object-contain` at any
 * rendered height. For the horizontal lockup with wordmark, use
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
        width={373}
        height={496}
        className="h-full w-auto object-contain"
      />
    </span>
  );
}
