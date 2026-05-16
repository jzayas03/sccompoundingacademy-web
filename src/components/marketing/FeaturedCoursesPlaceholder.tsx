import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionBand } from "@/components/ui/SectionBand";
import { Link } from "@/i18n/routing";

const PLACEHOLDER_COURSES = [
  {
    id: "usp-795",
    badge: "USP 795",
    titleEs: "Fundamentos de Compounding No Estéril",
    titleEn: "Non-Sterile Compounding Foundations",
  },
  {
    id: "usp-800",
    badge: "USP 800",
    titleEs: "Manejo de Medicamentos Peligrosos",
    titleEn: "Hazardous Drug Handling",
  },
  {
    id: "combined",
    badge: "USP 795 + 800",
    titleEs: "Programa Combinado",
    titleEn: "Combined Track",
  },
] as const;

export function FeaturedCoursesPlaceholder({ locale }: { locale: "es" | "en" }) {
  const t = useTranslations("featured");
  return (
    <SectionBand tone="off-white" id="featured">
      <Container>
        <div className="flex items-end justify-between">
          <Heading as="h2" size="h2" className="text-teal-deep">
            {t("title")}
          </Heading>
          <Link
            href="/cursos"
            className="font-heading text-teal-deep hover:text-teal hidden text-sm font-semibold sm:inline"
          >
            {t("viewAll")} →
          </Link>
        </div>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {PLACEHOLDER_COURSES.map((c) => (
            <li key={c.id}>
              <Card tone="white" className="h-full">
                <Badge tone="chartreuse">{c.badge}</Badge>
                <h3 className="font-heading text-teal-deep mt-4 text-xl font-bold">
                  {locale === "es" ? c.titleEs : c.titleEn}
                </h3>
                <p className="mt-3 text-sm text-gray-700">{t("comingSoon")}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </SectionBand>
  );
}
