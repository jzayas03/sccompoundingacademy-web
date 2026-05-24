import { describe, it, expect } from "vitest";
import { formatReviewerName } from "@/lib/reviews/format";

describe("formatReviewerName", () => {
  it("formats first name + last initial when both are present", () => {
    expect(formatReviewerName("María del Carmen Rivera Santiago")).toBe("María R.");
  });

  it("formats first name + last initial for a simple two-word name", () => {
    expect(formatReviewerName("Juan Pérez")).toBe("Juan P.");
  });

  it("returns just the first name when no last name is present", () => {
    expect(formatReviewerName("Juan")).toBe("Juan");
  });

  it("returns a sensible fallback when the input is empty or null-ish", () => {
    expect(formatReviewerName(null)).toBe("Estudiante");
    expect(formatReviewerName("")).toBe("Estudiante");
    expect(formatReviewerName("   ")).toBe("Estudiante");
  });

  it("collapses double spaces and trims whitespace", () => {
    expect(formatReviewerName("  María   Rivera ")).toBe("María R.");
  });

  it("handles a single-letter first name without trailing period stacking", () => {
    expect(formatReviewerName("A. Rivera")).toBe("A. R.");
  });
});
