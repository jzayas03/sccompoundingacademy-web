// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { CohortWaitlist, type CohortBlock } from "@/components/marketing/CohortWaitlist";

const blocks: CohortBlock[] = [
  { audience: "farmaceutico_tecnico", cohortLabel: "12–14 de agosto de 2026", total: 12, remaining: 5, featured: true },
  { audience: "estudiante", cohortLabel: "19–21 de agosto de 2026", total: 12, remaining: 0, featured: false },
];

function renderBand(bs: CohortBlock[]) {
  return render(
    <NextIntlClientProvider locale="es" messages={esMessages}>
      <CohortWaitlist blocks={bs} />
    </NextIntlClientProvider>,
  );
}

describe("CohortWaitlist per-audience blocks", () => {
  it("renders a labeled block per audience, featured first", () => {
    const { container } = renderBand(blocks);
    expect(screen.getByText("Próximas cohortes")).toBeTruthy();
    expect(container.textContent).toContain("Farmacéuticos y Técnicos");
    expect(container.textContent).toContain("Estudiantes");
    expect(container.textContent).toContain("12–14 de agosto de 2026");
    expect(container.textContent).toContain("19–21 de agosto de 2026");
    // featured (farmaceutico_tecnico) appears before estudiante
    expect(container.textContent!.indexOf("Farmacéuticos")).toBeLessThan(
      container.textContent!.indexOf("Estudiantes"),
    );
    // the waitlist form is still present
    expect(screen.getByText(esMessages.cohort.form.heading)).toBeTruthy();
  });
  it("falls back to the empty heading and renders no meter when there are no blocks", () => {
    const { container } = renderBand([]);
    expect(screen.getByText(esMessages.cohort.headingFallback)).toBeTruthy();
    expect(container.textContent).not.toContain("Próximas cohortes");
    expect(container.textContent).not.toContain("cupos en total"); // no seat meter labels
  });
});
