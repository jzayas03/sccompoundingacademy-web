import { describe, it, expect } from "vitest";
import { brand } from "@/lib/brand";

describe("brand tokens", () => {
  it("exposes the five core hex values exactly (from Compounding Academy Brandsheet)", () => {
    expect(brand.colors.tealDeep).toBe("#195561");
    expect(brand.colors.teal).toBe("#228698");
    expect(brand.colors.chartreuse).toBe("#E6EA82");
    expect(brand.colors.sand).toBe("#EAE1D6");
    expect(brand.colors.offWhite).toBe("#F3F3F4");
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
    expect(brand.gradient.brand).toContain("#195561");
    expect(brand.gradient.brand).toContain("#228698");
    expect(brand.gradient.brand).toContain("#E6EA82");
    expect(brand.gradient.brand).toContain("#EAE1D6");
    expect(brand.gradient.brand).toContain("#F3F3F4");
  });

  it("exposes type stacks with Avant Garde first", () => {
    expect(brand.type.heading[0]).toBe("ITC Avant Garde Gothic Pro");
    expect(brand.type.heading).toContain("Outfit");
    expect(brand.type.accent[0]).toBe("Khmer MN");
  });
});
