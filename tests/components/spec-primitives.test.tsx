// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SpecTag } from "@/components/ui/SpecTag";
import { SpecRail } from "@/components/ui/SpecRail";
import { SloganLockup } from "@/components/ui/SloganLockup";

describe("signature primitives", () => {
  it("SpecTag renders its label with the spec-tag class", () => {
    render(<SpecTag>USP ⟨795⟩</SpecTag>);
    const el = screen.getByText("USP ⟨795⟩");
    expect(el).toHaveClass("spec-tag");
  });
  it("SpecRail renders each item", () => {
    render(<SpecRail items={["18 h", "ACPE 0151"]} />);
    expect(screen.getByText("18 h")).toBeInTheDocument();
    expect(screen.getByText("ACPE 0151")).toBeInTheDocument();
  });
  it("SloganLockup renders roman + italic parts", () => {
    render(<SloganLockup roman="Educamos para formar" italic="bienestar y salud." />);
    expect(screen.getByText("Educamos para formar")).toBeInTheDocument();
    expect(screen.getByText("bienestar y salud.").tagName.toLowerCase()).toBe("em");
  });
});
