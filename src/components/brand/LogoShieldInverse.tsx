import { LogoShield } from "./LogoShield";

/**
 * Inverse shield: teal-deep body, chartreuse ink (mortar/pestle silhouette).
 * Used on light surfaces (sand, off-white) where currentColor + chartreuse
 * would lack contrast.
 *
 * Geometry is shared with LogoShield via composition — only the colors
 * change, so we just override the `inkColor` and let the parent's
 * `text-teal-deep` class drive `currentColor`.
 */
export function LogoShieldInverse({
  className,
  title = "SCCA shield (inverse)",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <LogoShield
      className={`text-teal-deep ${className ?? ""}`}
      title={title}
      inkColor="var(--color-chartreuse)"
    />
  );
}
