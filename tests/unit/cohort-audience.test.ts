import { describe, it, expect } from "vitest";
import {
  enrolleeAudience,
  visibleAudiences,
  audienceMatches,
  audienceMismatchMessage,
  AUDIENCE_LABELS,
} from "@/lib/cohorts/audience";

describe("enrolleeAudience", () => {
  it("maps student to estudiante", () => {
    expect(enrolleeAudience("student", null)).toBe("estudiante");
  });
  it("maps professional pharmacy roles to farmaceutico_tecnico", () => {
    expect(enrolleeAudience("profesional", "farmaceutico")).toBe("farmaceutico_tecnico");
    expect(enrolleeAudience("profesional", "tecnico")).toBe("farmaceutico_tecnico");
  });
  it("maps professional non-pharmacy to otros_profesionales", () => {
    expect(enrolleeAudience("profesional", "medico")).toBe("otros_profesionales");
    expect(enrolleeAudience("profesional", "otro")).toBe("otros_profesionales");
  });
  it("is null (undetermined) for professional with no profession yet", () => {
    expect(enrolleeAudience("profesional", "")).toBeNull();
    expect(enrolleeAudience("profesional", null)).toBeNull();
  });
});

describe("visibleAudiences", () => {
  it("shows the single determined audience", () => {
    expect(visibleAudiences("student", null)).toEqual(["estudiante"]);
    expect(visibleAudiences("profesional", "farmaceutico")).toEqual(["farmaceutico_tecnico"]);
    expect(visibleAudiences("profesional", "otro")).toEqual(["otros_profesionales"]);
  });
  it("shows both professional audiences while the profession is unpicked", () => {
    expect(visibleAudiences("profesional", "")).toEqual([
      "farmaceutico_tecnico",
      "otros_profesionales",
    ]);
  });
});

describe("audienceMatches", () => {
  it("is true only when the enrollee's audience equals the cohort's", () => {
    expect(audienceMatches("farmaceutico_tecnico", "profesional", "farmaceutico")).toBe(true);
    expect(audienceMatches("otros_profesionales", "profesional", "farmaceutico")).toBe(false);
    expect(audienceMatches("estudiante", "student", null)).toBe(true);
    expect(audienceMatches("estudiante", "profesional", "medico")).toBe(false);
  });
});

describe("audienceMismatchMessage", () => {
  it("names the cohort audience, localized", () => {
    expect(audienceMismatchMessage("estudiante", "es")).toContain("Estudiantes");
    expect(audienceMismatchMessage("farmaceutico_tecnico", "en")).toContain("Pharmacists");
  });
});

describe("AUDIENCE_LABELS", () => {
  it("covers all three audiences in both locales", () => {
    for (const a of ["farmaceutico_tecnico", "otros_profesionales", "estudiante"] as const) {
      expect(AUDIENCE_LABELS[a].es.length).toBeGreaterThan(0);
      expect(AUDIENCE_LABELS[a].en.length).toBeGreaterThan(0);
    }
  });
});

describe("enrollment gate decision", () => {
  it("blocks a student from a farmaceutico_tecnico cohort", () => {
    expect(audienceMatches("farmaceutico_tecnico", "student", null)).toBe(false);
  });
  it("allows a matching professional", () => {
    expect(audienceMatches("otros_profesionales", "profesional", "medico")).toBe(true);
  });
});
