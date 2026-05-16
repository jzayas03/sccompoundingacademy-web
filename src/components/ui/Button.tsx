import { cn } from "@/lib/cn";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "inverse";
type Size = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center font-heading font-semibold rounded-md " +
  "transition-colors focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-chartreuse focus-visible:ring-offset-2 focus-visible:ring-offset-teal-deep " +
  "disabled:opacity-50 disabled:pointer-events-none";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-chartreuse text-teal-deep hover:bg-chartreuse/90",
  secondary: "border-2 border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-off-white",
  ghost: "text-teal-deep hover:bg-sand",
  inverse: "bg-off-white text-teal-deep hover:bg-sand",
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
