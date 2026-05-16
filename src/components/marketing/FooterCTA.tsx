import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { SectionBand } from "@/components/ui/SectionBand";
import { Link } from "@/i18n/routing";

export function FooterCTA() {
  const t = useTranslations("footerCta");
  return (
    <SectionBand tone="sand">
      <Container className="text-center">
        <Heading as="h2" size="h2" className="text-teal-deep">
          {t("headline")}
        </Heading>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-900">{t("subhead")}</p>
        <div className="mt-8">
          <Link href="/cursos">
            <Button variant="primary" size="lg">
              {t("button")}
            </Button>
          </Link>
        </div>
      </Container>
    </SectionBand>
  );
}
