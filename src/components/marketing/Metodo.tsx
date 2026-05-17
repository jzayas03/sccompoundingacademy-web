import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";

type Tenet = { number: string; title: string; body: string };

/**
 * §03 — Método / Method.
 *
 * Four numbered tenets that describe how the academy works. Laid out
 * asymmetrically — each tenet sits in a 12-col grid with alternating
 * left/right offsets, so the rhythm of the page reads like the spread
 * of a printed essay (not a 4-column "features" card grid).
 *
 * Each tenet:
 *   - Oversize chartreuse-toned numeral (01–04) in Cormorant italic,
 *     aligned with the title's first baseline
 *   - Title in Avant Garde uppercase, tracked-wide
 *   - Body paragraph in Cormorant Garamond — same reading typeface as
 *     the Manifesto so the editorial voice continues
 *
 * The teal-deep dividing rule below each tenet mimics the rules between
 * chapters in an academic article.
 */
export function Metodo() {
  const t = useTranslations("metodo");
  const messages = useMessages() as unknown as {
    metodo: { tenets: Tenet[] };
  };
  const tenets = messages.metodo.tenets;

  // Asymmetric offsets: tenets 1 & 3 are left-leaning, 2 & 4 right-leaning.
  // Built on a 12-col grid so the columns breathe.
  const offsets = [
    "lg:col-start-1 lg:col-span-9",
    "lg:col-start-4 lg:col-span-9",
    "lg:col-start-1 lg:col-span-9",
    "lg:col-start-4 lg:col-span-9",
  ];

  return (
    <section
      aria-labelledby="metodo-heading"
      className="bg-sand text-teal-deep border-teal-deep/10 relative isolate border-t"
    >
      <Container className="relative py-16 sm:py-24 lg:py-32">
        {/* Header — same gutter rhythm as §01, §02 */}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-12">
          <header className="lg:col-span-3">
            <p className="font-heading text-teal-deep/60 text-xs font-medium tracking-[0.25em] uppercase">
              {t("sectionNumber")}
            </p>
            <h2
              id="metodo-heading"
              className="font-heading text-teal-deep mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
            >
              {t("sectionLabel")}
            </h2>
          </header>

          <p className="font-accent text-teal-deep/85 text-lg leading-snug italic lg:col-span-7 lg:text-xl">
            {t("intro")}
          </p>
        </div>

        {/* Four tenets, asymmetric stack */}
        <ol className="mt-16 grid gap-y-12 sm:gap-y-16 lg:mt-24 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-20">
          {tenets.map((tenet, idx) => (
            <li
              key={tenet.number}
              className={offsets[idx] ?? "lg:col-span-12"}
            >
              <article className="grid grid-cols-12 gap-4 sm:gap-6">
                {/* Oversize numeral */}
                <div className="col-span-3 sm:col-span-2">
                  <p
                    aria-hidden
                    className="font-accent text-teal-deep/30 text-5xl leading-none font-medium italic tabular-nums sm:text-6xl lg:text-7xl"
                  >
                    {tenet.number}
                  </p>
                </div>

                {/* Title + body */}
                <div className="col-span-9 sm:col-span-10">
                  <h3 className="font-heading text-teal-deep text-xs font-bold tracking-[0.25em] uppercase sm:text-sm">
                    {tenet.title}
                  </h3>
                  <p className="font-accent text-teal-deep mt-3 text-lg leading-[1.55] sm:text-xl lg:text-2xl">
                    {tenet.body}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
