// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// AdminChangeCohort imports the `changeCohort` server action from
// actions.ts, which (via existing, unrelated exports in that file) pulls in
// `@/lib/auth` (next-auth) and `@/lib/portal/apply-verification-decision`
// (which does `import "server-only"`). Neither resolves under Vite/vitest
// (next-auth's `next/server` import needs an explicit `.js` extension that
// Vite's resolver doesn't add; the `server-only` guard package is a Next.js
// build-time shim with no standalone module to resolve). Mirrors the
// existing mock pattern in tests/unit/cohort-action-audience.test.ts, which
// hits the same transitive chain for the same reason. Neither mock affects
// this test: none of the three cases here submit the form, so
// `changeCohort` itself never runs.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/portal/apply-verification-decision", () => ({
  applyVerificationDecision: vi.fn(),
}));

import { AdminChangeCohort } from "@/components/portal/AdminChangeCohort";

describe("AdminChangeCohort", () => {
  it("collapsed: shows the current label and a 'cambiar' button when options exist", () => {
    render(
      <AdminChangeCohort
        userId="u1"
        currentLabel="12–14 de agosto de 2026"
        options={[
          { id: "a", label: "19–21 de agosto de 2026", full: false, remaining: 5 },
        ]}
      />,
    );
    expect(screen.getByText("12–14 de agosto de 2026")).toBeTruthy();
    expect(screen.getByRole("button", { name: /cambiar/i })).toBeTruthy();
  });

  it("with no options: shows only the label, no 'cambiar' button", () => {
    render(
      <AdminChangeCohort userId="u1" currentLabel="12–14 de agosto de 2026" options={[]} />,
    );
    expect(screen.getByText("12–14 de agosto de 2026")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /cambiar/i })).toBeNull();
  });

  it("expanded: lists options (full flagged) and the force checkbox", async () => {
    const user = userEvent.setup();
    render(
      <AdminChangeCohort
        userId="u1"
        currentLabel="12–14 de agosto de 2026"
        options={[
          { id: "a", label: "19–21 de agosto de 2026", full: false, remaining: 5 },
          { id: "b", label: "26–28 de agosto de 2026", full: true, remaining: 0 },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /cambiar/i }));

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    const optionTexts = Array.from(select.options).map((o) => o.textContent);
    expect(optionTexts.some((t) => t?.includes("19–21 de agosto de 2026"))).toBe(true);
    expect(optionTexts.some((t) => t?.includes("llena"))).toBe(true);
    expect(screen.getByRole("checkbox", { name: /forzar/i })).toBeTruthy();
  });
});
