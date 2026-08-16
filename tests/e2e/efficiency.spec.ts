import { expect, test, type Page } from "@playwright/test";

/**
 * Chantier Lisibilité, phase L-0 — the cost of using the product, measured.
 *
 * Each test walks one of the six most frequent journeys using only what a
 * person can see — links, buttons, fields — and counts every action taken.
 * The ceilings below are pinned at what the product costs *today*, so this
 * file is a ratchet, not a wish: phases L-1 to L-5 lower a ceiling by
 * lowering the real cost, and raising one ever again needs a written reason
 * in ADR-0029.
 *
 * An "action" is one thing a person does: a click, a filled field, a chosen
 * file. Reading and scrolling are not counted here — their cost is measured
 * separately, as words on the screen — and signing in is the shared price of
 * every journey, so it is counted in none of them.
 *
 * The word ceilings cover only screens whose length does not grow with the
 * firm's data. The queues — the matter list, the approvals — are deliberately
 * absent: their length is today's known problem, L-1 makes them
 * volume-independent, and a ceiling that fails because the test suite added
 * rows would be flakiness measuring nothing. ADR-0029 records their numbers
 * and the obligation.
 */

const PASSWORD = "orchelio-demo";

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** Counts what a person does. One call, one action. */
function counter() {
  let actions = 0;
  return {
    act: async (step: () => Promise<unknown>) => {
      actions += 1;
      await step();
    },
    total: () => actions,
  };
}

function matterTabs(page: Page) {
  return page.getByRole("navigation", { name: "Sections du dossier" });
}

/** Journey shared by several tests: from the dashboard to an open matter. */
async function openMatterBySearch(
  page: Page,
  count: ReturnType<typeof counter>,
  query: string,
  reference: string,
) {
  await count.act(() => page.getByRole("link", { name: "Dossiers", exact: true }).first().click());
  await count.act(() => page.getByLabel("Rechercher").fill(query));
  await count.act(() => page.getByRole("button", { name: "Appliquer" }).click());
  await count.act(() => page.getByRole("link", { name: new RegExp(reference) }).first().click());
  await page.waitForURL(/\/matters\/[0-9a-f-]{36}/);
}

test.describe("what a journey costs, in actions", () => {
  test("finding a matter by its reference takes at most four actions", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    const count = counter();

    await openMatterBySearch(page, count, "IMM-2026-001", "IMM-2026-001");

    await expect(page.locator("main")).toContainText("IMM-2026-001");
    // L-5 (recent matters, the command palette) exists to lower this.
    expect(count.total()).toBeLessThanOrEqual(4);
  });

  test("finding a matter by its client takes at most four actions", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    const count = counter();

    await openMatterBySearch(page, count, "Hassan", "IMM-2026-003");

    await expect(page.locator("main")).toContainText("IMM-2026-003");
    expect(count.total()).toBeLessThanOrEqual(4);
  });

  test("running an analysis takes at most six actions", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    const count = counter();

    await openMatterBySearch(page, count, "IMM-2026-001", "IMM-2026-001");
    await count.act(() => matterTabs(page).getByRole("link", { name: "Analyse" }).click());
    await count.act(() =>
      page.getByRole("button", { name: /^Lancer l’analyse$|^Relancer l’analyse$/ }).click(),
    );
    await page.waitForURL(/tab=analysis/);

    await expect(page.getByRole("region", { name: "Résumé" })).toBeVisible();
    expect(count.total()).toBeLessThanOrEqual(6);
  });

  test("deciding a pending approval takes at most two actions", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");

    // Setup, not journey: make sure something is waiting. The journey starts
    // once the request exists, as it would for the person asked to decide.
    await page.goto("/matters");
    await page.getByRole("link", { name: /IMM-2026-003/ }).first().click();
    await page.waitForURL(/\/matters\/[0-9a-f-]{36}/);
    await matterTabs(page).getByRole("link", { name: "Analyse" }).click();
    await page
      .getByRole("button", { name: /^Lancer l’analyse$|^Relancer l’analyse$/ })
      .click();
    await page.waitForURL(/tab=analysis/);
    await page.goto("/dashboard");

    const count = counter();
    await count.act(() =>
      page.getByRole("link", { name: "Validations", exact: true }).first().click(),
    );
    const card = page
      .getByRole("region", { name: /^En attente d’une décision/ })
      .locator("li")
      .filter({ hasText: "IMM-2026-003" })
      .first();
    await count.act(() => card.getByRole("button", { name: /^Validée$/ }).click());
    await page.waitForURL(/\/approvals/);

    await expect(page.getByText("Décision enregistrée")).toBeVisible();
    // Two actions to act — but finding the card in the queue is the real cost
    // today, and it is paid in words, not clicks. That is L-1's number.
    expect(count.total()).toBeLessThanOrEqual(2);
  });

  test("adding a document takes at most eight actions", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    const count = counter();

    await openMatterBySearch(page, count, "IMM-2026-001", "IMM-2026-001");
    await count.act(() => matterTabs(page).getByRole("link", { name: "Documents" }).click());
    await count.act(() =>
      page.getByLabel("Choisir un document").setInputFiles({
        name: `efficiency-${Date.now()}.pdf`,
        mimeType: "application/pdf",
        buffer: Buffer.from("fictional"),
      }),
    );
    await count.act(() =>
      page.getByLabel("De quel type de document s’agit-il ?").selectOption("other"),
    );
    await count.act(() => page.getByRole("button", { name: "Ajouter le document" }).click());
    await page.waitForURL(/tab=documents/);

    await expect(page.getByText("Document enregistré")).toBeVisible();
    expect(count.total()).toBeLessThanOrEqual(8);
  });

  test("switching firm takes one action", async ({ page }) => {
    await signIn(page, "reviewer@demo.local");
    // The reviewer lands on the firm picker; entering the first firm is part
    // of signing in, not of the switch being measured.
    await page
      .getByRole("region", { name: "Vos cabinets" })
      .getByRole("button", { name: /Dupont & Associés/ })
      .click();
    await expect(page.getByRole("heading", { name: "Dupont & Associés" })).toBeVisible();

    const count = counter();
    await count.act(() =>
      page
        .getByRole("region", { name: "Vos cabinets" })
        .getByRole("button", { name: /Cabinet Carter/ })
        .click(),
    );

    await expect(page.getByRole("heading", { name: "Cabinet Carter" })).toBeVisible();
    // Already cheap. Pinned so it stays cheap.
    expect(count.total()).toBeLessThanOrEqual(1);
  });
});

test.describe("what a screen costs, in words", () => {
  // Only screens whose length does not grow with the firm's data. The measure
  // is what a person faces before any of their own records: chrome, warnings,
  // labels. ADR-0029 holds today's numbers for the queues, which are excluded
  // here on purpose until L-1 makes their length a design property.
  // Literal titles rather than a loop: docs/ACCEPTANCE.md names these tests,
  // and npm run acceptance:check looks for the exact words.
  async function wordsOn(page: Page, path: string): Promise<number> {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const words = await page.evaluate(() => {
      const main = document.querySelector("main");
      return main ? (main.innerText.match(/\S+/g) ?? []).length : 0;
    });
    expect(words).toBeGreaterThan(0);
    return words;
  }

  test("the dashboard stays within 600 words", async ({ page }) => {
    expect(await wordsOn(page, "/dashboard")).toBeLessThanOrEqual(600);
  });

  test("the open-a-matter shortcut stays within 600 words", async ({ page }) => {
    expect(await wordsOn(page, "/start")).toBeLessThanOrEqual(600);
  });

  test("the settings profile stays within 700 words", async ({ page }) => {
    expect(await wordsOn(page, "/settings")).toBeLessThanOrEqual(700);
  });

  test("the confidentiality register stays within 2000 words", async ({ page }) => {
    // A reference document, read once and slowly — its budget says so.
    expect(await wordsOn(page, "/settings?section=confidentiality")).toBeLessThanOrEqual(2000);
  });
});
