// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { CursosGrid } from "@/components/marketing/CursosGrid";

const ceLabel = esMessages.cursosGrid.ceLabel;

describe("CursosGrid", () => {
  it("suppresses the ACPE CE block on the Otros Profesionales card, shows its no-CE note, and resolves its courseRef cohort date", () => {
    render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <CursosGrid
          openCohorts={[{ courseId: "basic-compounding", startDate: "2026-09-01" }]}
        />
      </NextIntlClientProvider>,
    );

    const otrosCard = screen.getByText("Otros Profesionales").closest("article");
    expect(otrosCard).not.toBeNull();
    const otrosScope = within(otrosCard as HTMLElement);

    // The no-CE completion note is present. (The card's description also
    // contains the phrase "sin créditos CE de ACPE", so anchor on wording
    // unique to the credentialNote block itself.)
    expect(
      otrosScope.getByText(/El crédito CE está reservado a farmacéuticos y técnicos/),
    ).toBeTruthy();

    // The ACPE CE block itself must NOT render on this card — this is what
    // pins the `!course.noCe` guard. Dropping that guard would make the CE
    // block render alongside the no-CE note, and this assertion would fail.
    expect(otrosCard?.textContent).not.toContain(ceLabel);

    // The card's courseRef ("basic-compounding") must resolve the cohort
    // date from `openCohorts`, proving the lookup follows courseRef rather
    // than the item's own id.
    expect(otrosCard?.textContent).toContain("2026");
    expect(otrosCard?.textContent).toContain("septiembre");

    // Sanity: the referenced basic-compounding (professional) card DOES
    // show the ACPE CE block — the suppression is specific to the otros
    // card, not a global regression.
    const basicCard = screen
      .getByText("Compounding No Estéril Básico — Farmacéuticos y Técnicos")
      .closest("article");
    expect(basicCard).not.toBeNull();
    expect(basicCard?.textContent).toContain(ceLabel);
  });
});
