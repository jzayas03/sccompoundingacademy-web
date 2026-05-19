"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Question } from "@/lib/quizzes";

type ResultsListProps = {
  questions: readonly Question[];
  answers: Record<string, string>;
};

/**
 * Per-question results list with a "show correct answers" toggle.
 *
 * Receives the authoritative questions (including `correctAnswer` +
 * `explanation`) — safe here because the student has already submitted
 * and we are showing them the answer key, not running a new attempt.
 *
 * When `revealed` is true each card surfaces both the student's
 * selection and the correct answer side-by-side, plus the explanation
 * if the owner has populated one for that question.
 */
export function ResultsList({ questions, answers }: ResultsListProps) {
  const t = useTranslations("portal.postTestResults");
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        aria-pressed={revealed}
        className="border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-off-white font-heading inline-flex h-10 items-center rounded-md border px-4 text-sm font-semibold transition-colors"
      >
        {revealed ? t("hideExplanationsToggle") : t("showExplanationsToggle")}
      </button>

      <ul className="mt-6 space-y-4">
        {questions.map((q, idx) => {
          const selected = answers[q.id];
          const isCorrect = selected === q.correctAnswer;
          const selectedOption = q.options.find((o) => o.letter === selected);
          const correctOption = q.options.find((o) => o.letter === q.correctAnswer);
          return (
            <li
              key={q.id}
              className={`border-gray-300 rounded-md border bg-white p-5 ${
                isCorrect ? "" : "border-l-4 border-l-teal-deep"
              }`}
            >
              <p className="font-heading text-teal-deep/80 text-xs font-semibold tracking-wide uppercase">
                {idx + 1}. {q.id}
              </p>
              <p className="font-heading text-gray-900 mt-2 text-base font-semibold leading-snug">
                {q.prompt}
              </p>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex flex-wrap items-baseline gap-2">
                  <dt className="font-heading text-gray-700 text-xs font-medium tracking-wide uppercase">
                    {t("yourAnswerLabel")}:
                  </dt>
                  <dd
                    className={`font-heading font-semibold ${
                      isCorrect ? "text-teal-deep" : "text-gray-900"
                    }`}
                  >
                    {selectedOption
                      ? `${selectedOption.letter} — ${selectedOption.text}`
                      : t("noAnswerSelected")}
                  </dd>
                </div>

                {revealed && (
                  <>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <dt className="font-heading text-gray-700 text-xs font-medium tracking-wide uppercase">
                        {t("correctAnswerLabel")}:
                      </dt>
                      <dd className="font-heading text-teal-deep font-semibold">
                        {correctOption
                          ? `${correctOption.letter} — ${correctOption.text}`
                          : q.correctAnswer}
                      </dd>
                    </div>
                    {q.explanation && (
                      <p className="text-gray-700 mt-2 text-sm leading-relaxed">
                        {q.explanation}
                      </p>
                    )}
                  </>
                )}
              </dl>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
