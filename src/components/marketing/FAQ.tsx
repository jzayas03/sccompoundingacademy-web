"use client";
import { useTranslations, useMessages } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { SectionBand } from "@/components/ui/SectionBand";
import { Accordion } from "@/components/ui/Accordion";

export function FAQ() {
  const t = useTranslations("faq");
  const messages = useMessages() as unknown as { faq: { items: { q: string; a: string }[] } };
  const items = messages.faq.items;
  return (
    <SectionBand tone="off-white" id="faq">
      <Container className="max-w-3xl">
        <Heading as="h2" size="h2" className="text-teal-deep">
          {t("title")}
        </Heading>
        <div className="mt-8">
          <Accordion items={items} />
        </div>
      </Container>
    </SectionBand>
  );
}
