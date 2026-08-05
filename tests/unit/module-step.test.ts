import { describe, expect, it } from "vitest";
import {
  resolveModuleStep,
  stepOrdinal,
  stepPathname,
  type ModuleStepInput,
} from "@/lib/portal/module-step";

/**
 * Contract for the three-step signpost (pre-prueba → presentación →
 * post-prueba). The dashboard labels every module card from this and
 * links straight to the returned step, so a wrong answer here sends a
 * student to the wrong page — or worse, tells them they finished a
 * module they did not.
 */
const fresh: ModuleStepInput = {
  hasQuiz: true,
  hasPreAttempt: false,
  hasPostAttempt: false,
  hasPassedPost: false,
};

describe("resolveModuleStep", () => {
  it("starts a fresh student at the pre-test", () => {
    expect(resolveModuleStep(fresh)).toBe("pre-test");
  });

  it("points to the presentation once the pre-test is recorded", () => {
    expect(resolveModuleStep({ ...fresh, hasPreAttempt: true })).toBe("module");
  });

  it("points to the post-test after a failed graded attempt (retry)", () => {
    expect(
      resolveModuleStep({
        ...fresh,
        hasPreAttempt: true,
        hasPostAttempt: true,
      }),
    ).toBe("post-test");
  });

  it("marks the module completed once a post-test is passed", () => {
    expect(
      resolveModuleStep({
        ...fresh,
        hasPreAttempt: true,
        hasPostAttempt: true,
        hasPassedPost: true,
      }),
    ).toBe("completed");
  });

  it("treats a module with no question bank as presentation-only", () => {
    expect(resolveModuleStep({ ...fresh, hasQuiz: false })).toBe("module");
  });

  it("keeps a passed module completed even with later failed retries", () => {
    // A student may retake a passed module; passing is not revoked.
    expect(
      resolveModuleStep({
        hasQuiz: true,
        hasPreAttempt: true,
        hasPostAttempt: true,
        hasPassedPost: true,
      }),
    ).toBe("completed");
  });

  it("never skips the pre-test, even if a post attempt somehow exists", () => {
    // Defensive: legacy rows from before the post-test was gated (#154)
    // can have a "post" attempt with no "pre". Those students are sent
    // back to the diagnostic rather than shown as further along.
    expect(
      resolveModuleStep({ ...fresh, hasPostAttempt: true }),
    ).toBe("pre-test");
  });
});

describe("stepPathname", () => {
  it("routes each step to its own page", () => {
    expect(stepPathname("pre-test")).toBe("/portal/modulos/[id]/pre-test");
    expect(stepPathname("post-test")).toBe("/portal/modulos/[id]/post-test");
  });

  it("opens the presentation for the module step and for review", () => {
    expect(stepPathname("module")).toBe("/portal/modulos/[id]");
    expect(stepPathname("completed")).toBe("/portal/modulos/[id]");
  });
});

describe("stepOrdinal", () => {
  it("numbers the journey 1-2-3", () => {
    expect(stepOrdinal("pre-test")).toBe(1);
    expect(stepOrdinal("module")).toBe(2);
    expect(stepOrdinal("post-test")).toBe(3);
    expect(stepOrdinal("completed")).toBe(3);
  });
});
