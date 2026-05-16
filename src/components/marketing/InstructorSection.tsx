import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { SectionBand } from "@/components/ui/SectionBand";

export function InstructorSection() {
  const t = useTranslations("instructor");
  return (
    <SectionBand tone="teal-deep" id="instructor">
      <Container className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="bg-teal aspect-[4/5] w-full rounded-2xl" aria-hidden />
        </div>
        <div className="lg:col-span-3">
          <Heading as="h2" size="h2" className="text-chartreuse">
            {t("title")}
          </Heading>
          <p className="text-off-white mt-6 max-w-2xl text-lg">{t("bioPlaceholder")}</p>
        </div>
      </Container>
    </SectionBand>
  );
}
