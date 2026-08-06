import { expect, test } from "@playwright/test";

/**
 * Phase 1 acceptance: the application actually runs, renders under the
 * Orchelio identity, warns that this is a demonstration, and reports live
 * database state rather than a hard-coded mock-up.
 */
test.describe("Orchelio home page", () => {
  test("renders under the Orchelio identity", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Orchelio/);
    await expect(page.getByRole("img", { name: "Orchelio logo" }).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Le cockpit adaptatif des cabinets d'avocats" }),
    ).toBeVisible();
    await expect(page.getByText("Propulsé par Orchelio")).toBeVisible();
  });

  test("renders body copy with intact word spacing", async ({ page }) => {
    await page.goto("/");

    // Interleaving text with {expressions} across source lines lets the JSX
    // compiler collapse the separating space and glue words together
    // ("Orcheliois a configurable..."). Assert the exact sentences so that
    // regression cannot land unnoticed.
    await expect(
      page.getByText(
        "Orchelio est une plateforme configurable pour cabinets d’avocats. Un seul code sert",
      ),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Orchelio fonctionne avec un assistant simulé. Aucune clé d’API Anthropic n’est requise",
      ),
    ).toBeVisible();
  });

  test("warns that this is a demonstration environment", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByText(
        "Environnement de démonstration — n'y saisissez jamais d'informations réelles sur un client.",
      ),
    ).toBeVisible();
  });

  test("reports live database status", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "État de la plateforme" })).toBeVisible();
    await expect(page.getByText("Système opérationnel")).toBeVisible();
    await expect(page.getByText("Connectée")).toBeVisible();
  });

  test("states that no live AI call is made", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Aucun appel réel à une IA n’est effectué")).toBeVisible();
  });

  test("serves a branded 404 for an unknown page", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  });
});
