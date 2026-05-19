import { dia1 } from "./dia-1";
import { dia2 } from "./dia-2";
import { dia3 } from "./dia-3";
import type { ModuleQuizId, Question, SanitizedQuestion } from "./types";

export type { ModuleQuizId, Question, SanitizedQuestion } from "./types";

/**
 * Module-id ↔ question-bank lookup. Keep `Question[]` (with
 * `correctAnswer` + `explanation`) server-side only; pass the sanitized
 * version to client components.
 */
const QUIZZES: Record<ModuleQuizId, readonly Question[]> = {
  "modulo-1": dia1,
  "modulo-2": dia2,
  "modulo-3": dia3,
};

export function getQuiz(moduleId: ModuleQuizId): readonly Question[] {
  return QUIZZES[moduleId];
}

/**
 * Strip the authoritative fields (`correctAnswer`, `explanation`) so the
 * client side never receives the answer key. Called by every server
 * component before handing questions to a `"use client"` component.
 */
export function sanitizeQuiz(
  questions: readonly Question[],
): readonly SanitizedQuestion[] {
  return questions.map(({ id, prompt, type, options }) => ({
    id,
    prompt,
    type,
    options,
  }));
}

/**
 * Server-side scoring. Takes the student's answer map (id → selected
 * letter) and returns score + percentage + pass/fail. Comparison is
 * case-sensitive on the option letter as stored in the source data.
 */
export function scoreQuiz(
  questions: readonly Question[],
  answers: Record<string, string>,
  passingThreshold: number,
): {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
} {
  const total = questions.length;
  let score = 0;
  for (const q of questions) {
    const selected = answers[q.id];
    if (selected && selected === q.correctAnswer) score += 1;
  }
  const percentage = total > 0 ? score / total : 0;
  return {
    score,
    total,
    percentage,
    passed: percentage >= passingThreshold,
  };
}

export function getPassingThreshold(): number {
  const raw = process.env.QUIZ_PASSING_THRESHOLD;
  if (!raw) return 0.7;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return 0.7;
  return parsed;
}
