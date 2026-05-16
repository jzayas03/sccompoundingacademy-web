import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { SectionBand } from "@/components/ui/SectionBand";

const KEYS = ["instructor", "cohorts", "usp", "certification"] as const;

const ICONS: Record<(typeof KEYS)[number], string> = {
  instructor: "M5 13l4 4L19 7",
  cohorts: "M17 20h5V10M9 20H4v-6m13-4V4H7v6",
  usp: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  certification: "M12 14l9-5-9-5-9 5 9 5zm0 7v-7",
};

export function WhySCCA() {
  const t = useTranslations("whySCCA");
  return (
    <SectionBand tone="sand" id="why">
      <Container>
        <Heading as="h2" size="h2" className="text-teal-deep">
          {t("title")}
        </Heading>
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {KEYS.map((k) => (
            <li key={k} className="flex flex-col gap-3">
              <span className="bg-chartreuse inline-flex h-12 w-12 items-center justify-center rounded-2xl">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="var(--color-teal-deep)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={ICONS[k]} />
                </svg>
              </span>
              <h3 className="font-heading text-teal-deep text-lg font-bold">
                {t(`items.${k}.title`)}
              </h3>
              <p className="text-base text-gray-900">{t(`items.${k}.body`)}</p>
            </li>
          ))}
        </ul>
      </Container>
    </SectionBand>
  );
}
