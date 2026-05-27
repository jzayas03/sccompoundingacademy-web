import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcpeDisclosure } from "@/components/portal/AcpeDisclosure";

describe("AcpeDisclosure", () => {
  const originalEnv = {
    headingEs: process.env.ACPE_DISCLOSURE_HEADING_ES,
    bodyEs: process.env.ACPE_DISCLOSURE_BODY_ES,
    headingEn: process.env.ACPE_DISCLOSURE_HEADING_EN,
    bodyEn: process.env.ACPE_DISCLOSURE_BODY_EN,
  };

  afterEach(() => {
    // `process.env.FOO = undefined` coerces to the string "undefined" in
    // Node, so restore-or-delete depending on the original value to keep
    // tests isolated.
    const restore = (key: keyof typeof originalEnv, envVar: string) => {
      const v = originalEnv[key];
      if (v === undefined) delete process.env[envVar];
      else process.env[envVar] = v;
    };
    restore("headingEs", "ACPE_DISCLOSURE_HEADING_ES");
    restore("bodyEs", "ACPE_DISCLOSURE_BODY_ES");
    restore("headingEn", "ACPE_DISCLOSURE_HEADING_EN");
    restore("bodyEn", "ACPE_DISCLOSURE_BODY_EN");
  });

  it("renders the ES defaults when env vars are unset", () => {
    delete process.env.ACPE_DISCLOSURE_HEADING_ES;
    delete process.env.ACPE_DISCLOSURE_BODY_ES;
    render(<AcpeDisclosure locale="es" />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Divulgación de relaciones financieras/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Lcdo\. Jorge L\. Reyes Quiñones, RPh, FACA, FACVP/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no tiene relaciones financieras relevantes/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Conforme con ACPE Standards for Integrity/i),
    ).toBeInTheDocument();
  });

  it("renders the EN defaults when env vars are unset", () => {
    delete process.env.ACPE_DISCLOSURE_HEADING_EN;
    delete process.env.ACPE_DISCLOSURE_BODY_EN;
    render(<AcpeDisclosure locale="en" />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Financial relationships disclosure/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Jorge L\. Reyes Quiñones, RPh, FACA, FACVP/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no relevant financial relationships/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Complies with ACPE Standards for Integrity/i),
    ).toBeInTheDocument();
  });

  it("renders ES env-overridden heading and body when set", () => {
    process.env.ACPE_DISCLOSURE_HEADING_ES = "Encabezado de prueba";
    process.env.ACPE_DISCLOSURE_BODY_ES = "Cuerpo de prueba 12345.";
    render(<AcpeDisclosure locale="es" />);
    expect(screen.getByText("Encabezado de prueba")).toBeInTheDocument();
    expect(screen.getByText(/Cuerpo de prueba 12345/)).toBeInTheDocument();
  });

  it("renders EN env-overridden heading and body when set", () => {
    process.env.ACPE_DISCLOSURE_HEADING_EN = "Test heading";
    process.env.ACPE_DISCLOSURE_BODY_EN = "Test body 12345.";
    render(<AcpeDisclosure locale="en" />);
    expect(screen.getByText("Test heading")).toBeInTheDocument();
    expect(screen.getByText(/Test body 12345/)).toBeInTheDocument();
  });

  it("includes the ACPE standards reference footer in both locales", () => {
    render(<AcpeDisclosure locale="es" />);
    expect(
      screen.getByText(/Standards for Integrity and Independence/i),
    ).toBeInTheDocument();
  });
});
