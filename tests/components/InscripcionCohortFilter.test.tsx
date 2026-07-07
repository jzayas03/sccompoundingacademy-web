// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { InscripcionForm } from "@/components/marketing/inscripcion/InscripcionForm";

const cohorts = [
  { id: "pro", courseId: "basic-compounding", label: "Cohorte PRO", audience: "farmaceutico_tecnico" as const },
  { id: "stu", courseId: "basic-compounding", label: "Cohorte EST", audience: "estudiante" as const },
];

function renderForm(tier: "profesional" | "student", prof?: "farmaceutico" | "otro") {
  return render(
    <NextIntlClientProvider locale="es" messages={esMessages}>
      <InscripcionForm
        locale="es"
        preselectedTier={tier}
        preselectedProf={prof}
        cohorts={cohorts}
        docsVersion="2026-01-01"
      />
    </NextIntlClientProvider>,
  );
}

describe("cohort dropdown filters by audience", () => {
  it("student tier lists only the estudiante cohort", () => {
    renderForm("student");
    expect(screen.queryByRole("option", { name: "Cohorte EST" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Cohorte PRO" })).toBeNull();
  });
  it("profesional + otro sees no cohort (only a farmaceutico_tecnico one exists)", () => {
    // An 'otro' professional's audience is otros_profesionales; the fixture has
    // no cohort for it, so neither the PRO (farm/téc) nor EST option shows.
    renderForm("profesional", "otro");
    expect(screen.queryByRole("option", { name: "Cohorte PRO" })).toBeNull();
    expect(screen.queryByRole("option", { name: "Cohorte EST" })).toBeNull();
  });
  it("profesional + farmaceutico lists the farmaceutico_tecnico cohort", () => {
    renderForm("profesional", "farmaceutico");
    expect(screen.queryByRole("option", { name: "Cohorte PRO" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Cohorte EST" })).toBeNull();
  });

  it("submits the audience-corrected cohort, not the stale mount-time guess", async () => {
    // Fixture order is [pro, stu] — the mount-time initial guess for
    // `cohorteId` (InscripcionForm.tsx ~line 77-79) is unfiltered by
    // audience: it just picks the FIRST cohort for the course, "pro". This
    // component renders with tier="profesional" + prof="farmaceutico", whose
    // only visible audience is "farmaceutico_tecnico" — so "pro" is actually
    // the *correct* cohort here and would mask the bug. Flip the fixture
    // order for this test instead: put the "estudiante" cohort first, so a
    // profesional/farmaceutico render's stale mount-time guess would be
    // "stu" (wrong audience) unless the render-time reset validates it.
    //
    // NOTE on why this asserts the submitted network payload rather than the
    // rendered <select>'s DOM .value: when React sets a controlled `value`
    // that doesn't match any <option>, the browser (and jsdom) falls back to
    // auto-selecting the first available <option> — which happens to be the
    // SAME id the correct reset would have picked. That means sel.value
    // reads correctly even when the underlying `cohorteId` React state (what
    // onSubmit actually reads and POSTs) is still wrong. Verified empirically
    // while writing this test: with the bug reverted, `cohorteId` stayed
    // "stu" internally, but `select.value` still reported "pro" — passing a
    // DOM-only assertion despite the state bug. Only the actual submitted
    // payload proves the fix.
    const mismatchedOrderCohorts = [
      { id: "stu", courseId: "basic-compounding", label: "Cohorte EST", audience: "estudiante" as const },
      { id: "pro", courseId: "basic-compounding", label: "Cohorte PRO", audience: "farmaceutico_tecnico" as const },
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://checkout.stripe.com/test-session" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const assignMock = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, assign: assignMock },
    });

    const { container } = render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <InscripcionForm
          locale="es"
          preselectedTier="profesional"
          preselectedProf="farmaceutico"
          cohorts={mismatchedOrderCohorts}
          docsVersion="2026-01-01"
        />
      </NextIntlClientProvider>,
    );

    const form = container.querySelector("form") as HTMLFormElement;
    // Submit without ever touching the cohort <select> — this is the "lands
    // and submits" path the bug report describes.
    fireEvent.submit(form);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { cohorte_id: string };
    expect(body.cohorte_id).toBe("pro");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
    vi.unstubAllGlobals();
  });
});
