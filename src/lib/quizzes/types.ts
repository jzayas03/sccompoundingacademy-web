/**
 * Quiz / post-test domain types — server-only.
 *
 * `Question` carries the authoritative `correctAnswer` + `explanation`
 * fields, which **must not** be sent to the client (a determined student
 * could inspect the network response and cheat). The data sanitizer
 * (`getSanitizedQuiz` in `./index.ts`) strips those fields before any
 * server component passes the questions to a client component.
 *
 * The shape supports two question types:
 *
 *   - `multiple-choice` — A-E options, `correctAnswer` is the letter
 *     string (`"A"`, `"B"`, ...).
 *   - `true-false`      — only two options, `correctAnswer` is the
 *     literal string `"TRUE"` or `"FALSE"` (matches the existing answer-
 *     key spelling in the owner's PDFs).
 */

export type OptionLetter = "A" | "B" | "C" | "D" | "E" | "TRUE" | "FALSE";

export type QuestionOption = {
  letter: OptionLetter;
  text: string;
};

export type Question = {
  /** Stable identifier, e.g. "M1-Q7". Used as the answer-map key in
   *  QuizAttempt.answers and as the React list key. */
  id: string;
  prompt: string;
  type: "multiple-choice" | "true-false";
  options: readonly QuestionOption[];
  correctAnswer: OptionLetter;
  /** 1–3 sentence rationale shown on the results screen when the
   *  student toggles "show explanations". Empty string acceptable while
   *  the owner is still writing them — the UI hides the toggle when
   *  every explanation in the quiz is empty. */
  explanation: string;
};

/** Client-safe projection of `Question` (no `correctAnswer`, no
 *  `explanation`). Server components must pass *only* this shape into
 *  the interactive quiz form. */
export type SanitizedQuestion = Omit<Question, "correctAnswer" | "explanation">;

export type ModuleQuizId =
  | "modulo-1"
  | "modulo-2"
  | "modulo-3"
  | "usp-795"
  | "usp-800";
