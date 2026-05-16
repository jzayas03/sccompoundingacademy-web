import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { SectionBand } from "@/components/ui/SectionBand";

export function LegalPage({ doc }: { doc: "privacy" | "terms" }) {
  const t = useTranslations(`legal.${doc}`);
  return (
    <SectionBand tone="off-white">
      <Container className="max-w-3xl">
        <Heading as="h1" size="h1" className="text-teal-deep">
          {t("title")}
        </Heading>
        <p className="mt-6 text-base text-gray-900">{t("body")}</p>
      </Container>
    </SectionBand>
  );
}
