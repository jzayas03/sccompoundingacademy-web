import { cn } from "@/lib/cn";

type Tone = "teal" | "chartreuse" | "sand";

const TONES: Record<Tone, string> = {
  teal: "bg-teal-deep text-chartreuse",
  chartreuse: "bg-chartreuse text-teal-deep",
  sand: "bg-sand text-teal-deep",
};

export function Badge({
  tone = "teal",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
