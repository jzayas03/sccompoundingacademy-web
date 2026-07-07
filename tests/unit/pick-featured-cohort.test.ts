import { describe, it, expect } from "vitest";
import { pickFeaturedCohort } from "@/lib/cohorts/featured";

const c = (id: string, featured: boolean) => ({ id, featured });

describe("pickFeaturedCohort", () => {
  it("returns the earliest featured cohort when one is featured", () => {
    expect(pickFeaturedCohort([c("a", false), c("b", true), c("c", false)])?.id).toBe("b");
  });
  it("returns the earliest featured when several are featured (list is earliest-first)", () => {
    expect(pickFeaturedCohort([c("a", false), c("b", true), c("c", true)])?.id).toBe("b");
  });
  it("falls back to the earliest open cohort when none is featured", () => {
    expect(pickFeaturedCohort([c("a", false), c("b", false)])?.id).toBe("a");
  });
  it("returns undefined for an empty list", () => {
    expect(pickFeaturedCohort([])).toBeUndefined();
  });
});
