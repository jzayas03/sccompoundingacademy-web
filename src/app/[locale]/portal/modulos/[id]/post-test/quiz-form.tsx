"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { SanitizedQuestion, ModuleQuizId } from "@/lib/quizzes";
import { submitQuizAction } from "./actions";

type QuizFormProps = {
  locale: "es" | "en";
  moduleId: ModuleQuizId;
  questions: readonly SanitizedQuestion[];
};

/**
 * One-question-at-a-time post-test form.
 *
 * State is local to the component — answers live in a `Record<id,
 * letter>` map, navigation is `current` index, submission is gated via
 * `useTransition` so the spinner stays in sync with the server action.
 *
 * Submit is disabled until every question has an answer. The server
 * action handles redirect on success; we re-throw to keep React happy
 * with the redirect "error" but surface anything else as inline
 * feedback rather than swallowing it.
 */
export function QuizForm({ locale, moduleId, questions }: QuizFormProps) {
  const t = useTranslations("portal.postTest");

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = questions.length;
  const question = questions[current]!;
  const isLast = current === total - 1;
  const allAnswered = useMemo(
    () => questions.every((q) => answers[q.id]),
    [questions, answers],
  );

  function selectOption(letter: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: letter }));
  }

  function goPrev() {
    setCurrent((idx) => Math.max(0, idx - 1));
  }

  function goNext() {
    setCurrent((idx) => Math.min(total - 1, idx + 1));
  }

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await submitQuizAction({ locale, moduleId, answers });
      } catch (err) {
        // Next.js redirect errors are intentional — let them bubble.
        // Anything else surfaces as inline error text.
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          throw err;
        }
        setError(t("submitDisabledHint"));
      }
    });
  }

  return (
    <div className="mt-10">
      {/* Progress meter */}
      <p className="font-heading text-teal-deep/80 text-xs font-semibold tracking-[0.18em] uppercase">
        {t("questionLabel", { current: current + 1, total })}
      </p>
      <div className="bg-gray-300 mt-2 h-1 w-full overflow-hidden rounded-full">
        <div
          className="bg-chartreuse h-full transition-all duration-300"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h2 className="font-heading text-teal-deep mt-6 text-xl font-semibold leading-snug sm:text-2xl">
        {question.prompt}
      </h2>

      {/* Options as radios (re-styled). One name per question id so
          unselecting happens automatically when the user picks a new
          letter. */}
      <fieldset className="mt-6 space-y-3">
        <legend className="sr-only">{question.prompt}</legend>
        {question.options.map((opt) => {
          const selected = answers[question.id] === opt.letter;
          return (
            <label
              key={opt.letter}
              className={`block cursor-pointer rounded-md border p-4 transition-colors ${
                selected
                  ? "border-teal-deep bg-teal-deep/5 ring-teal-deep/30 ring-2"
                  : "border-gray-300 bg-white hover:border-teal-deep/60"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={opt.letter}
                checked={selected}
                onChange={() => selectOption(opt.letter)}
                className="sr-only"
              />
              <span className="font-heading text-teal-deep mr-3 inline-block w-10 text-sm font-semibold tracking-wide uppercase">
                {opt.letter}
              </span>
              <span className="text-gray-900 text-sm leading-relaxed sm:text-base">
                {opt.text}
              </span>
            </label>
          );
        })}
      </fieldset>

      {/* Nav row */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={current === 0 || pending}
          className="border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-off-white font-heading inline-flex h-11 items-center justify-center rounded-md border px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← {t("previousButton")}
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!allAnswered || pending}
            className="bg-chartreuse text-teal-deep ring-teal-deep/15 shadow-soft hover:bg-chartreuse/95 hover:shadow-lift font-heading inline-flex h-12 items-center justify-center rounded-md px-6 text-sm font-semibold ring-1 transition-[color,background-color,box-shadow,transform] duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base motion-safe:hover:-translate-y-px"
          >
            {pending ? t("submittingButton") : t("submitButton")}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={pending}
            className="bg-teal-deep text-off-white hover:bg-teal font-heading inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("nextButton")} →
          </button>
        )}
      </div>

      {!allAnswered && isLast && (
        <p className="text-gray-700 mt-4 text-center text-xs italic">
          {t("submitDisabledHint")}
        </p>
      )}

      {error && (
        <p role="alert" className="text-red-700 mt-4 text-center text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
