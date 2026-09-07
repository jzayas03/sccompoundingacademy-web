// @vitest-environment jsdom
/**
 * Selector de curso simplificado (2026-09-07): el menú de curso solo lista
 * cursos con tarifa ofrecida para el tipo de inscripción activo, se fija
 * como texto (con "Cambiar curso") cuando se llega desde una tarjeta con
 * ?course=, y desaparece como menú cuando solo queda un curso elegible —
 * así un estudiante no puede terminar en el checkout profesional de Parte 2.
 */
import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { InscripcionForm } from "@/components/marketing/inscripcion/InscripcionForm";

const BASIC_TITLE = "Compounding No Estéril Básico — Farmacéuticos y Técnicos";
const PARTE2_TITLE = "Compounding No Estéril Avanzado — Parte 2";

const cohorts = [
  {
    id: "c1",
    courseId: "basic-compounding",
    label: "Cohorte básico",
    audience: "farmaceutico_tecnico" as const,
  },
  {
    id: "c2",
    courseId: "parte-2",
    label: "Cohorte parte 2",
    audience: "farmaceutico_tecnico" as const,
  },
];

const BOTH_ENABLED = {
  "basic-compounding": ["profesional", "student"] as ("profesional" | "student")[],
  "parte-2": ["profesional"] as "profesional"[],
};

function renderForm(props: Partial<Parameters<typeof InscripcionForm>[0]> = {}) {
  return render(
    <NextIntlClientProvider locale="es" messages={esMessages}>
      <InscripcionForm
        locale="es"
        cohorts={cohorts}
        docsVersion="2026-01-01"
        enabledTiers={BOTH_ENABLED}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

function cursoSelect(container: HTMLElement) {
  return container.querySelector('select[name="curso_id"]');
}

describe("InscripcionForm — selector de curso simplificado", () => {
  it("tier profesional sin preselección → menú con los dos cursos elegibles", () => {
    const { container } = renderForm();
    const select = cursoSelect(container);
    expect(select).toBeTruthy();
    const labels = Array.from(select!.querySelectorAll("option")).map((o) => o.textContent);
    expect(labels).toContain(BASIC_TITLE);
    expect(labels).toContain(PARTE2_TITLE);
  });

  it("tier estudiante → Parte 2 no es elegible y el curso queda como texto fijo", () => {
    const { container, queryByText } = renderForm({ preselectedTier: "student" });
    expect(cursoSelect(container)).toBeNull();
    expect(queryByText(BASIC_TITLE)).toBeTruthy();
    expect(queryByText(PARTE2_TITLE)).toBeNull();
  });

  it("llegada desde tarjeta (?course=parte-2) → curso fijo con 'Cambiar curso'", () => {
    const { container, getByText } = renderForm({
      preselectedCourseId: "parte-2",
    });
    expect(cursoSelect(container)).toBeNull();
    expect(getByText(PARTE2_TITLE)).toBeTruthy();
    expect(getByText(esMessages.inscripcion.fields.cambiarCurso)).toBeTruthy();
  });

  it("'Cambiar curso' reabre el menú con los cursos elegibles", () => {
    const { container, getByText } = renderForm({
      preselectedCourseId: "parte-2",
    });
    fireEvent.click(getByText(esMessages.inscripcion.fields.cambiarCurso));
    const select = cursoSelect(container);
    expect(select).toBeTruthy();
    expect(select!.querySelectorAll("option").length).toBe(2);
  });
});
