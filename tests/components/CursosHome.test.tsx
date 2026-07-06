// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "@/messages/es.json";
import { CursosHome } from "@/components/marketing/CursosHome";

describe("CursosHome", () => {
  it("renders no dollar price on the marketing cards", () => {
    const { container } = render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <CursosHome />
      </NextIntlClientProvider>,
    );
    expect(container.textContent).not.toMatch(/\$\s?\d/);
  });
});
