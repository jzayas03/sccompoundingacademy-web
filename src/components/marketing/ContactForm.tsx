"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { SectionBand } from "@/components/ui/SectionBand";

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      subject: form.get("subject"),
      message: form.get("message"),
      locale,
    };
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setStatus(res.ok ? "success" : "error");
    if (res.ok) (e.target as HTMLFormElement).reset();
  }

  return (
    <SectionBand tone="off-white">
      <Container className="max-w-2xl">
        <Heading as="h1" size="h1" className="text-teal-deep">
          {t("title")}
        </Heading>
        <p className="mt-3 text-lg text-gray-900">{t("subhead")}</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <FormField label={t("name")} name="name" required />
          <FormField label={t("email")} name="email" type="email" required />
          <FormField label={t("phone")} name="phone" type="tel" />
          <FormField label={t("subject")} name="subject" />
          <FormField as="textarea" label={t("message")} name="message" required />
          <Button type="submit" variant="primary" size="lg" disabled={status === "submitting"}>
            {status === "submitting" ? t("submitting") : t("submit")}
          </Button>
          {status === "success" && <p className="text-teal-deep">{t("success")}</p>}
          {status === "error" && <p className="text-red-700">{t("error")}</p>}
        </form>
      </Container>
    </SectionBand>
  );
}
