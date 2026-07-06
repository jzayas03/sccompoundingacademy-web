// @vitest-environment node
//
// Runs in the *node* environment (not the default jsdom): cert rendering
// reads the template via `fs` and embeds it with pdf-lib, and a Node
// Buffer is only recognised as a Uint8Array under the real node realm.
//
// This guards the actual production code path. It caught a crash where the
// student certificate drew "USP 〈795〉" with the U+3008/U+3009 angle
// brackets, which the Helvetica StandardFont (WinAnsi) cannot encode —
// renderCertificatePdf threw and the student download came back empty.
import { describe, it, expect } from "vitest";
import { renderCertificatePdf } from "@/lib/certificates/render";

describe("renderCertificatePdf", () => {
  for (const program of ["profesional", "profesional-completion", "student"] as const) {
    it(`produces a valid PDF for the ${program} program`, async () => {
      const certNo =
        program === "student"
          ? "SCCA-EST-2026-001"
          : program === "profesional-completion"
            ? "SCCA-COMP-2026-001"
            : "SCCA-2026-001";
      const bytes = await renderCertificatePdf({
        certNo,
        studentName: "Kiara Rivera Santiago",
        issuedAt: new Date("2026-06-24T00:00:00Z"),
        verificationUrl: "https://sccompoundingacademy.com/verificar/X",
        program,
      });
      expect(bytes.length).toBeGreaterThan(1000);
      // Valid PDF header.
      expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    });
  }
});
