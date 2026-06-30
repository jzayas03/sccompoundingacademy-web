import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === "es"
        ? "Enlace de pago no disponible · SCCA"
        : "Payment link unavailable · SCCA",
    robots: { index: false, follow: false },
  };
}

const KNOWN = ["expirado", "invalido", "pagado", "cerrada", "error", "reenviado"] as const;

export default async function PagoCerradoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reason?: string }>;
}) {
  const { locale } = await params;
  const { reason } = await searchParams;
  const key = (KNOWN as readonly string[]).includes(reason ?? "") ? reason! : "error";
  const t = await getTranslations({ locale, namespace: "inscripcion.pagoCerrado" });
  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <h1 className="font-heading text-teal-deep text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-4 text-gray-700">{t(`reasons.${key}`)}</p>
      {key === "expirado" && (
        <form
          action="/api/inscripcion/reenviar-pago"
          method="post"
          className="mt-6 flex flex-col items-center gap-3"
        >
          <input
            name="email"
            type="email"
            required
            placeholder={t("emailPlaceholder")}
            className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2.5"
          />
          <button
            type="submit"
            className="bg-chartreuse text-teal-deep rounded-md px-6 py-2.5 font-semibold"
          >
            {t("resend")}
          </button>
        </form>
      )}
      <p className="mt-6 text-sm text-gray-700">{t("contact")}</p>
    </main>
  );
}
