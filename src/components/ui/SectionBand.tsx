import { cn } from "@/lib/cn";

type Tone = "teal-deep" | "teal" | "sand" | "off-white" | "white";

const TONES: Record<Tone, string> = {
  "teal-deep": "bg-teal-deep text-off-white",
  teal: "bg-teal text-off-white",
  sand: "bg-sand text-teal-deep",
  "off-white": "bg-off-white text-teal-deep",
  white: "bg-white text-teal-deep",
};

export function SectionBand({
  tone = "off-white",
  className,
  children,
  id,
}: {
  tone?: Tone;
  className?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("w-full py-16 sm:py-24", TONES[tone], className)}>
      {children}
    </section>
  );
}
