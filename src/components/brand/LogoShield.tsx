import { cn } from "@/lib/cn";

/**
 * SCCA brand mark — chartreuse rounded U-shape with a bookmark notch on the
 * top-right, mortar-and-pestle silhouette inside.
 *
 * Geometry hand-drawn from the Compounding Academy Brandsheet (the source PDF
 * lives at /Users/jan.zayas1/Desktop/scca_landing_components/Compounding
 * Academy Brandsheet.pdf). When a vector source becomes available, replace
 * the path data — the public component API stays the same.
 *
 * Color knobs:
 *   - The shield body fills with `currentColor` (set via Tailwind text-*).
 *   - The mortar/pestle silhouette fills with `var(--color-teal-deep)` by
 *     default — passed via the `inkColor` prop if you need to override.
 */
export function LogoShield({
  className,
  title = "SCCA shield",
  inkColor = "var(--color-teal-deep)",
}: {
  className?: string;
  title?: string;
  inkColor?: string;
}) {
  return (
    <svg
      viewBox="0 0 72 90"
      role="img"
      aria-label={title}
      className={cn("block", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>

      {/* Outer shield = body + bookmark tab. Two overlapping rounded
          rectangles in the same fill — the bookmark sits on top of the body
          at the upper-right, mimicking the brandsheet lockup. */}
      <rect x="8" y="22" width="52" height="64" rx="14" fill="currentColor" />
      <rect x="40" y="6" width="14" height="22" rx="3" fill="currentColor" />

      {/* Mortar rim — thin horizontal pill across the middle */}
      <rect x="18" y="50" width="32" height="5" rx="2.5" fill={inkColor} />

      {/* Mortar bowl — half-ellipse hanging below the rim */}
      <path
        d="M 18 55 Q 18 75 34 75 Q 50 75 50 55 Z"
        fill={inkColor}
      />

      {/* Pestle — rounded rectangle leaning ~22° with handle at upper-left
          and bowl-end resting inside the rim. Rotation pivots around the
          bar's own center so the geometry is easy to reason about. */}
      <rect
        x="22"
        y="18"
        width="5"
        height="40"
        rx="2.5"
        fill={inkColor}
        transform="rotate(22 24.5 38)"
      />
    </svg>
  );
}
