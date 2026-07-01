"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "./_shared/Eyebrow";

type Status = "idle" | "submitting" | "success" | "error";

const FIELD =
  "block w-full rounded-md border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 " +
  "outline-none transition-colors placeholder:text-gray-500 " +
  "focus:border-teal focus:ring-2 focus:ring-teal/30";
const LABEL = "font-heading text-teal-deep mb-1.5 block text-sm font-semibold";

/**
 * HomeContact — on-page contact section (info + form + map).
 *
 * Recreated from the SCCA Design System handoff (Contact section): a
 * two-column block with contact details on the left and a message form
 * on the right, over an embedded campus map. The form posts to the live
 * `/api/contact` endpoint (same contract the standalone /contacto page
 * uses), so this is a working form, not the handoff's mock.
 *
 * Detail values (email/phone/office) reuse the `footer` namespace; the
 * map query reuses `ubicacion.embedQuery` so the pin has one source.
 */
export function HomeContact() {
  const t = useTranslations("contactHome");
  const f = useTranslations("footer");
  const u = useTranslations("ubicacion");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");

  const embedQuery = u("embedQuery");
  const mapSrc = `https://maps.google.com/maps?q=${embedQuery}&t=&z=15&output=embed`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: "",
          subject: data.get("subject"),
          message: data.get("message"),
          locale,
        }),
      });
      if (res.ok) {
        setStatus("success");
        formEl.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contacto" aria-labelledby="contacto-heading" className="bg-white border-gray-300 border-t">
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-x-16">
          {/* Left — heading + details */}
          <div>
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2
              id="contacto-heading"
              className="font-heading text-teal-deep mt-3 text-3xl font-bold tracking-[-0.02em] sm:text-4xl"
            >
              {t("heading")}
            </h2>
            <p className="text-gray-700 mt-4 text-base leading-relaxed">{t("intro")}</p>

            <dl className="mt-8 space-y-4 text-sm text-gray-900">
              <div>
                <dt className="text-teal-deep font-semibold">{f("emailLabel")}</dt>
                <dd className="mt-1">
                  <a href={`mailto:${f("email")}`} className="hover:text-teal break-all transition-colors">
                    {f("email")}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-teal-deep font-semibold">{f("phoneLabel")}</dt>
                <dd className="mt-1">
                  <a
                    href={`tel:+1${f("phone").replace(/-/g, "")}`}
                    className="hover:text-teal transition-colors"
                  >
                    {f("phone")}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-teal-deep font-semibold">{t("officeLabel")}</dt>
                <dd className="mt-1 leading-relaxed">{f("address")}</dd>
              </div>
            </dl>
          </div>

          {/* Right — message form (or success state) */}
          <div>
            {status === "success" ? (
              <div className="bg-off-white flex h-full min-h-56 flex-col items-center justify-center rounded-[13px] p-10 text-center">
                <p className="font-heading text-teal-deep text-lg font-bold">{t("success")}</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL} htmlFor="hc-name">
                      {t("name")}
                    </label>
                    <input
                      id="hc-name"
                      name="name"
                      required
                      className={FIELD}
                      placeholder={t("namePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className={LABEL} htmlFor="hc-email">
                      {t("email")}
                    </label>
                    <input
                      id="hc-email"
                      name="email"
                      type="email"
                      required
                      className={FIELD}
                      placeholder={t("emailPlaceholder")}
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL} htmlFor="hc-subject">
                    {t("subject")}
                  </label>
                  <input
                    id="hc-subject"
                    name="subject"
                    className={FIELD}
                    placeholder={t("subjectPlaceholder")}
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor="hc-message">
                    {t("message")}
                  </label>
                  <textarea
                    id="hc-message"
                    name="message"
                    required
                    rows={5}
                    className={`${FIELD} resize-y`}
                    placeholder={t("messagePlaceholder")}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Button type="submit" variant="primary" size="md" disabled={status === "submitting"}>
                    {status === "submitting" ? t("submitting") : t("submit")}
                  </Button>
                  {status === "error" && <p className="text-sm text-red-700">{t("error")}</p>}
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Campus map */}
        <div className="border-gray-300 mt-12 overflow-hidden rounded-[13px] border">
          <iframe
            src={mapSrc}
            title={t("mapTitle")}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-80 w-full border-0"
          />
        </div>
      </Container>
    </section>
  );
}
