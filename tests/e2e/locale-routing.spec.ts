import { test, expect } from "@playwright/test";

test("root redirects to /es by default", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/es(\/|$)/);
});

test("/en renders English headline", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your next certification starts here",
  );
});

test("/es renders Spanish headline", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Tu próxima certificación comienza aquí",
  );
});
