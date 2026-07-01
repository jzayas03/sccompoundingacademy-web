import { cn } from "@/lib/cn";

export function Card({
  tone = "off-white",
  variant = "default",
  className,
  children,
}: {
  tone?: "off-white" | "sand" | "white";
  variant?: "default" | "editorial";
  className?: string;
  children: React.ReactNode;
}) {
  if (variant === "editorial") {
    return (
      <div className={cn("editorial-card p-6 sm:p-8", className)}>
        {children}
      </div>
    );
  }

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
