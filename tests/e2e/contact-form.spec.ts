import { test, expect } from "@playwright/test";

test("contact form renders and validates required fields", async ({ page }) => {
  await page.goto("/es/contacto");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Contáctanos");
  // Required fields enforced by the browser; native validation prevents submit.
  await page.getByRole("button", { name: "Enviar mensaje" }).click();
  const name = page.getByLabel("Nombre");
  await expect(name).toBeFocused();
});

test("contact form shows error toast when API misconfigured", async ({ page }) => {
  await page.goto("/en/contact");
  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Message").fill("Hello.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Something went wrong.")).toBeVisible({ timeout: 5000 });
});
