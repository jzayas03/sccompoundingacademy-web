import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

type Item = { label: string; body: string };

/**
 * Confianza — trust band, three tonal cards.
 *
 * Recreated from the SCCA Design System handoff: affiliated program
 * (teal-deep), supervised practice (chartreuse), and USP-aligned
 * curriculum (sand). Each card leads with a tinted brand icon
 * (people / mortar / flask). Copy is the existing `confianza.items[]`
 * — the handoff and the live site carry the same three statements.
 *
 * Icons are monochrome SVGs in /public/icons, tinted to the card's
 * accent via CSS `mask-image` so a single asset recolors per surface.
 */
const CARD_TONES = [
  {
    icon: "/icons/people.svg",
    card: "bg-teal-deep",
    iconBox: "border-chartreuse/35 bg-chartreuse/15",
    iconColor: "var(--color-chartreuse)",
    title: "text-chartreuse",
    body: "text-off-white/75",
  },
  {
    icon: "/icons/mortar.svg",
    card: "bg-chartreuse",
    iconBox: "border-teal-deep/20 bg-teal-deep/10",
    iconColor: "var(--color-teal-deep)",
    title: "text-teal-deep",
    body: "text-teal-deep/75",
  },
  {
    icon: "/icons/flask.svg",
    card: "bg-sand",
    iconBox: "border-teal-deep/15 bg-teal-deep/10",
    iconColor: "var(--color-teal-deep)",
    title: "text-teal-deep",
    body: "text-teal-deep/70",
  },
] as const;

export function Confianza() {
  const t = useTranslations("confianza");
  const messages = useMessages() as unknown as { confianza: { items: Item[] } };
  const items = messages.confianza.items;

  return (
    <section aria-labelledby="confianza-heading" className="bg-white border-gray-300 border-t">
      <Container className="py-16 sm:py-20 lg:py-24">
        <h2 id="confianza-heading" className="sr-only">
          {t("srHeading")}
        </h2>
        <Reveal
          as="ul"
          className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch"
        >
          {items.map((item, i) => {
            const tone = CARD_TONES[i] ?? CARD_TONES[0];
            return (
              <li
                key={item.label}
                className={cn("flex h-full flex-col gap-5 rounded-[13px] p-7 sm:p-8", tone.card)}
              >
                <span
                  className={cn(
                    "inline-flex h-11 w-11 items-center justify-center rounded-[10px] border",
                    tone.iconBox,
                  )}
                >
                  <span
                    aria-hidden
                    className="h-[22px] w-[22px]"
                    style={{
                      backgroundColor: tone.iconColor,
                      WebkitMaskImage: `url(${tone.icon})`,
                      maskImage: `url(${tone.icon})`,
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                    }}
                  />
                </span>
                <div>
                  <h3
                    className={cn(
                      "font-heading text-base font-bold tracking-[-0.01em]",
                      tone.title,
                    )}
                  >
                    {item.label}
                  </h3>
                  <p className={cn("mt-2.5 text-sm leading-relaxed", tone.body)}>{item.body}</p>
                </div>
              </li>
            );
          })}
        </Reveal>
      </Container>
    </section>
  );
}
