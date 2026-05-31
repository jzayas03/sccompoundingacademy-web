/**
 * Pure access-policy for the per-module workspace
 * (`/[locale]/portal/modulos/[id]`).
 *
 * The page component owns the I/O — `auth()`, the `users` row, the
 * `quizAttempts` lookup — but the *decision* of whether a given visitor
 * may see the module content (or must be bounced to the payment CTA or
 * the module's pre-test first) is encoded here so it can be unit-tested
 * exhaustively without a database or a running server.
 *
 * The contract, in plain terms:
 *   1. Owners (ADMIN_EMAILS) bypass every gate — they preview content
 *      without paying or taking the pre-test. See src/lib/admin.ts.
 *   2. A non-owner who has not paid is sent to the dashboard, which
 *      surfaces the payment CTA.
 *   3. A paid non-owner must complete the module's pre-test before the
 *      content unlocks — UNLESS the module has no quiz bank at all, in
 *      which case there is nothing to gate on.
 *   4. Everyone else is allowed in.
 *
 * The pre-test the student takes here is the *same* question bank as the
 * module's final/post-test (both read `getQuiz(moduleId)`), so passing
 * this gate is what "take the pre-test before starting the module"
 * means in practice.
 */
export type ModuleAccessInput = {
  /** Email is on the ADMIN_EMAILS allowlist. */
  isOwner: boolean;
  /** `users.paidAt` is set. */
  hasPaid: boolean;
  /** The module has a non-empty question bank (`getQuiz(id).length > 0`). */
  hasQuiz: boolean;
  /** A `phase: "pre"` quiz attempt already exists for this user+module. */
  hasPreAttempt: boolean;
};

export type ModuleAccessDecision =
  | { kind: "redirect"; to: "dashboard" | "pre-test" }
  | { kind: "allow" };

export function resolveModuleAccess(
  input: ModuleAccessInput,
): ModuleAccessDecision {
  const { isOwner, hasPaid, hasQuiz, hasPreAttempt } = input;

  // (1) Owner bypass — content preview, no payment or pre-test required.
  if (isOwner) return { kind: "allow" };

  // (2) Payment gate.
  if (!hasPaid) return { kind: "redirect", to: "dashboard" };

  // (3) Pre-test gate — only when the module actually has a quiz.
  if (hasQuiz && !hasPreAttempt) return { kind: "redirect", to: "pre-test" };

  // (4) Cleared every gate.
  return { kind: "allow" };
}
