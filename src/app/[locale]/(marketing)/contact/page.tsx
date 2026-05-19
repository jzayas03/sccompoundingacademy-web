import { setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/marketing/ContactForm";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContactForm />;
}
