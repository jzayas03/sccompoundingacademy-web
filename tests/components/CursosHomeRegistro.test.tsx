// @vitest-environment jsdom
/**
 * Portada — tarjetas del registro liviano (spec 2026-09-04 §6, decisión del
 * founder: las tarjetas nuevas van también en la portada). Mismo gating por
 * env que /cursos: sin Stripe Price env, la tarjeta no se ofrece.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { CursosHome } from "@/components/marketing/CursosHome";

const PARTE2_ENV = "STRIPE_PRICE_ID_PARTE2_PROFESIONAL";
const SUBGRADUADO_ENV = "STRIPE_PRICE_ID_BASICO_SUBGRADUADO";

function renderHome() {
  return render(
    <NextIntlClientProvider locale="es" messages={esMessages}>
      <CursosHome />
    </NextIntlClientProvider>,
  );
}

describe("CursosHome — tarjetas de registro liviano", () => {
  beforeEach(() => {
    delete process.env[PARTE2_ENV];
    delete process.env[SUBGRADUADO_ENV];
  });
  afterEach(() => {
    delete process.env[PARTE2_ENV];
    delete process.env[SUBGRADUADO_ENV];
  });

  it("sin envs → solo los tres tracks existentes", () => {
    const { queryByText, getByText } = renderHome();
    expect(getByText("Otros Profesionales")).toBeTruthy();
    expect(queryByText("Compounding No Estéril Avanzado — Parte 2")).toBeNull();
    expect(queryByText("Estudiantes Subgraduados")).toBeNull();
  });

  it("con envs → las dos tarjetas nuevas aparecen, sin montos en dólares", () => {
    process.env[PARTE2_ENV] = "price_x";
    process.env[SUBGRADUADO_ENV] = "price_y";

    const { getByText, container } = renderHome();
    expect(getByText("Compounding No Estéril Avanzado — Parte 2")).toBeTruthy();
    expect(getByText("Estudiantes Subgraduados")).toBeTruthy();
    expect(container.textContent).not.toMatch(/\$\s?\d/);
  });
});
