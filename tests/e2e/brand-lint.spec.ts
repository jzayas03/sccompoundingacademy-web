import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";

test("no hex literals outside src/lib/brand.ts", () => {
  // grep -RIE for 6-digit hex codes in .ts/.tsx files under src/, excluding the
  // single allowlisted source of truth and the ESLint rule (whose fixtures
  // legitimately contain hex). Uses grep (universally available) rather than
  // ripgrep so the test works on any dev machine and in CI.
  let output = "";
  try {
    output = execSync(
      String.raw`grep -RIE --include='*.ts' --include='*.tsx' --exclude='brand.ts' --exclude-dir='eslint-rules' "#[0-9A-Fa-f]{6}" src/`,
      { stdio: ["ignore", "pipe", "pipe"] },
    ).toString();
  } catch (err) {
    // grep exits 1 when no matches — that's success here.
    if ((err as { status?: number }).status === 1) return;
    throw err;
  }
  // If we get here, grep found matches.
  expect(output, `Found hex literals outside lib/brand.ts:\n${output}`).toBe("");
});
