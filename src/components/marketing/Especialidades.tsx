import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

type Specialty = { id: string; label: string; body: string };

/**
 * §02.5 — Especialidades / Specialties.
 *
 * A menu of practice areas the program prepares graduates to enter,
 * sourced from the affiliated Santa Cruz Pharma Care's actual practice
 * scope (dermatológico, hormonal, pediatría, veterinario, BLT, general).
 *
 * Treated as an editorial "index of capabilities" rather than a
 * feature-card grid:
 *
 *   - Same sand reading surface + left-gutter §-number rhythm
 *   - Two-column type-driven menu on lg+, stacks to single column
 *     on smaller screens
 *   - Each row: small uppercase eyebrow label + italic Cormorant body
 *   - Hairline rule between every other row (1×2 zig-zag pattern)
 *   - Closing attribution line that establishes the sister-pharmacy
 *     bridge: '15+ years of practice in Bayamón, Puerto Rico'
 */
export function Especialidades() {
  const t = useTranslations("especialidades");
  const messages = useMessages() as unknown as {
    especialidades: { items: Specialty[] };
  };
  const items = messages.especialidades.items;

  return (
    <section
      aria-labelledby="especialidades-heading"
      className="bg-sand text-teal-deep border-teal-deep/10 relative isolate border-t"
    >
      <Container className="relative py-20 sm:py-28 lg:py-40">
        <Reveal className="grid gap-10 lg:grid-cols-12 lg:gap-x-12">
          {/* Left gutter: §02.5 / Especialidades */}
          <header className="lg:col-span-3">
            <p className="font-heading text-teal-deep/60 text-xs font-medium tracking-[0.25em] uppercase">
              {t("sectionNumber")}
            </p>
            <h2
              id="especialidades-heading"
              className="font-heading text-teal-deep mt-2 text-4xl font-bold tracking-[-0.025em] sm:text-5xl lg:text-6xl"
            >
              {t("sectionLabel")}
            </h2>
            <p className="text-teal-deep/85 mt-6 text-base leading-relaxed sm:text-lg">
              {t("intro")}
            </p>
          </header>

          {/* Right column: two-column menu of specialties */}
          <div className="lg:col-span-9">
            <ul className="grid grid-cols-1 gap-x-8 gap-y-10 sm:gap-y-12 md:grid-cols-2 md:gap-x-12">
              {items.map((it) => (
                <li key={it.id} className="border-teal-deep/15 border-t pt-6">
                  <p className="font-heading text-teal-deep text-xs font-bold tracking-[0.25em] uppercase sm:text-sm">
                    {it.label}
                  </p>
                  <p className="text-teal-deep mt-3 text-base leading-relaxed sm:text-lg">
                    {it.body}
                  </p>
                </li>
              ))}
            </ul>

            {/* Sister-pharmacy attribution — small, deferent, factual */}
            <p className="border-teal-deep/20 text-teal-deep/70 font-heading mt-12 border-t pt-6 text-xs leading-snug tracking-wide sm:text-sm">
              {t("attribution")}
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
