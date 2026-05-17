import Image from "next/image";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { SectionBand } from "@/components/ui/SectionBand";

/**
 * Existing previous-batch component, lightly upgraded:
 *   - Replaces the empty teal-deep aspect-[4/5] placeholder block with
 *     the real instructor portrait photograph.
 *   - The photo is currently a placeholder image of a pharmacist
 *     compounding — a temporary stand-in until the academy provides
 *     a portrait of its actual instructor.
 * Layout, copy, and bg-tone otherwise unchanged from the previous
 * marketing-layout version.
 */
export function InstructorSection() {
  const t = useTranslations("instructor");
  return (
    <SectionBand tone="teal-deep" id="instructor">
      <Container className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="ring-chartreuse/20 relative aspect-[4/5] w-full overflow-hidden rounded-2xl ring-1">
            <Image
              src="/photos/photo-instructor.jpg"
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
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
