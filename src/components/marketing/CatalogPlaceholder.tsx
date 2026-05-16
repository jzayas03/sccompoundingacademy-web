import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { SectionBand } from "@/components/ui/SectionBand";

export function CatalogPlaceholder() {
  const t = useTranslations("courses");
  return (
    <SectionBand tone="off-white">
      <Container>
        <Heading as="h1" size="h1" className="text-teal-deep">
          {t("title")}
        </Heading>
        <p className="mt-4 max-w-2xl text-lg text-gray-900">{t("comingSoonNotice")}</p>
      </Container>
    </SectionBand>
  );
}
