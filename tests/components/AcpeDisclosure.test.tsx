import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcpeDisclosure } from "@/components/portal/AcpeDisclosure";

describe("AcpeDisclosure", () => {
  const originalHeading = process.env.ACPE_DISCLOSURE_HEADING_ES;
  const originalBody = process.env.ACPE_DISCLOSURE_BODY_ES;

  afterEach(() => {
    // `process.env.FOO = undefined` coerces to the string "undefined" in
    // Node, so restore-or-delete depending on the original value to keep
    // tests isolated.
    if (originalHeading === undefined) {
      delete process.env.ACPE_DISCLOSURE_HEADING_ES;
    } else {
      process.env.ACPE_DISCLOSURE_HEADING_ES = originalHeading;
    }
    if (originalBody === undefined) {
      delete process.env.ACPE_DISCLOSURE_BODY_ES;
    } else {
      process.env.ACPE_DISCLOSURE_BODY_ES = originalBody;
    }
  });

  it("renders the default heading and body when env vars are unset", () => {
    delete process.env.ACPE_DISCLOSURE_HEADING_ES;
    delete process.env.ACPE_DISCLOSURE_BODY_ES;
    render(<AcpeDisclosure />);
    // Landmark check — disclosure heading must be a real h2 for AT users.
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
  });

  it("renders env-overridden heading and body when set", () => {
    process.env.ACPE_DISCLOSURE_HEADING_ES = "Encabezado de prueba";
    process.env.ACPE_DISCLOSURE_BODY_ES = "Cuerpo de prueba 12345.";
    render(<AcpeDisclosure />);
    expect(screen.getByText("Encabezado de prueba")).toBeInTheDocument();
    expect(screen.getByText(/Cuerpo de prueba 12345/)).toBeInTheDocument();
  });

  it("includes the ACPE standards reference footer", () => {
    render(<AcpeDisclosure />);
    expect(
      screen.getByText(/Standards for Integrity and Independence/i),
    ).toBeInTheDocument();
  });
});
