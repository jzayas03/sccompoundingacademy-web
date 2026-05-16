import { cn } from "@/lib/cn";

export function Card({
  tone = "off-white",
  className,
  children,
}: {
  tone?: "off-white" | "sand" | "white";
  className?: string;
  children: React.ReactNode;
}) {
  const toneClasses = {
    "off-white": "bg-off-white",
    sand: "bg-sand",
    white: "bg-white",
  } as const;
  return (
    <div
      className={cn(
        "rounded-2xl p-6 shadow-[var(--shadow-soft)] sm:p-8",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
