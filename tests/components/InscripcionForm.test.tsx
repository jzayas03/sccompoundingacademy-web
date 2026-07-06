// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { InscripcionForm } from "@/components/marketing/inscripcion/InscripcionForm";

const cohorts = [{ id: "c1", courseId: "basic-compounding", label: "Cohorte" }];

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
