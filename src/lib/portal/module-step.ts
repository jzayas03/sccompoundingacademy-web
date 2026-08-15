/**
 * Where a student stands inside one module's three-step journey:
 *
 *   1. pre-prueba  → 2. presentación → 3. post-prueba
 *
 * `resolveModuleAccess` (module-access.ts) answers "may this person open
 * this page?" — a gate. This answers "what should this person do next?" —
 * a signpost. The dashboard uses it to label each card and to link
 * straight to the step the student is actually on, instead of always
 * pointing at the module page and letting a silent redirect decide.
 *
 * Both read the same recorded state, so they can't disagree: a `phase:
 * "pre"` row means the pre-test is done, a passing `phase: "post"` row
 * means the module is complete.
 *
 * Deliberately NOT tracked: whether the student actually read the
 * presentation. Nothing in the schema records that (the PDF viewer
 * persists nothing), so step 2 is a signpost rather than a gate — after
 * the pre-test the student is pointed at the presentation, and the
 * post-test stays reachable from it. Gating on "actually read it" would
 * need a new column and a viewer that reports progress.
 */
export type ModuleStep = "pre-test" | "module" | "post-test" | "completed";

export type ModuleStepInput = {
  /** The module has a non-empty question bank (`getQuiz(id).length > 0`). */
  hasQuiz: boolean;
  /** A `phase: "pre"` attempt exists for this user+module. */
  hasPreAttempt: boolean;
  /** A `phase: "post"` attempt exists (passing or not). */
  hasPostAttempt: boolean;
  /** A `phase: "post"` attempt with `passed = true` exists. */
  hasPassedPost: boolean;
};

export function resolveModuleStep(input: ModuleStepInput): ModuleStep {
  const { hasQuiz, hasPreAttempt, hasPostAttempt, hasPassedPost } = input;

  // A module with no question bank has no tests to sequence — the
  // presentation IS the module.
  if (!hasQuiz) return "module";

  // Passing the post-test closes the module, whatever else happened.
  if (hasPassedPost) return "completed";

  // Step 1 — the diagnostic baseline, before any content.
  if (!hasPreAttempt) return "pre-test";

  // Tried the post-test and did not pass → the next action is another
  // attempt, not re-reading from scratch (the presentation stays one
  // click away from the post-test screen).
  if (hasPostAttempt) return "post-test";

  // Step 2 — pre-test done, no graded attempt yet.
  return "module";
}

/** Route (relative to `/portal`) a student should land on for a step. */
export function stepPathname(
  step: ModuleStep,
): "/portal/modulos/[id]" | "/portal/modulos/[id]/pre-test" | "/portal/modulos/[id]/post-test" {
  if (step === "pre-test") return "/portal/modulos/[id]/pre-test";
  if (step === "post-test") return "/portal/modulos/[id]/post-test";
  // "module" and "completed" both open the presentation; a completed
  // module stays readable for review until the access window closes.
  return "/portal/modulos/[id]";
}

/** 1-based position in the 3-step journey, for the stepper UI. A module
 *  with no quiz has no journey to show (callers hide the stepper). */
export function stepOrdinal(step: ModuleStep): 1 | 2 | 3 {
  if (step === "pre-test") return 1;
  if (step === "module") return 2;
  return 3;
}
