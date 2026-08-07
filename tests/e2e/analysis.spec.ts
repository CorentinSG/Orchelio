import { expect, test } from "@playwright/test";

/**
 * Phase 6 acceptance, in a real browser.
 *
 * The rules are tested in `tests/unit/ai-analyst.test.ts` and the database side
 * in `tests/integration/analyses.test.ts`. What only a browser can prove is
 * that the honesty survives being rendered — that a contradiction still reads
 * as two accounts rather than one resolved fact, that a confidence figure is
 * not the loudest thing on the page, and that "human review required" is on
 * the screen and not merely in the schema.
 */

const PASSWORD = "orchelio-demo";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

async function openMatter(page: import("@playwright/test").Page, reference: string) {
  await page.goto("/matters");
  await page.getByRole("link", { name: new RegExp(reference) }).click();
  await page.waitForURL(/\/matters\/[0-9a-f-]{36}/);
}

/** Opens the AI Analysis tab and runs one if none has been run. */
async function runAnalysis(page: import("@playwright/test").Page, reference: string) {
  await openMatter(page, reference);
  await page
    .getByRole("navigation", { name: "Sections du dossier" })
    .getByRole("link", { name: "Analyse" })
    .click();
  await expect(page.getByRole("region", { name: "Analyste" })).toBeVisible();

  await page.getByRole("button", { name: /^Lancer l’analyse$|^Relancer l’analyse$/ }).click();
  await page.waitForURL(/tab=analysis/);
  await expect(page.getByRole("region", { name: "Résumé" })).toBeVisible();
}

test.describe("Running an analysis", () => {
  test("says it is simulated, and that no charge is incurred", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-001");
    await page
      .getByRole("navigation", { name: "Sections du dossier" })
      .getByRole("link", { name: "Analyse" })
      .click();

    const panel = page.getByRole("region", { name: "Analyste" });
    await expect(panel).toContainText(/Simulé dans cette version/i);
    await expect(panel).toContainText(/Aucun appel d’API n’est émis/i);
  });

  test("carries every standing caution before any finding", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-001");

    const warnings = page.getByText("À lire d’abord").locator("..");
    await expect(warnings).toContainText(/Une personne doit le lire/i);
    await expect(warnings).toContainText(/Aucun document n’a été ouvert/i);
    await expect(warnings).toContainText(/aucune date ici n’est confirmée/i);
  });

  test("names the features this firm asked for, and those it did not", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-001");
    await page
      .getByRole("navigation", { name: "Sections du dossier" })
      .getByRole("link", { name: "Analyse" })
      .click();

    const panel = page.getByRole("region", { name: "Analyste" });
    await expect(panel).toContainText(/Ce cabinet a demandé à l’assistant :/);
    // The demonstration firms did not enable entity extraction, so the key
    // facts section is genuinely absent — and the page says why rather than
    // leaving a reader to wonder whether it broke.
    await expect(panel).toContainText(/Non demandé, donc non produit :/);
  });
});

test.describe("The Moreau matter — a contradiction", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-002");
  });

  test("shows both dates side by side, with where each came from", async ({ page }) => {
    const section = page.getByRole("region", { name: /^Désaccords au dossier/ });

    await expect(section).toBeVisible();
    await expect(section).toContainText("Date de dernière entrée");
    await expect(section).toContainText("11 février 2024");
    await expect(section).toContainText("4 mars 2024");
    // Each account says where it came from, so a reader can weigh them.
    await expect(section).toContainText("Enregistré sur la fiche");
    await expect(section).toContainText("Document au dossier");
    await expect(section).toContainText("i94-moreau-entry-2024-03-04.pdf");
  });

  test("refuses to say which is right", async ({ page }) => {
    const section = page.getByRole("region", { name: /^Désaccords au dossier/ });

    await expect(section).toContainText(/une question pour le client/i);
    await expect(page.locator("main")).not.toContainText(/la date correcte est|la bonne date est/i);
  });

  test("asks the client rather than deciding", async ({ page }) => {
    await expect(page.getByRole("region", { name: "À demander au client" })).toContainText(
      /date de dernière entrée/i,
    );
  });

  test("says a person must review it, in the page and not only the schema", async ({ page }) => {
    const review = page.getByRole("region", { name: "Relecture indépendante" });

    await expect(review).toBeVisible();
    await expect(review).toContainText("À lire par une personne — obligatoire");
  });

  test("shows every check the reviewer ran, not only its failures", async ({ page }) => {
    const review = page.getByRole("region", { name: "Relecture indépendante" });

    await expect(review).toContainText(/sur \d+ réussis/);
    await expect(review).toContainText("Tous les désaccords du dossier sont signalés");
    await expect(review).toContainText("Aucune conclusion juridique, recommandation ni échéance confirmée");
  });
});

test.describe("The Hassan matter — not enough on file", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-003");
  });

  test("says more information is required, and reaches no conclusion", async ({ page }) => {
    await expect(page.getByRole("region", { name: "Résumé" })).toContainText(
      /informations supplémentaires sont requises/i,
    );
    await expect(page.getByRole("region", { name: "Relecture indépendante" })).toContainText(
      /Informations supplémentaires requises/i,
    );
  });

  test("says that is about the file, not about the client", async ({ page }) => {
    await expect(page.locator("main")).toContainText(/pas sur (le client|la position du client)/i);
  });

  test("lists what is absent with why it matters, never what its absence proves", async ({
    page,
  }) => {
    const missing = page.getByRole("region", { name: /^Documents absents du dossier/ });

    await expect(missing).toBeVisible();
    await expect(missing).toContainText("I-94");
    await expect(missing).not.toContainText(/échouera|ne peut pas réussir|fatal/i);
  });
});

test.describe("The timeline", () => {
  test("says which dates a person stated and which were read", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-002");

    await page
      .getByRole("navigation", { name: "Sections du dossier" })
      .getByRole("link", { name: "Chronologie" })
      .click();

    const timeline = page.getByRole("region", { name: "Chronologie" });
    await expect(timeline).toContainText(/Aucune date ici n’est confirmée/i);
    await expect(timeline).toContainText(/Déclarée par une personne/i);
    await expect(timeline).toContainText(/Lue dans le nom d’un document/i);
  });

  test("is empty, and says so, before anything has been run", async ({ page }) => {
    // A matter no other spec analyses, so it has no timeline of its own.
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/matters/new");
    await page.getByLabel("Intitulé du dossier").fill("Untouched, for the timeline test");
    await page.getByLabel("Nom du client").fill("Timeline Fixture");
    await page.getByRole("button", { name: "Créer le dossier" }).click();
    await page.waitForURL(/\/matters\/[0-9a-f-]{36}/);
    await page
      .getByRole("navigation", { name: "Sections du dossier" })
      .getByRole("link", { name: "Chronologie" })
      .click();

    // A matter with no analysis says so, rather than showing a blank panel.
    const timeline = page.getByRole("region", { name: "Chronologie" });
    await expect(timeline).toContainText(/Pas encore de chronologie|Aucune date de ce dossier/i);
  });
});

test.describe("The AI workspace", () => {
  test("states plainly that nothing leaves the machine", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/ai");

    await expect(page.getByRole("heading", { name: "Assistant", level: 1 })).toBeVisible();
    await expect(page.locator("main")).toContainText(/Aucune requête ne quitte cette machine/i);
    await expect(page.locator("main")).toContainText(/aucun frais n’est engagé/i);
    await expect(page.locator("main")).toContainText(/Aucun document n’est jamais ouvert/i);
  });

  test("lists this firm's analyses and no other firm's", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-001");
    await page.goto("/ai");

    await expect(page.getByRole("region", { name: /^Analyses \(/ })).toContainText("IMM-2026-001");
    const body = await page.locator("main").innerText();
    expect(body).not.toContain("EMP-2026-");
  });

  test("shows the simulated usage as simulated, in the data", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-001");
    await page.goto("/ai");

    const usage = page.getByRole("region", { name: "Consommation simulée" });
    await expect(usage).toContainText("chaque enregistrement est simulé");
  });

  test("names what Claude may never do", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/ai");

    const locked = page.getByRole("region", { name: "Ce que l’assistant ne peut jamais faire ici" });
    await expect(locked).toContainText(/Conclure sur une éligibilité/i);
    await expect(locked).toContainText(/Confirmer une échéance/i);
    await expect(locked).toContainText(/9 règles verrouillées/i);
  });
});

test.describe("What each role may do", () => {
  test("a read-only reviewer may look but not run", async ({ page }) => {
    await signIn(page, "reviewer@demo.local");
    await page
      .getByRole("region", { name: "Vos cabinets" })
      .getByRole("button", { name: /Dupont Immigration Law/ })
      .click();
    await expect(page.getByRole("heading", { name: "Dupont Immigration Law" })).toBeVisible();

    await openMatter(page, "IMM-2026-001");
    await page
      .getByRole("navigation", { name: "Sections du dossier" })
      .getByRole("link", { name: "Analyse" })
      .click();

    await expect(page.getByRole("region", { name: "Analyste" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Lancer l’analyse|Relancer l’analyse/ })).toHaveCount(0);
  });

  test("and is refused by the server, not only by a hidden button", async ({ page }) => {
    await signIn(page, "reviewer@demo.local");
    await page
      .getByRole("region", { name: "Vos cabinets" })
      .getByRole("button", { name: /Dupont Immigration Law/ })
      .click();
    await expect(page.getByRole("heading", { name: "Dupont Immigration Law" })).toBeVisible();

    await openMatter(page, "IMM-2026-001");
    const matterId = page.url().split("/matters/")[1]?.split("?")[0] ?? "";

    await page.evaluate((id) => {
      const form = document.createElement("form");
      form.method = "post";
      form.action = "/api/ai/analyse";
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "matterId";
      input.value = id;
      form.append(input);
      document.body.append(form);
      form.submit();
    }, matterId);

    await expect(page).toHaveURL(/\/403/);
  });

  test("a paralegal may run one", async ({ page }) => {
    await signIn(page, "immigration.paralegal@demo.local");
    await runAnalysis(page, "IMM-2026-001");

    await expect(page.getByRole("region", { name: "Résumé" })).toBeVisible();
  });
});

test.describe("Cross-firm", () => {
  test("an analysis cannot be run on another firm's matter", async ({ page }) => {
    // Learn a real identifier honestly, in the firm that owns it.
    await signIn(page, "employment.attorney@demo.local");
    await openMatter(page, "EMP-2026-001");
    const foreignMatterId = page.url().split("/matters/")[1]?.split("?")[0] ?? "";

    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/matters");

    await page.evaluate((id) => {
      const form = document.createElement("form");
      form.method = "post";
      form.action = "/api/ai/analyse";
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "matterId";
      input.value = id;
      form.append(input);
      document.body.append(form);
      form.submit();
    }, foreignMatterId);

    await expect(page).toHaveURL(/\/403/);
  });
});

test.describe("The dashboard", () => {
  test("counts analyses now that they exist", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-001");
    await page.goto("/dashboard");

    const tile = page.locator("p", { hasText: /^Analyses de l’assistant$/ }).locator("..");
    await expect(tile.locator("p").first()).toHaveText(/^\d+$/);
    await expect(tile).toContainText(/attend encore une personne/i);
  });

  test("counts what is waiting for a person, now that Phase 7 has landed", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");

    const tile = page.locator("p", { hasText: /^Validations en attente$/ }).locator("..");
    await expect(tile.locator("p").first()).toHaveText(/^\d+$/);
    await expect(tile).not.toContainText(/Phase \d/);
  });
});
