// @vitest-environment jsdom
/**
 * Registro liviano (spec 2026-09-04): el formulario solo ofrece los tiers
 * cuyo Stripe Price env existe — la página server-side computa
 * `enabledTiers` y el form filtra el selector. Mientras el precio de
 * subgraduados no esté definido, su botón NO se renderiza.
 */
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
    audience: "farmaceutico_tecnico" as const,
  },
];

function renderForm(enabledTiers: Record<string, ("profesional" | "student" | "subgraduado")[]>) {
  return render(
    <NextIntlClientProvider locale="es" messages={esMessages}>
      <InscripcionForm
        locale="es"
        cohorts={cohorts}
        docsVersion="2026-01-01"
        enabledTiers={enabledTiers}
      />
    </NextIntlClientProvider>,
  );
}

describe("InscripcionForm — tiers habilitados por env", () => {
  it("sin env de subgraduado → su botón no se ofrece", () => {
    const { queryByText, getByText } = renderForm({
      "basic-compounding": ["profesional", "student"],
    });
    expect(getByText(esMessages.inscripcion.tiers.profesional.label)).toBeTruthy();
    expect(queryByText(esMessages.inscripcion.tiers.subgraduado.label)).toBeNull();
  });

  it("con env de subgraduado → su botón se ofrece con el label i18n", () => {
    const { getByText } = renderForm({
      "basic-compounding": ["profesional", "student", "subgraduado"],
    });
    expect(getByText(esMessages.inscripcion.tiers.subgraduado.label)).toBeTruthy();
  });
});
