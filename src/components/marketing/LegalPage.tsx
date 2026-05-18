import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";

type Section = { heading: string; body: string };
type LegalDoc = {
  title: string;
  lastUpdated: string;
  draftNotice: string;
  intro: string;
  sections: Section[];
};

/**
 * LegalPage — render structured long-form legal text (privacy, terms,
 * refund policy) from a single i18n namespace shape:
 *
 *   {
 *     title:        "Política de Privacidad",
 *     lastUpdated:  "Última actualización: …",
 *     draftNotice:  "Borrador — pendiente de revisión legal",
 *     intro:        "Lead paragraph…",
 *     sections:     [{ heading: "1. …", body: "Paragraph 1\n\nParagraph 2" }, …]
 *   }
 *
 * Body strings use double-newline (\n\n) as the paragraph separator —
 * each split chunk becomes a <p>. Keeps i18n maintenance trivial vs
 * embedding markdown or HTML.
 */
export function LegalPage({ doc }: { doc: "privacy" | "terms" | "refund" }) {
  const t = useTranslations(`legal.${doc}`);
  const messages = useMessages() as unknown as { legal: Record<string, LegalDoc> };
  const sections = messages.legal[doc]?.sections ?? [];
  // Render the chartreuse draft-notice chip only when the i18n string is
  // non-empty. Once the attorney signs off the final wording, the string
  // in `legal.{doc}.draftNotice` is emptied and the chip disappears — no
  // template edit needed. To re-trigger the chip for a future review
  // cycle, just set the string again in messages/*.json.
  const draftNotice = t("draftNotice");

  return (
    <section className="bg-white">
      <Container className="max-w-3xl py-16 sm:py-20 lg:py-24">
        {draftNotice && (
          <p
            role="note"
            className="border-chartreuse text-teal-deep font-heading bg-chartreuse/30 mb-10 inline-block rounded-md border px-3 py-1.5 text-xs font-semibold tracking-wide uppercase"
          >
            {draftNotice}
          </p>
        )}

        <h1 className="font-heading text-teal-deep text-3xl font-bold tracking-[-0.015em] sm:text-4xl lg:text-5xl">
          {t("title")}
        </h1>
        <p className="text-gray-700 font-heading mt-3 text-sm font-medium tracking-wide uppercase">
          {t("lastUpdated")}
        </p>
        <p className="text-gray-900 mt-8 text-base leading-relaxed sm:text-lg">{t("intro")}</p>

        <div className="mt-12 space-y-10">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-heading text-teal-deep text-xl font-semibold sm:text-2xl">
                {s.heading}
              </h2>
              <div className="mt-4 space-y-4">
                {s.body.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className="text-gray-900 text-base leading-relaxed sm:leading-loose"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </section>
  );
}
