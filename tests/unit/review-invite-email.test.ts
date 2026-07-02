import { describe, it, expect } from "vitest";
import { buildReviewInviteEmail } from "@/lib/emails/review-invite";

describe("buildReviewInviteEmail", () => {
  it("interpolates the student's first name into the subject and body", () => {
    const out = buildReviewInviteEmail({
      nombre: "María del Carmen Rivera Santiago",
      reviewUrl: "https://sccompoundingacademy.com/es/portal/reseñas",
    });
    expect(out.subject).toContain("María");
    expect(out.text).toContain("María");
    expect(out.html).toContain("María");
  });

  it("includes the review URL in both html and text bodies", () => {
    const out = buildReviewInviteEmail({
      nombre: "Juan Pérez",
      reviewUrl: "https://sccompoundingacademy.com/es/portal/reseñas",
    });
    expect(out.html).toContain("https://sccompoundingacademy.com/es/portal/reseñas");
    expect(out.text).toContain("https://sccompoundingacademy.com/es/portal/reseñas");
  });

  it("uses a fallback greeting when the name is missing", () => {
    const out = buildReviewInviteEmail({
      nombre: "",
      reviewUrl: "https://sccompoundingacademy.com/es/portal/reseñas",
    });
    expect(out.text.toLowerCase()).toContain("hola");
    expect(out.subject.length).toBeGreaterThan(0);
  });

  it("returns plain-text and html that mention the Lcdo. Reyes-signed voice", () => {
    const out = buildReviewInviteEmail({
      nombre: "Juan",
      reviewUrl: "https://sccompoundingacademy.com/es/portal/reseñas",
    });
    expect(out.text).toMatch(/Lcdo\.\s*Jorge\s*L\.\s*Reyes/i);
    expect(out.html).toMatch(/Lcdo\.\s*Jorge\s*L\.\s*Reyes/i);
  });

  it("renders on the shared SCCA shell and keeps the disclosure", () => {
    const out = buildReviewInviteEmail({
      nombre: "Juan",
      reviewUrl: "https://sccompoundingacademy.com/es/portal/resenas",
    });
    expect(out.html).toContain("Montserrat"); // shell font
    expect(out.html).toContain("sccompoundingacademy.com"); // shell footer band
    expect(out.html).toContain("Completaste el curso"); // hero headline
    expect(out.html).toContain("completaste recientemente el curso"); // disclosure kept
    // Old off-brand markup is gone.
    expect(out.html).not.toContain("logo-email.png");
    expect(out.html).not.toContain("-apple-system");
  });
});
