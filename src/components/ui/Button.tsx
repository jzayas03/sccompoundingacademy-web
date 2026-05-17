import { cn } from "@/lib/cn";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "inverse";
type Size = "md" | "lg";

// Transitions include transform + shadow so the crystalline hover-lift
// (translate-y + shadow upgrade) feels coordinated, not snappy.
const BASE =
  "inline-flex items-center justify-center font-heading font-semibold rounded-md " +
  "transition-[color,background-color,box-shadow,transform] duration-200 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-chartreuse focus-visible:ring-offset-2 focus-visible:ring-offset-teal-deep " +
  "disabled:opacity-50 disabled:pointer-events-none";

// Crystalline button vocabulary — each variant has a defined edge
// (ring + optional border) and a soft lift (shadow-soft → shadow-lift
// on hover) so the button reads as a tactile, raised surface rather
// than a flat color swatch. The hover translate-y is gated by
// `motion-safe:` so reduced-motion users get the color/shadow change
// without the parallax bump.
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-chartreuse text-teal-deep ring-1 ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift motion-safe:hover:-translate-y-px",
  secondary:
    "bg-white text-teal-deep border-2 border-teal-deep shadow-soft hover:bg-teal-deep hover:text-off-white hover:shadow-lift motion-safe:hover:-translate-y-px",
  ghost: "text-teal-deep hover:bg-sand",
  inverse:
    "bg-off-white text-teal-deep ring-1 ring-teal-deep/15 shadow-soft hover:bg-white hover:shadow-lift motion-safe:hover:-translate-y-px",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base",
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest} />
  );
});
