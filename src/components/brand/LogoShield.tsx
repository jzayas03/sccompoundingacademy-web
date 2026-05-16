import { cn } from "@/lib/cn";

/**
 * SCCA shield mark — stylized "SC" inside a rounded square.
 *
 * Geometry mirrors public/icons/logo-mark.svg (the imported reference asset).
 * The shield body uses currentColor (so callers control it via Tailwind text-*
 * classes), and the inner glyph fills use brand CSS variables so they always
 * track lib/brand.ts rather than baked hex.
 */
export function LogoShield({
  className,
  title = "SCCA shield",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 58 58"
      role="img"
      aria-label={title}
      className={cn("block", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <rect width="58" height="58" rx="14" fill="currentColor" />
      <path
        d="M14 17h16v18c0 7.5 6.2 13.5 13.7 13.5H48v6H28.5C20.5 54.5 14 48 14 40V17Z"
        fill="var(--color-chartreuse)"
      />
      <path d="M31 17h14v26h-8.5L31 35.5V17Z" fill="var(--color-chartreuse)" />
      <path d="M18 27l25 24" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M18 27l25 24"
        stroke="var(--color-chartreuse)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
