// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
