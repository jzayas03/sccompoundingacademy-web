import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

type Outcome = { label: string; body: string };

/**
 * Aprenderás — concrete learning outcomes.
 *
 * Two-column layout (5/12 + 7/12): heading + intro on the left, six
 * outcomes as a checklist on the right. Each outcome is a discipline
 * (technique, documentation, occupational safety, BUD calc, excipient
 * handling, compliance) — phrased as a capability the graduate gains.
 *
 * Why no icons per row: keeps the column visually quiet so the actual
 * outcome labels read first. A single small check svg per item is enough
 * affordance to signal "you'll be able to".
 */
export function Aprenderas() {
  const t = useTranslations("aprenderas");
  const messages = useMessages() as unknown as { aprenderas: { items: Outcome[] } };
  const items = messages.aprenderas.items;

  return (
    <section
      aria-labelledby="aprenderas-heading"
      className="bg-white border-gray-300 border-t"
    >
      <Container className="grid grid-cols-1 gap-12 py-20 sm:py-24 lg:grid-cols-12 lg:gap-x-12 lg:py-28">
        <Reveal className="lg:col-span-5">
          <p className="font-heading text-teal-deep/70 text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm">
            {t("eyebrow")}
          </p>
          <h2
            id="aprenderas-heading"
            className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.015em] sm:text-4xl lg:text-5xl"
          >
            {t("heading")}
          </h2>
          <p className="text-gray-900 mt-5 text-base leading-relaxed sm:text-lg">
            {t("intro")}
          </p>
        </Reveal>

        <Reveal as="ul" className="divide-gray-300 border-gray-300 divide-y border-y lg:col-span-7">
          {items.map((item) => (
            <li key={item.label} className="flex items-start gap-4 py-5 sm:py-6">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                className="text-teal-deep mt-1 h-5 w-5 shrink-0"
              >
                <path
                  d="M5 12.5l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="min-w-0">
                <h3 className="font-heading text-gray-900 text-base font-semibold sm:text-lg">
                  {item.label}
                </h3>
                <p className="text-gray-700 mt-1.5 text-sm leading-relaxed sm:text-base">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
