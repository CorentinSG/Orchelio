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
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
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
  await page.getByRole("button", { name: "Continue" }).click();
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
    await expect(page.getByText("Step 1 of 7 — Firm details")).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  test("the browser stops an empty required answer", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/onboarding/1");

    await page.getByLabel("Firm name").fill("");
    await continueStep(page);

    // Still on step 1: the browser refused to submit.
    await expect(page).toHaveURL(/\/onboarding\/1/);
    await expect(page.getByLabel("Firm name")).toHaveJSProperty("validity.valid", false);
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
    await page.getByLabel("Firm name").fill("");
    await continueStep(page);

    await expect(page.getByText("Enter a firm name.")).toBeVisible();
  });

  test("refuses a main practice area that has no template", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/onboarding/2");

    // Family Law is offered — the product is meant to grow into it — but it
    // cannot yet be a firm's main area, and saying so is better than pretending.
    await expect(page.getByText("Template coming soon.").first()).toBeVisible();
  });

  test("saves a draft and comes back to it", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/onboarding/1");

    await page.getByLabel("Firm administrator").fill("Claire Dupont");
    await page.getByRole("button", { name: "Save as draft" }).click();

    await expect(page.getByText("Draft saved")).toBeVisible();

    await page.goto("/onboarding/1");
    await expect(page.getByLabel("Firm administrator")).toHaveValue("Claire Dupont");
  });

  test("reproduces the published immigration configuration", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");

    // Step 1
    await page.goto("/onboarding/1");
    await page.getByLabel("Firm name").fill("Dupont Immigration Law");
    await page.getByLabel("Firm administrator").fill("Claire Dupont");
    await page.getByLabel("Email address").fill("claire@demo.local");
    await continueStep(page);

    // Step 2
    await expect(page.getByText("Step 2 of 7")).toBeVisible();
    await uncheckAll(page, "practiceAreas");
    await check(page, "Immigration Law");
    await page.getByLabel("Main practice area").selectOption("immigration");
    await continueStep(page);

    // Step 3
    await expect(page.getByText("Step 3 of 7")).toBeVisible();
    await uncheckAll(page, "matterTypes");
    await check(page, "Family-based immigration");
    await check(page, "Employment-based immigration");
    await check(page, "Naturalisation");
    await continueStep(page);

    // Step 4
    await expect(page.getByText("Step 4 of 7")).toBeVisible();
    await uncheckAll(page, "workflowStepIds");
    await check(page, /^Lead intake/);
    await check(page, /^Conflict check/);
    await check(page, /^Initial consultation/);
    await check(page, /^Document collection/);
    await continueStep(page);

    // Step 5
    await expect(page.getByText("Step 5 of 7")).toBeVisible();
    await uncheckAll(page, "aiFeatureIds");
    await check(page, /^Summarise documents/);
    await check(page, /^Create a factual timeline/);
    await check(page, /^Identify missing documents/);
    await check(page, /^Detect inconsistencies/);
    await check(page, /^Prepare consultation questions/);
    await continueStep(page);

    // Step 6 — the locked rules are visible and cannot be unticked.
    await expect(page.getByText("Step 6 of 7")).toBeVisible();
    await uncheckAll(page, "approvalKeys");
    await check(page, /^Send an email/);
    await check(page, /^Create a deadline/);
    await check(page, /^Change a deadline/);
    await check(page, /^Generate legal analysis/);

    const lockedFiling = page.getByRole("checkbox", { name: /^Submit a filing/ });
    await expect(lockedFiling).toBeDisabled();
    await expect(lockedFiling).toBeChecked();
    await continueStep(page);

    // Step 7 — the summary reports what was chosen.
    await expect(page.getByText("Step 7 of 7")).toBeVisible();
    const summary = page.getByRole("region", { name: "Summary" });
    await expect(summary).toContainText("Dupont Immigration Law");
    await expect(summary).toContainText("Immigration Law");

    const matterTypesCard = page.getByRole("region", { name: "Matter types" });
    await expect(matterTypesCard).toContainText("family_based");
    await expect(matterTypesCard).toContainText("naturalisation");

    const workflowCard = page.getByRole("region", { name: "Workflow" });
    await expect(workflowCard).toContainText("Initial consultation");

    await page.getByRole("button", { name: "Confirm configuration" }).click();

    // The dashboard is now assembled from this configuration.
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Status expiration dates to review")).toBeVisible();
    await expect(page.getByText("Missing identity documents")).toBeVisible();
  });

  test("gives the same answers a different meaning at an employment firm", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");

    await page.goto("/onboarding/2");
    await uncheckAll(page, "practiceAreas");
    await check(page, "Employment & Labor Law");
    await page.getByLabel("Main practice area").selectOption("employment_law");
    await continueStep(page);

    await uncheckAll(page, "matterTypes");
    await check(page, "Unpaid wages");
    await check(page, "Workplace discrimination");
    await check(page, "Retaliation");
    await check(page, "Wrongful termination");
    await continueStep(page);

    // Identical workflow answers to the immigration firm above.
    await uncheckAll(page, "workflowStepIds");
    await check(page, /^Lead intake/);
    await check(page, /^Conflict check/);
    await check(page, /^Initial consultation/);
    await check(page, /^Document collection/);
    await continueStep(page);

    await uncheckAll(page, "aiFeatureIds");
    await check(page, /^Summarise documents/);
    await check(page, /^Create a factual timeline/);
    await check(page, /^Identify missing documents/);
    await check(page, /^Detect inconsistencies/);
    await check(page, /^Prepare interview questions/);
    await continueStep(page);

    await uncheckAll(page, "approvalKeys");
    await check(page, /^Send an email/);
    await check(page, /^Create a deadline/);
    await check(page, /^Generate legal analysis/);
    await continueStep(page);

    await page.getByRole("button", { name: "Confirm configuration" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // The same product, the same answers — a different dashboard, because the
    // questions an employment firm asks are not the ones an immigration firm asks.
    await expect(page.getByText("Termination letters to review")).toBeVisible();
    await expect(page.getByText("Wage records missing")).toBeVisible();
    await expect(page.getByText("Status expiration dates to review")).toHaveCount(0);
  });

  test("omits a widget whose AI feature the firm switched off", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");

    await page.goto("/onboarding/5");
    await page.getByRole("checkbox", { name: /^Identify missing documents/ }).uncheck();
    await continueStep(page);
    await continueStep(page);
    await page.getByRole("button", { name: "Confirm configuration" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    // A card reading "0 missing wage records" at a firm that never asked
    // Orchelio to look would read like reassurance. It is omitted instead.
    await expect(page.getByText("Wage records missing")).toHaveCount(0);

    // Restore, so the demonstration data is left as it was found.
    await page.goto("/onboarding/5");
    await page.getByRole("checkbox", { name: /^Identify missing documents/ }).check();
    await continueStep(page);
    await continueStep(page);
    await page.getByRole("button", { name: "Confirm configuration" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
