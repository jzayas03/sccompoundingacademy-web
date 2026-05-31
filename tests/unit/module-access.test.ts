import { describe, it, expect } from "vitest";
import {
  resolveModuleAccess,
  type ModuleAccessInput,
} from "@/lib/portal/module-access";

/**
 * Regression contract for the per-module access gate
 * (`/[locale]/portal/modulos/[id]`).
 *
 * The behavior under test, stated by the academy: a paid student must
 * take the module's pre-test (same question bank as the final test)
 * before the module content unlocks, and owners preview everything
 * without paying or testing. These cases lock that in so a future change
 * can't silently drop the pre-test gate.
 */
const base: ModuleAccessInput = {
  isOwner: false,
  hasPaid: true,
  hasQuiz: true,
  hasPreAttempt: true,
};

describe("resolveModuleAccess", () => {
  it("forces a paid student to the pre-test before the module unlocks", () => {
    expect(
      resolveModuleAccess({ ...base, hasPreAttempt: false }),
    ).toEqual({ kind: "redirect", to: "pre-test" });
  });

  it("allows a paid student who has already taken the pre-test", () => {
    expect(resolveModuleAccess({ ...base, hasPreAttempt: true })).toEqual({
      kind: "allow",
    });
  });

  it("sends an unpaid student to the dashboard payment CTA", () => {
    expect(
      resolveModuleAccess({ ...base, hasPaid: false, hasPreAttempt: false }),
    ).toEqual({ kind: "redirect", to: "dashboard" });
  });

  it("checks payment before the pre-test (unpaid + no pre-test → dashboard, not pre-test)", () => {
    // An unpaid student should never be routed to a module's pre-test —
    // they have to pay first.
    expect(
      resolveModuleAccess({
        isOwner: false,
        hasPaid: false,
        hasQuiz: true,
        hasPreAttempt: false,
      }),
    ).toEqual({ kind: "redirect", to: "dashboard" });
  });

  it("does not gate on a pre-test for a module with no quiz bank", () => {
    expect(
      resolveModuleAccess({
        isOwner: false,
        hasPaid: true,
        hasQuiz: false,
        hasPreAttempt: false,
      }),
    ).toEqual({ kind: "allow" });
  });

  describe("owner / admin bypass", () => {
    it("always allows an owner, even unpaid and with no pre-test attempt", () => {
      expect(
        resolveModuleAccess({
          isOwner: true,
          hasPaid: false,
          hasQuiz: true,
          hasPreAttempt: false,
        }),
      ).toEqual({ kind: "allow" });
    });

    it("allows an owner regardless of any other flag combination", () => {
      for (const hasPaid of [true, false]) {
        for (const hasQuiz of [true, false]) {
          for (const hasPreAttempt of [true, false]) {
            expect(
              resolveModuleAccess({
                isOwner: true,
                hasPaid,
                hasQuiz,
                hasPreAttempt,
              }),
            ).toEqual({ kind: "allow" });
          }
        }
      }
    });
  });
});
