"use client";

import { useActionState, useState } from "react";
import { useTranslations, useMessages } from "next-intl";
import { getModuleCatalogue, type UserTier } from "@/lib/curriculum";
import { submitReviewAction, type ReviewState } from "./actions";

/**
 * Review form — interactive client component.
 *
 * Star ratings are radio groups disguised as buttons so screen readers
 * see them as a single-choice question per dimension. State lives in
 * React refs/useState; the server action enforces the same validation
 * server-side (defense in depth).
 *
 * `useActionState` keeps the server-action error state synced into the
 * form without manual fetch wiring — pending state disables the
 * submit button automatically.
 */
export function ReviewForm({ tier }: { tier: UserTier }) {
  const t = useTranslations("portal.reviews");
  const modules = getModuleCatalogue(useMessages(), tier);

  const [state, action, pending] = useActionState<ReviewState, FormData>(
    submitReviewAction,
    null,
  );

  const [overall, setOverall] = useState<number>(0);
  const [ratings, setRatings] = useState<number[]>(() => modules.map(() => 0));

  const canSubmit = overall > 0 && ratings.length > 0 && ratings.every((r) => r > 0);
  const showError = state?.error === "missing-rating" || state?.error === "send-failed";

  return (
    <form action={action} className="mt-8 space-y-8">
      {/* Overall rating */}
      <fieldset>
        <legend className="font-heading text-teal-deep text-sm font-semibold tracking-wide">
          {t("overallRatingLabel")}
        </legend>
        <StarRow
          name="overallRating"
          value={overall}
          onChange={setOverall}
          ariaLabelTemplate={(stars) => t("starAria", { stars })}
        />
      </fieldset>

      {/* Per-module ratings */}
      <fieldset>
        <legend className="font-heading text-teal-deep text-sm font-semibold tracking-wide">
          {t("moduleRatingsLabel")}
        </legend>
        <p className="text-gray-700 text-xs italic">{t("moduleRatingHint")}</p>
        <div className="mt-4 space-y-4">
          {modules.map((mod, idx) => (
            <div
              key={mod.id}
              className="border-gray-300 flex flex-col gap-2 rounded-md border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-heading text-teal-deep/80 text-xs font-semibold tracking-wide uppercase">
                  {mod.day}
                </p>
                <p className="font-heading text-gray-900 mt-1 text-sm font-semibold leading-snug">
                  {mod.title}
                </p>
              </div>
              <StarRow
                name={`m${idx + 1}Rating`}
                value={ratings[idx] ?? 0}
                onChange={(star) =>
                  setRatings((prev) => prev.map((r, j) => (j === idx ? star : r)))
                }
                ariaLabelTemplate={(stars) =>
                  t("moduleStarAria", { stars, module: mod.day })
                }
              />
            </div>
          ))}
        </div>
      </fieldset>

      {/* Open comments */}
      <label className="block">
        <span className="font-heading text-teal-deep block text-sm font-semibold tracking-wide">
          {t("bestLabel")}{" "}
          <span className="text-gray-700 text-xs font-normal normal-case italic">
            ({t("optional")})
          </span>
        </span>
        <textarea
          name="bestComment"
          rows={3}
          maxLength={2000}
          placeholder={t("bestPlaceholder")}
          className="border-gray-300 focus-visible:border-teal-deep focus-visible:ring-teal-deep/20 mt-1.5 block w-full rounded-md border bg-white px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-700/60 focus-visible:outline-none focus-visible:ring-4"
        />
      </label>

      <label className="block">
        <span className="font-heading text-teal-deep block text-sm font-semibold tracking-wide">
          {t("improveLabel")}{" "}
          <span className="text-gray-700 text-xs font-normal normal-case italic">
            ({t("optional")})
          </span>
        </span>
        <textarea
          name="improveComment"
          rows={3}
          maxLength={2000}
          placeholder={t("improvePlaceholder")}
          className="border-gray-300 focus-visible:border-teal-deep focus-visible:ring-teal-deep/20 mt-1.5 block w-full rounded-md border bg-white px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-700/60 focus-visible:outline-none focus-visible:ring-4"
        />
      </label>

      {/* Public consent */}
      <label className="border-gray-300 flex items-start gap-3 rounded-md border bg-white p-4 text-sm leading-relaxed text-gray-900">
        <input
          type="checkbox"
          name="publicConsent"
          className="accent-teal-deep mt-1 h-4 w-4 shrink-0"
        />
        <span>{t("consentLabel")}</span>
      </label>

      {/* Submit */}
      <div className="border-gray-300 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="submit"
          disabled={!canSubmit || pending}
          className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift focus-visible:ring-chartreuse font-heading inline-flex h-12 items-center justify-center rounded-md px-6 text-sm font-semibold ring-1 transition-[color,background-color,box-shadow,transform] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 sm:text-base motion-safe:hover:-translate-y-px"
        >
          {pending ? t("submitting") : t("submitButton")}
        </button>
      </div>

      {showError && (
        <p role="alert" className="text-red-700 mt-2 text-center text-sm">
          {t("submitError")}
        </p>
      )}
    </form>
  );
}

function StarRow({
  name,
  value,
  onChange,
  ariaLabelTemplate,
}: {
  name: string;
  value: number;
  onChange: (n: number) => void;
  ariaLabelTemplate: (stars: number) => string;
}) {
  return (
    <div className="mt-3 flex items-center gap-1">
      {/* Hidden numeric input feeds the server action via FormData. */}
      <input type="hidden" name={name} value={value || ""} />
      {[1, 2, 3, 4, 5].map((star) => {
        const active = value >= star;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={ariaLabelTemplate(star)}
            aria-pressed={active}
            className={`focus-visible:ring-chartreuse rounded p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none ${
              active ? "text-chartreuse" : "text-gray-300 hover:text-teal-deep/40"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
              <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
