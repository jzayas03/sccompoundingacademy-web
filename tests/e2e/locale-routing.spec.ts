import { test, expect } from "@playwright/test";

test("root redirects to /es by default", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/es(\/|$)/);
});

test("/en renders English headline", async ({ page }) => {
  await page.goto("/en");
  // Hero h1 carries the program promise — assertion covers the
  // core phrase that should not regress without explicit intent.
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Practical compounding training",
  );
});

test("/es renders Spanish headline", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Formación práctica en compounding",
  );
});
