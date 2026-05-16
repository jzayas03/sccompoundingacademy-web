import { cn } from "@/lib/cn";

const SIZES = {
  display: "text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05]",
  h1: "text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight",
  h2: "text-3xl sm:text-4xl font-bold leading-tight",
  h3: "text-2xl sm:text-3xl font-semibold leading-snug",
  h4: "text-xl font-semibold leading-snug",
} as const;

export function Heading({
  as: Tag = "h2",
  size = "h2",
  className,
  children,
}: {
  as?: "h1" | "h2" | "h3" | "h4";
  size?: keyof typeof SIZES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag className={cn("font-heading tracking-tight", SIZES[size], className)}>{children}</Tag>
  );
}
