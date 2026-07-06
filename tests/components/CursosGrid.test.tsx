// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { CursosGrid } from "@/components/marketing/CursosGrid";

describe("CursosGrid", () => {
  it("renders the Otros Profesionales card with a completion (no-CE) note and no ACPE block", () => {
    const { getByText, container } = render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <CursosGrid openCohorts={[]} />
      </NextIntlClientProvider>,
    );
    expect(getByText("Otros Profesionales")).toBeTruthy();
    expect(container.textContent).toContain("sin créditos CE de ACPE");
  });
});
