import { expect, test } from "@playwright/test";

/**
 * Phase 4 acceptance, in a real browser.
 *
 * Walking through the seven steps must produce the configuration the
 * specification publishes — and the same answers, given at a firm in a
 * different practice area, must produce a different one.
 *
 * These tests reconfigure the demonstration firms, so they run in series and
 * restore the configuration afterwards.
 */

const PASSWORD = "orchelio-demo";

type Page = import("@playwright/test").Page;

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  // Wait for the sign-in to actually land. Navigating on before it completes
  // races the request and arrives signed out.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

async function check(page: Page, label: string | RegExp) {
  await page.getByRole("checkbox", { name: label }).check();
}

async function uncheckAll(page: Page, name: string) {
  const boxes = page.locator(`input[type=checkbox][name="${name}"]:checked`);
  const count = await boxes.count();
  for (let index = count - 1; index >= 0; index -= 1) {
    await boxes.nth(index).uncheck();
  }
}

async function continueStep(page: Page) {
  await page.getByRole("button", { name: "Continuer" }).click();
}

test.describe.configure({ mode: "serial" });

test.describe("The seven-step questionnaire", () => {
  test("a paralegal cannot open it", async ({ page }) => {
    await signIn(page, "immigration.paralegal@demo.local");
    await page.goto("/onboarding");

    // Configuring what the firm is belongs to a firm administrator.
    await expect(page).toHaveURL(/\/403/);
  });

  test("shows progress through the seven steps", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/onboarding/1");

    await expect(page.getByRole("progressbar")).toBeVisible();
    await expect(page.getByText("Étape 1 sur 7 — Le cabinet")).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  test("the browser stops an empty required answer", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/onboarding/1");

    await page.getByLabel("Nom du cabinet").fill("");
    await continueStep(page);

    // Still on step 1: the browser refused to submit.
    await expect(page).toHaveURL(/\/onboarding\/1/);
    await expect(page.getByLabel("Nom du cabinet")).toHaveJSProperty("validity.valid", false);
  });

  test("and so does the server, when the browser is bypassed", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/onboarding/1");

    // The browser's own validation is a courtesy to the person filling the
    // form. Strip it, exactly as anyone with developer tools could, and the
    // server must still refuse.
    await page.evaluate(() => {
      document
        .querySelectorAll<HTMLInputElement>("input[required]")
        .forEach((input) => input.removeAttribute("required"));
    });
    await page.getByLabel("Nom du cabinet").fill("");
    await continueStep(page);

    await expect(page.getByText("Saisissez le nom du cabinet.")).toBeVisible();
  });

  test("refuses a main practice area that has no template", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/onboarding/2");

    // Family Law is offered — the product is meant to grow into it — but it
    // cannot yet be a firm's main area, and saying so is better than pretending.
    await expect(page.getByText("Modèle bientôt disponible.").first()).toBeVisible();
  });

  test("saves a draft and comes back to it", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/onboarding/1");

    await page.getByLabel("Administrateur du cabinet").fill("Claire Dupont");
    await page.getByRole("button", { name: "Enregistrer le brouillon" }).click();

    await expect(page.getByText("Brouillon enregistré")).toBeVisible();

    await page.goto("/onboarding/1");
    await expect(page.getByLabel("Administrateur du cabinet")).toHaveValue("Claire Dupont");
  });

  test("reproduces the published immigration configuration", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");

    // Step 1
    await page.goto("/onboarding/1");
    await page.getByLabel("Nom du cabinet").fill("Dupont Immigration Law");
    await page.getByLabel("Administrateur du cabinet").fill("Claire Dupont");
    await page.getByLabel("Adresse e-mail").fill("claire@demo.local");
    await continueStep(page);

    // Step 2
    await expect(page.getByText("Étape 2 sur 7")).toBeVisible();
    await uncheckAll(page, "practiceAreas");
    await check(page, "Droit de l’immigration");
    await page.getByLabel("Domaine principal").selectOption("immigration");
    await continueStep(page);

    // Step 3
    await expect(page.getByText("Étape 3 sur 7")).toBeVisible();
    await uncheckAll(page, "matterTypes");
    await check(page, "Regroupement familial");
    await check(page, "Immigration professionnelle");
    await check(page, "Naturalisation");
    await continueStep(page);

    // Step 4
    await expect(page.getByText("Étape 4 sur 7")).toBeVisible();
    await uncheckAll(page, "workflowStepIds");
    await check(page, /^Premier contact/);
    await check(page, /^Vérification des conflits/);
    await check(page, /^Première consultation/);
    await check(page, /^Collecte des documents/);
    await continueStep(page);

    // Step 5
    await expect(page.getByText("Étape 5 sur 7")).toBeVisible();
    await uncheckAll(page, "aiFeatureIds");
    await check(page, /^Résumer les documents/);
    await check(page, /^Établir une chronologie factuelle/);
    await check(page, /^Repérer les documents manquants/);
    await check(page, /^Détecter les incohérences/);
    await check(page, /^Préparer les questions de consultation/);
    await continueStep(page);

    // Step 6 — the locked rules are visible and cannot be unticked.
    await expect(page.getByText("Étape 6 sur 7")).toBeVisible();
    await uncheckAll(page, "approvalKeys");
    await check(page, /^Envoyer un courriel/);
    await check(page, /^Créer une échéance/);
    await check(page, /^Modifier une échéance/);
    await check(page, /^Produire une analyse juridique/);

    const lockedFiling = page.getByRole("checkbox", { name: /^Soumettre un dépôt/ });
    await expect(lockedFiling).toBeDisabled();
    await expect(lockedFiling).toBeChecked();
    await continueStep(page);

    // Step 7 — the summary reports what was chosen.
    await expect(page.getByText("Étape 7 sur 7")).toBeVisible();
    const summary = page.getByRole("region", { name: "Récapitulatif" });
    await expect(summary).toContainText("Dupont Immigration Law");
    await expect(summary).toContainText("Droit de l’immigration");

    const matterTypesCard = page.getByRole("region", { name: "Types de dossier" });
    await expect(matterTypesCard).toContainText("family_based");
    await expect(matterTypesCard).toContainText("naturalisation");

    const workflowCard = page.getByRole("region", { name: "Déroulé d’un dossier" });
    await expect(workflowCard).toContainText("Première consultation");

    await page.getByRole("button", { name: "Confirmer la configuration" }).click();

    // The dashboard is now assembled from this configuration.
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Titres arrivant à expiration")).toBeVisible();
    await expect(page.getByText("Documents d’identité manquants")).toBeVisible();
  });

  test("gives the same answers a different meaning at an employment firm", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");

    await page.goto("/onboarding/2");
    await uncheckAll(page, "practiceAreas");
    await check(page, "Droit du travail");
    await page.getByLabel("Domaine principal").selectOption("employment_law");
    await continueStep(page);

    await uncheckAll(page, "matterTypes");
    await check(page, "Salaires impayés");
    await check(page, "Discrimination au travail");
    await check(page, "Représailles");
    await check(page, "Licenciement abusif");
    await continueStep(page);

    // Identical workflow answers to the immigration firm above.
    await uncheckAll(page, "workflowStepIds");
    await check(page, /^Premier contact/);
    await check(page, /^Vérification des conflits/);
    await check(page, /^Première consultation/);
    await check(page, /^Collecte des documents/);
    await continueStep(page);

    await uncheckAll(page, "aiFeatureIds");
    await check(page, /^Résumer les documents/);
    await check(page, /^Établir une chronologie factuelle/);
    await check(page, /^Repérer les documents manquants/);
    await check(page, /^Détecter les incohérences/);
    await check(page, /^Préparer les questions d’entretien/);
    await continueStep(page);

    await uncheckAll(page, "approvalKeys");
    await check(page, /^Envoyer un courriel/);
    await check(page, /^Créer une échéance/);
    await check(page, /^Produire une analyse juridique/);
    await continueStep(page);

    await page.getByRole("button", { name: "Confirmer la configuration" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // The same product, the same answers — a different dashboard, because the
    // questions an employment firm asks are not the ones an immigration firm asks.
    await expect(page.getByText("Lettres de licenciement à examiner")).toBeVisible();
    await expect(page.getByText("Justificatifs de salaire manquants")).toBeVisible();
    await expect(page.getByText("Titres arrivant à expiration")).toHaveCount(0);
  });

  test("omits a widget whose AI feature the firm switched off", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");

    await page.goto("/onboarding/5");
    await page.getByRole("checkbox", { name: /^Repérer les documents manquants/ }).uncheck();
    await continueStep(page);
    await continueStep(page);
    await page.getByRole("button", { name: "Confirmer la configuration" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    // A card reading "0 missing wage records" at a firm that never asked
    // Orchelio to look would read like reassurance. It is omitted instead.
    await expect(page.getByText("Wage records missing")).toHaveCount(0);

    // Restore, so the demonstration data is left as it was found.
    await page.goto("/onboarding/5");
    await page.getByRole("checkbox", { name: /^Repérer les documents manquants/ }).check();
    await continueStep(page);
    await continueStep(page);
    await page.getByRole("button", { name: "Confirmer la configuration" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
