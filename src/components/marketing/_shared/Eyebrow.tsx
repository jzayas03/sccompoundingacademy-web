import { cn } from "@/lib/cn";

/**
 * Eyebrow — teal uppercase micro-label prefixed with a chartreuse tick.
 * The section's small kicker above a heading. Styling lives in the
 * `.eyebrow` / `.eyebrow-bar` utilities in globals.css.
 */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("eyebrow", className)}>
      <span className="eyebrow-bar" aria-hidden />
      {children}
    </p>
  );
}
