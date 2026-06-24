import { describe, it, expect } from "vitest";
import { usp795 } from "@/lib/quizzes/usp-795";
import { usp800 } from "@/lib/quizzes/usp-800";
import type { Question } from "@/lib/quizzes/types";

/**
 * Data-integrity guard for the student question banks. These banks feed
 * both the pre-test and the post-test (and the post-test gates the
 * certificate), so a malformed bank — a correct answer that isn't an
 * option, a duplicate id, an empty prompt — would silently break scoring
 * or let a question render with no right answer. This catches that at CI
 * time rather than in front of a student.
 */
const banks: ReadonlyArray<readonly [string, readonly Question[]]> = [
  ["usp-795", usp795],
  ["usp-800", usp800],
];

describe.each(banks)("quiz bank %s", (_name, bank) => {
  it("has exactly 15 questions", () => {
    expect(bank).toHaveLength(15);
  });

  it("has unique question ids", () => {
    const ids = bank.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every question's correctAnswer is one of its options", () => {
    for (const q of bank) {
      const letters = q.options.map((o) => o.letter);
      expect(letters, q.id).toContain(q.correctAnswer);
    }
  });

  it("every question has at least 3 options and no duplicate option letters", () => {
    for (const q of bank) {
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
      const letters = q.options.map((o) => o.letter);
      expect(new Set(letters).size, q.id).toBe(letters.length);
    }
  });

  it("every question has a non-empty prompt, option texts, and explanation", () => {
    for (const q of bank) {
      expect(q.prompt.trim(), q.id).not.toBe("");
      expect(q.explanation.trim(), q.id).not.toBe("");
      for (const o of q.options) {
        expect(o.text.trim(), `${q.id}/${o.letter}`).not.toBe("");
      }
    }
  });
});
