import { cn } from "@/lib/cn";

export function Pattern({ className, opacity = 0.12 }: { className?: string; opacity?: number }) {
  const id = "scca-pattern";
  return (
    <svg
      aria-hidden
      className={cn("absolute inset-0 h-full w-full", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={id} width="80" height="90" patternUnits="userSpaceOnUse">
          <g fill="var(--color-teal-deep)" opacity={opacity}>
            <rect x="6" y="6" width="32" height="36" rx="6" />
            <rect x="44" y="46" width="30" height="14" rx="4" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
