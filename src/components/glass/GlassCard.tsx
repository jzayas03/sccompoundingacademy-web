import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  /** Adds a chartreuse-accent hover/focus state. Use on interactive cards. */
  interactive?: boolean;
  /** Custom Tailwind classes appended after the glass tokens. */
  className?: string;
  /** Render as a different element when the card is semantically a button /
   * article / etc. Defaults to `div`. */
  as?: "div" | "article" | "section" | "aside";
};

/**
 * GlassCard — medium-intensity glassmorphism surface for portal UI.
 *
 * Applies the `.glass-card` utility from globals.css (background opacity,
 * `backdrop-filter: blur(20px)`, soft teal-deep shadow) so the visual
 * settings stay in one place. Sits over a `<MeshBackground />` for the
 * blur to register against real color variation; on plain solid backgrounds
 * the blur effect is invisible.
 */
export function GlassCard({
  children,
  interactive = false,
  className,
  as = "div",
}: GlassCardProps) {
  const Component = as;
  return (
    <Component
      className={cn(
        "glass-card rounded-lg p-6 sm:p-8",
        interactive && "glass-card-hover transition-[background-color,border-color] duration-200 ease-out",
        className,
      )}
    >
      {children}
    </Component>
  );
}
