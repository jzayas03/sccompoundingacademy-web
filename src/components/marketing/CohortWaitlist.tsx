"use client";
import { useState } from "react";
import { useTranslations, useMessages, useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { AUDIENCE_LABELS, type CohortAudience } from "@/lib/cohorts/audience";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * CohortWaitlist — "Next cohort" scarcity + waitlist (§5 of the v2 handoff).
 *
 * Left: cohort heading (real cohort label) + a seat-scarcity meter driven
 * by live data (`total` = capacity, `remaining` = capacity − paid). Right:
 * a glass "Reserve your seat" form that posts to /api/waitlist (emails the
 * ops inbox — no payment). The meter is omitted when there is no open
 * cohort to count.
 */
export function CohortWaitlist({
  total,
  remaining,
  cohortLabel,
  audience,
}: {
  total: number | null;
  remaining: number | null;
  cohortLabel: string | null;
  audience: CohortAudience | null;
}) {
  const t = useTranslations("cohort");
  const messages = useMessages() as unknown as { cohort: { form: { roles: string[] } } };
  const roles = messages.cohort.form.roles;
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");

  const showMeter = typeof total === "number" && total > 0 && typeof remaining === "number";
  const filled = showMeter ? Math.max(0, total - remaining) : 0;

  const FIELD =
    "block w-full rounded-lg border px-3.5 py-2.5 text-sm text-off-white outline-none " +
    "placeholder:text-off-white/45 focus:border-chartreuse/60";
  const fieldStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.18)",
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          role: data.get("role"),
          cohort: cohortLabel ?? "",
          locale,
        }),
      });
      setStatus(res.ok ? "success" : "error");
      if (res.ok) form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="cohort" className="bg-teal-deep border-t border-white/10">
      <Container className="py-16 sm:py-20 lg:py-24">
        <Reveal className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-14">
          {/* Left — cohort info + scarcity */}
          <div>
            <p className="eyebrow" style={{ color: "rgba(230,234,130,0.85)" }}>
              <span className="eyebrow-bar" aria-hidden />
              {t("eyebrow")}
            </p>
            <h2 className="font-heading text-off-white mt-3.5 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              {cohortLabel ?? t("headingFallback")}
            </h2>
            {audience && (
              <p className="font-heading mt-2 text-sm font-semibold" style={{ color: "rgba(230,234,130,0.85)" }}>
                {t("audienceLine", { label: AUDIENCE_LABELS[audience][locale === "en" ? "en" : "es"] })}
              </p>
            )}
            <p className="text-off-white/80 mt-3.5 max-w-md text-[15px] leading-relaxed">
              {t("description")}
            </p>

            {showMeter && (
              <div className="mt-8 max-w-md">
                <div className="mb-2.5 flex items-baseline justify-between">
                  <span className="text-off-white/60 font-heading text-[0.72rem] font-semibold tracking-[0.1em] uppercase">
                    {t("seatsTotal", { total })}
                  </span>
                  <span className="text-chartreuse font-heading text-sm font-bold">
                    {t("remaining", { remaining })}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: total }).map((_, k) => (
                    <div
                      key={k}
                      className="h-2 flex-1 rounded-full"
                      style={{
                        background: k < filled ? "var(--color-chartreuse)" : "rgba(255,255,255,0.14)",
                      }}
                    />
                  ))}
                </div>
                <p className="text-off-white/50 mt-3.5 text-[12.5px]">{t("closesNote")}</p>
              </div>
            )}
          </div>

          {/* Right — waitlist form */}
          <div
            className="rounded-2xl border p-8 sm:p-9"
            style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }}
          >
            {status === "success" ? (
              <div className="py-6 text-center">
                <p className="font-heading text-chartreuse text-lg font-bold">{t("form.successTitle")}</p>
                <p className="text-off-white/75 mt-2.5 text-sm leading-relaxed">
                  {t("form.successBody")}
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
                <div>
                  <h3 className="font-heading text-off-white text-lg font-bold">{t("form.heading")}</h3>
                  <p className="text-off-white/60 text-[13px]">{t("form.subnote")}</p>
                </div>
                <input name="name" required placeholder={t("form.name")} className={FIELD} style={fieldStyle} />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder={t("form.email")}
                  className={FIELD}
                  style={fieldStyle}
                />
                <select
                  name="role"
                  required
                  defaultValue=""
                  className={`${FIELD} cursor-pointer appearance-none`}
                  style={fieldStyle}
                >
                  <option value="" disabled className="text-gray-900">
                    {t("form.rolePlaceholder")}
                  </option>
                  {roles.map((r) => (
                    <option key={r} value={r} className="text-gray-900">
                      {r}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="primary" size="md" disabled={status === "submitting"}>
                  {status === "submitting" ? t("form.submitting") : t("form.submit")}
                </Button>
                {status === "error" && (
                  <p className="text-[13px] text-red-300">{t("form.error")}</p>
                )}
              </form>
            )}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
