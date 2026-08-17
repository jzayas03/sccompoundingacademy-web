import { useTranslations } from "next-intl";
import type { ModuleStep } from "@/lib/portal/module-step";
import { stepOrdinal } from "@/lib/portal/module-step";

/**
 * The three-step signpost shown at the top of every module page:
 *
 *   1 Pre-prueba —— 2 Presentación —— 3 Post-prueba
 *
 * Purely informational: the gates live in `resolveModuleAccess`, this
 * only tells the student where they are and what is coming. Rendered on
 * the pre-test, module and post-test pages so the sequence is visible
 * from wherever the student enters.
 *
 * Steps before the current one read as done, the current one is
 * emphasized, later ones stay muted — status as weight and color, no
 * badges.
 */
export function ModuleStepper({ step }: { step: ModuleStep }) {
  const t = useTranslations("portal.stepper");
  const current = stepOrdinal(step);
  const allDone = step === "completed";

  const labels = [t("preTest"), t("presentation"), t("postTest")];

  return (
    <nav aria-label={t("ariaLabel")} className="mt-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {labels.map((label, i) => {
          const n = i + 1;
          const done = allDone || n < current;
          const isCurrent = !allDone && n === current;

          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={
                  isCurrent
                    ? "text-teal-deep font-semibold"
                    : done
                      ? "text-teal-deep/70"
                      : "text-gray-500"
                }
                aria-current={isCurrent ? "step" : undefined}
              >
                <span className="tabular-nums">{n}.</span> {label}
                {done && (
                  <span className="sr-only"> — {t("doneSuffix")}</span>
                )}
              </span>
              {n < labels.length && (
                <span aria-hidden className="text-gray-400">
                  ·
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
