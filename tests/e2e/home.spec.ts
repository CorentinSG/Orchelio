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
      page.getByRole("heading", { name: "The adaptive operating system for law firms" }),
    ).toBeVisible();
    await expect(page.getByText("Powered by Orchelio")).toBeVisible();
  });

  test("renders body copy with intact word spacing", async ({ page }) => {
    await page.goto("/");

    // Interleaving text with {expressions} across source lines lets the JSX
    // compiler collapse the separating space and glue words together
    // ("Orcheliois a configurable..."). Assert the exact sentences so that
    // regression cannot land unnoticed.
    await expect(
      page.getByText(
        "Orchelio is a configurable platform for law firms. One codebase serves every firm;",
      ),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Orchelio runs on a simulated AI provider. No Anthropic API key is required",
      ),
    ).toBeVisible();
  });

  test("warns that this is a demonstration environment", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByText(
        "Demo environment — Do not upload real client information or confidential documents.",
      ),
    ).toBeVisible();
  });

  test("reports live database status", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Platform status" })).toBeVisible();
    await expect(page.getByText("System operational")).toBeVisible();
    await expect(page.getByText("Connected")).toBeVisible();
  });

  test("states that no live AI call is made", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("No live AI calls are made")).toBeVisible();
  });

  test("serves a branded 404 for an unknown page", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});
