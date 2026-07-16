// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * RFC 9116 security.txt — served statically from public/.well-known/.
 * The Expires assertion is deliberately time-sensitive: when the file
 * goes stale this test fails, forcing a conscious refresh instead of
 * advertising an expired security contact.
 */

const content = readFileSync(
  join(process.cwd(), "public/.well-known/security.txt"),
  "utf8",
);

describe("security.txt", () => {
  it("declares a mailto security contact", () => {
    expect(content).toMatch(/^Contact: mailto:.+@sccompoundingacademy\.com$/m);
  });

  it("has an Expires date in the future", () => {
    const match = content.match(/^Expires: (.+)$/m);
    expect(match).not.toBeNull();
    const expires = new Date(match![1]);
    expect(Number.isNaN(expires.getTime())).toBe(false);
    expect(expires.getTime()).toBeGreaterThan(Date.now());
  });

  it("points its Canonical URL at the production well-known path", () => {
    expect(content).toContain(
      "Canonical: https://sccompoundingacademy.com/.well-known/security.txt",
    );
  });
});
