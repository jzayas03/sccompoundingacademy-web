import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function HeroBillboard() {
  const t = useTranslations("hero");
  return (
    <section className="bg-teal-deep relative isolate overflow-hidden">
      <Container className="relative grid items-center gap-10 py-20 sm:py-28 lg:grid-cols-2">
        <div>
          <Badge tone="chartreuse">USP 795 · USP 800</Badge>
          <h1 className="font-heading text-chartreuse mt-4 text-5xl leading-[1.05] font-extrabold tracking-tight uppercase sm:text-6xl lg:text-7xl">
            {t("headline")}
          </h1>
          <p className="text-off-white mt-6 max-w-lg text-lg">{t("subhead")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cursos">
              <Button variant="primary" size="lg">
                {t("primaryCta")}
              </Button>
            </Link>
            <Link href="/contacto">
              <Button variant="inverse" size="lg">
                {t("secondaryCta")}
              </Button>
            </Link>
          </div>
        </div>
        {/* Right column intentionally empty — mortar concept abandoned. Future
            visual (photo, illustration, etc.) drops in here. */}
        <div className="hidden lg:block" aria-hidden />
      </Container>
    </section>
  );
}
