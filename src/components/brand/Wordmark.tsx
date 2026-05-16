import { cn } from "@/lib/cn";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-heading font-bold tracking-tight", className)}>
      Santa Cruz Compounding Academy
    </span>
  );
}
