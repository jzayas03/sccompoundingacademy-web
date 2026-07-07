// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { CohortWaitlist } from "@/components/marketing/CohortWaitlist";

function renderBand(audience: "farmaceutico_tecnico" | "otros_profesionales" | "estudiante" | null) {
  return render(
    <NextIntlClientProvider locale="es" messages={esMessages}>
      <CohortWaitlist total={12} remaining={5} cohortLabel="12–14 de agosto de 2026" audience={audience} />
    </NextIntlClientProvider>,
  );
}

describe("CohortWaitlist audience label", () => {
  it("shows the student audience line", () => {
    renderBand("estudiante");
    expect(screen.getByText("Para Estudiantes")).toBeTruthy();
  });
  it("shows the pharmacist/tech audience line", () => {
    renderBand("farmaceutico_tecnico");
    expect(screen.getByText("Para Farmacéuticos y Técnicos")).toBeTruthy();
  });
  it("shows no audience line when audience is null", () => {
    const { container } = renderBand(null);
    expect(container.textContent).not.toContain("Para ");
  });
});
