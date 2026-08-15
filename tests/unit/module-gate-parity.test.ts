// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Gate-parity guard for the three entry points that expose paid module
 * material or the credit-bearing test.
 *
 * The portal enforces its gates independently in each route — the page
 * redirects, the API returns a status — so a gate added to one is easy to
 * forget on the others. That has now bitten twice:
 *
 *   1. `/api/portal/modulo/[id]/pdf` served the material without the
 *      pre-test gate, so a paid student could read a later module by
 *      editing the id in the URL.
 *   2. `post-test/page.tsx` gated on payment alone — no pre-test, no
 *      matrícula verification, no access window — so the ACPE
 *      credit-bearing test was reachable by URL before the diagnostic
 *      pre-test had ever been taken.
 *
 * Both hurt the same thing: a "pre"-test taken after the module is not a
 * baseline, and the pre/post pair is what the ACPE report rests on.
 *
 * These are source-level assertions on purpose. They cannot prove the
 * gate *behaves*, which is what `module-access.test.ts` (the policy) and
 * `modulo-pdf-route.test.ts` (the route) do — they prove each entry point
 * still WIRES the shared policy in, which is exactly the regression that
 * slipped through twice.
 */
const SRC = join(process.cwd(), "src");

const read = (...segments: string[]): string =>
  readFileSync(join(SRC, ...segments), "utf8");

const PORTAL_MODULE = ["app", "[locale]", "(portal)", "portal", "modulos", "[id]"];

const gatedEntryPoints: ReadonlyArray<readonly [string, string]> = [
  ["module page", read(...PORTAL_MODULE, "page.tsx")],
  ["post-test page", read(...PORTAL_MODULE, "post-test", "page.tsx")],
  ["module PDF route", read("app", "api", "portal", "modulo", "[id]", "pdf", "route.ts")],
];

describe.each(gatedEntryPoints)("%s", (_name, source) => {
  it("runs the shared resolveModuleAccess policy (payment + pre-test)", () => {
    expect(source).toContain("resolveModuleAccess");
  });

  it("queries a phase:\"pre\" attempt to feed that policy", () => {
    expect(source).toContain('quizAttempts.phase, "pre"');
  });

  it("applies the student matrícula verification gate", () => {
    expect(source).toContain("resolveVerificationGate");
  });

  it("applies the 30-day course-access window", () => {
    expect(source).toContain("isCourseAccessActive");
  });
});

describe("post-test results screen", () => {
  const source = read(...PORTAL_MODULE, "post-test", "resultados", "page.tsx");

  it('filters the attempt lookup to phase:"post"', () => {
    // Without this the latest PRE-test attempt renders as post-test
    // results — pass/fail copy, score and all — for a student who has
    // only taken the diagnostic.
    expect(source).toContain('quizAttempts.phase, "post"');
  });
});
