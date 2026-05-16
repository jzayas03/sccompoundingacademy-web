import { describe, it, expect } from "vitest";
import { brand } from "@/lib/brand";

describe("brand tokens", () => {
  it("exposes the five core hex values exactly", () => {
    expect(brand.colors.tealDeep).toBe("#225560");
    expect(brand.colors.teal).toBe("#368798");
    expect(brand.colors.chartreuse).toBe("#E9EA8A");
    expect(brand.colors.sand).toBe("#EAE2D6");
    expect(brand.colors.offWhite).toBe("#F5F6F7");
  });

  it("exposes the gray ramp", () => {
    expect(brand.colors.gray).toEqual({
      900: "#404040",
      700: "#666666",
      500: "#BABABA",
      300: "#E0E0E0",
      100: "#F5F5F5",
    });
  });

  it("exposes the brand gradient", () => {
    expect(brand.gradient.brand).toContain("#225560");
    expect(brand.gradient.brand).toContain("#368798");
    expect(brand.gradient.brand).toContain("#E9EA8A");
    expect(brand.gradient.brand).toContain("#EAE2D6");
    expect(brand.gradient.brand).toContain("#F5F6F7");
  });

  it("exposes type stacks with Avant Garde first", () => {
    expect(brand.type.heading[0]).toBe("ITC Avant Garde Gothic Pro");
    expect(brand.type.heading).toContain("Montserrat");
    expect(brand.type.accent[0]).toBe("Khmer MN");
  });
});
