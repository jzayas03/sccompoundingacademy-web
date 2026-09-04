// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { InscripcionForm } from "@/components/marketing/inscripcion/InscripcionForm";

const cohorts = [
  {
    id: "c1",
    courseId: "basic-compounding",
    label: "Cohorte",
    audience: "otros_profesionales" as const,
  },
];

describe("InscripcionForm preselectedProf", () => {
  it("opens the Otro profession branch when prof=otro", () => {
    const { getByText } = render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <InscripcionForm
          locale="es"
          preselectedTier="profesional"
          preselectedProf="otro"
          cohorts={cohorts}
          docsVersion="2026-01-01"
        />
      </NextIntlClientProvider>,
    );
    // The "otro" branch reveals the otraProfesion select label.
    expect(getByText(esMessages.inscripcion.fields.otraProfesion)).toBeTruthy();
  });
});

describe("InscripcionForm course select titles", () => {
  it("resolves the course title by card id even when cursosGrid.items is reordered", () => {
    // Simula el estado futuro: la tarjeta de basic-compounding NO está en el índice 0
    // (al añadir un segundo curso al catálogo, índice de COURSES ≠ índice de items).
    const reordered = structuredClone(esMessages);
    reordered.cursosGrid.items = [...reordered.cursosGrid.items].reverse() as never;
    const expectedTitle = esMessages.cursosGrid.items.find(
      (it) => it.id === "basic-compounding",
    )!.title;

    const { container } = render(
      <NextIntlClientProvider locale="es" messages={reordered}>
        <InscripcionForm
          locale="es"
          preselectedTier="profesional"
          cohorts={cohorts}
          docsVersion="2026-01-01"
        />
      </NextIntlClientProvider>,
    );

    const option = container.querySelector(
      'select[name="curso_id"] option[value="basic-compounding"]',
    );
    expect(option?.textContent).toBe(expectedTitle);
  });
});
