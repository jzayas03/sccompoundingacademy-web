// @vitest-environment jsdom
/**
 * Tarjetas públicas del registro liviano en /cursos (spec 2026-09-04 §6):
 * "Parte 2" y "Estudiantes Subgraduados" se renderizan SOLO cuando su
 * Stripe Price env existe (isPricingOffered) — sin env, el CTA aterrizaría
 * en un formulario que resetea al tier profesional de precio completo.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { CursosGrid } from "@/components/marketing/CursosGrid";

const PARTE2_ENV = "STRIPE_PRICE_ID_PARTE2_PROFESIONAL";
const SUBGRADUADO_ENV = "STRIPE_PRICE_ID_BASICO_SUBGRADUADO";

function renderGrid() {
  return render(
    <NextIntlClientProvider locale="es" messages={esMessages}>
      <CursosGrid openCohorts={[]} />
    </NextIntlClientProvider>,
  );
}

describe("CursosGrid — tarjetas de registro liviano", () => {
  beforeEach(() => {
    delete process.env[PARTE2_ENV];
    delete process.env[SUBGRADUADO_ENV];
  });
  afterEach(() => {
    delete process.env[PARTE2_ENV];
    delete process.env[SUBGRADUADO_ENV];
  });

  it("sin envs → las tarjetas nuevas NO aparecen; las existentes sí", () => {
    const { queryByText, getByText } = renderGrid();
    expect(queryByText("Compounding No Estéril Avanzado — Parte 2")).toBeNull();
    expect(queryByText("Estudiantes Subgraduados")).toBeNull();
    expect(getByText("Otros Profesionales")).toBeTruthy();
  });

  it("con envs → ambas tarjetas aparecen con su nota de credencial no-CE", () => {
    process.env[PARTE2_ENV] = "price_x";
    process.env[SUBGRADUADO_ENV] = "price_y";

    const { getByText, container } = renderGrid();
    expect(getByText("Compounding No Estéril Avanzado — Parte 2")).toBeTruthy();
    expect(getByText("Estudiantes Subgraduados")).toBeTruthy();

    // Ambas son no-CE: ninguna tarjeta nueva puede pintar el bloque ACPE.
    const parte2Card = getByText("Compounding No Estéril Avanzado — Parte 2").closest("article");
    expect(parte2Card?.textContent).toContain("sin créditos CE");

    // La convención del sitio: sin montos en dólares en tarjetas.
    expect(container.textContent).not.toMatch(/\$\s?\d/);
  });
});
