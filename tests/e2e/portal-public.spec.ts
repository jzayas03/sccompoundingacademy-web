import { test, expect } from "@playwright/test";

/**
 * Public surfaces of the portal — pages reachable without a session.
 *
 * No fixtures, no auth: the dev server boots with a placeholder
 * DATABASE_URL so DB-touching paths fail at runtime. These tests
 * deliberately exercise only the page-render layer: structural copy,
 * the form scaffolding on /login, and the chartreuse seal on /verify.
 */
test.describe("Portal public surfaces", () => {
  test("/es/portal/login renders the magic-link form", async ({ page }) => {
    await page.goto("/es/portal/login");
    await expect(page.getByText("Portal del estudiante").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Entrá al portal" }),
    ).toBeVisible();
    await expect(page.getByLabel("Correo electrónico")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Enviar enlace" }),
    ).toBeEnabled();
  });

  test("/es/portal/verify renders the check-email panel", async ({ page }) => {
    await page.goto("/es/portal/verify");
    await expect(
      page.getByRole("heading", { level: 1, name: "Revisa tu correo" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Pedir un nuevo enlace/ }),
    ).toBeVisible();
  });

  test("GlassNav renders the back-to-site link when signed out", async ({
    page,
  }) => {
    await page.goto("/es/portal/login");
    await expect(
      page.getByRole("link", { name: /Volver al sitio/ }),
    ).toBeVisible();
    // Salir is the signed-in alternative — must not appear here.
    await expect(page.getByRole("button", { name: "Salir" })).toHaveCount(0);
  });
});
