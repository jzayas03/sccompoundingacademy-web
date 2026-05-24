import { test, expect } from "@playwright/test";

/**
 * `<Resenas />` is gated on ≥3 approved reviews. In the test environment
 * the DB is unreachable, so the component returns []. Verify the section
 * is absent (no orphaned container, no empty heading).
 *
 * When real approved reviews exist in production this test will be
 * tightened to assert positive presence (heading visible + at least
 * 3 articles).
 */
test.describe("Resenas section — landing", () => {
  test("section is absent when there are fewer than 3 approved reviews", async ({ page }) => {
    await page.goto("/es");
    await expect(page.getByRole("heading", { name: "Lo que dicen los estudiantes" })).toHaveCount(0);
    // Defence in depth — also ensure no orphaned section container leaks
    // in if a future change accidentally renders the View before checking
    // length.
    const stars = page.locator("section[aria-labelledby='resenas-heading']");
    await expect(stars).toHaveCount(0);
  });
});
