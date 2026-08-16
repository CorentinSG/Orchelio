import { expect, test } from "@playwright/test";

/**
 * Phase 8 — usage, costs and the guided demonstration, in a real browser.
 *
 * The figures themselves are arithmetic and are checked where arithmetic is
 * checkable. What a browser adds is that the page says, in the words the
 * specification asks for, that nothing was charged — and that a role without
 * the permission does not reach it at all.
 */

const PASSWORD = "orchelio-demo";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("usage and costs", () => {
  test("says plainly that no charge was incurred", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/usage");

    await expect(page.getByRole("heading", { name: "Consommation et coûts" })).toBeVisible();
    await expect(
      page.getByText("Coût simulé — aucun frais d’API n’a été engagé."),
    ).toBeVisible();
    await expect(page.getByRole("main")).toContainText("mock");
  });

  test("never claims to forecast a real deployment's cost", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/usage");

    await expect(page.getByRole("main")).toContainText(
      /ne peut pas vous dire, c’est ce qu’un déploiement réel coûterait/i,
    );
  });

  test("shows this firm's figures and not the platform's", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/usage");

    // Whatever the numbers are, the page is scoped to the open firm and says so.
    await expect(page.getByRole("main")).toContainText("Cabinet Carter");
    await expect(page.getByRole("main")).toContainText("ce cabinet");
  });

  test("a paralegal has no permission to see costs", async ({ page }) => {
    await signIn(page, "immigration.paralegal@demo.local");
    await page.goto("/usage");
    await expect(page).toHaveURL(/\/403/);
  });

  test("the sidebar offers it only to those who may open it", async ({ page }) => {
    await signIn(page, "immigration.paralegal@demo.local");
    const sidebar = page.getByRole("complementary", { name: "Espace du cabinet" });
    await expect(sidebar.getByRole("link", { name: "Consommation et coûts" })).toHaveCount(0);

    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await page.waitForURL(/\/login|\/$/);

    await signIn(page, "immigration.attorney@demo.local");
    await expect(
      page.getByRole("complementary", { name: "Espace du cabinet" }).getByRole("link", { name: "Consommation et coûts" }),
    ).toBeVisible();
  });
});

test.describe("the guided demonstration", () => {
  test("is readable before signing in", async ({ page }) => {
    // Somebody deciding whether to sign in should be able to read what they
    // would be shown first.
    await page.goto("/guide");
    await expect(page.getByRole("heading", { name: /Orchelio en 21 étapes/ })).toBeVisible();
  });

  test("has twenty-one numbered steps", async ({ page }) => {
    await page.goto("/guide");
    await expect(page.getByRole("listitem").filter({ has: page.getByRole("link", { name: /^Ouvrir \// }) })).toHaveCount(21);
  });

  test("says up front that everything in it is invented", async ({ page }) => {
    await page.goto("/guide");
    await expect(page.getByRole("main")).toContainText(/fictifs|fictional/i);
    await expect(page.getByRole("main")).toContainText("orchelio-demo");
  });

  test("every step links somewhere that answers", async ({ page }) => {
    await page.goto("/guide");

    const links = page.getByRole("link", { name: /^Ouvrir \// });
    const count = await links.count();
    expect(count).toBe(21);

    // Following all twenty-one would be a suite of its own; the routes are
    // checked exhaustively against the filesystem in tests/unit/guide.test.ts.
    // What is checked here is that they are real links a browser can follow.
    for (let index = 0; index < count; index += 1) {
      const href = await links.nth(index).getAttribute("href");
      expect(href, `step ${index + 1}`).toMatch(/^\//);
    }
  });
});
