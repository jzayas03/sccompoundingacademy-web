import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility smoke — axe-core scans on the public surfaces.
 *
 * Scope:
 *   - Landing /es (most-traffic page)
 *   - /es/cursos (course catalogue with module strip + pricing + CE)
 *   - /es/contacto (form-heavy)
 *   - /es/portal/login (portal entry point, glass surface)
 *
 * Assertion policy: fail the test only on `impact === "critical"`
 * violations. `serious` / `moderate` / `minor` findings are logged so
 * the owner can triage incrementally without blocking releases. This
 * matches the WCAG-A baseline most teams ship with.
 *
 * The full violation report is printed for any non-empty result set so
 * `pnpm test:e2e` output doubles as an audit trail.
 */

async function scan(page: import("@playwright/test").Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();

  if (results.violations.length > 0) {
    console.log(`\n[axe] ${label} — ${results.violations.length} finding(s):`);
    for (const v of results.violations) {
      console.log(`  · [${v.impact}] ${v.id}: ${v.help}`);
      for (const node of v.nodes.slice(0, 3)) {
        console.log(`      ${node.target.join(" ")}`);
      }
    }
  }
  return results;
}

test.describe("Accessibility scans", () => {
  test("axe — landing /es", async ({ page }) => {
    await page.goto("/es");
    const results = await scan(page, "/es");
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });

  test("axe — /es/cursos", async ({ page }) => {
    await page.goto("/es/cursos");
    const results = await scan(page, "/es/cursos");
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });

  test("axe — /es/contacto", async ({ page }) => {
    await page.goto("/es/contacto");
    const results = await scan(page, "/es/contacto");
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });

  test("axe — /es/portal/login", async ({ page }) => {
    await page.goto("/es/portal/login");
    const results = await scan(page, "/es/portal/login");
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });
});
