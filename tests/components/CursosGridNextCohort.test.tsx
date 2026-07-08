// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { CursosGrid } from "@/components/marketing/CursosGrid";

const openCohorts = [
  { courseId: "basic-compounding", startDate: "2026-08-12", audience: "farmaceutico_tecnico" as const },
  { courseId: "basic-compounding", startDate: "2026-08-19", audience: "estudiante" as const },
];

function card(title: string): HTMLElement {
  const el = screen.getByText(title).closest("article");
  if (!el) throw new Error(`card not found: ${title}`);
  return el;
}

describe("CursosGrid per-audience next cohort", () => {
  it("shows each card's own audience cohort + label", () => {
    render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <CursosGrid openCohorts={openCohorts} />
      </NextIntlClientProvider>,
    );

    const farm = card("Compounding No Estéril Básico — Farmacéuticos y Técnicos");
    expect(within(farm).getByText(/agosto/)).toBeTruthy();
    expect(farm.textContent).toContain("para Farmacéuticos y Técnicos");

    const student = card("Track de Estudiantes — Compounding No Estéril");
    expect(student.textContent).toContain("agosto");
    expect(student.textContent).toContain("para Estudiantes");

    // Otros Profesionales has no matching open cohort in the fixture →
    // no "Próxima cohorte" line at all.
    const otros = card("Otros Profesionales");
    expect(otros.textContent).not.toContain("Próxima cohorte");
    expect(otros.textContent).not.toContain("para Otros Profesionales");
  });
});
