import { test, expect } from "@playwright/test";

test("root redirects to /es by default", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/es(\/|$)/);
});

test("/en renders English headline", async ({ page }) => {
  await page.goto("/en");
  // §00 Atrium opens the page; assertion covers both lines of the stacked
  // headline ("We educate to build" + "wellness and health.").
  await expect(page.getByRole("heading", { level: 1 })).toContainText("We educate to build");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("wellness and health");
});

test("/es renders Spanish headline", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Educamos para formar");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("bienestar y salud");
});
