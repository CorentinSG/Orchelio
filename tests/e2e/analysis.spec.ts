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
    .getByRole("navigation", { name: "Matter sections" })
    .getByRole("link", { name: "AI Analysis" })
    .click();
  await expect(page.getByRole("region", { name: "Claude Analyst" })).toBeVisible();

  await page.getByRole("button", { name: /^Run analysis$|^Run again$/ }).click();
  await page.waitForURL(/tab=analysis/);
  await expect(page.getByRole("region", { name: "Summary" })).toBeVisible();
}

test.describe("Running an analysis", () => {
  test("says it is simulated, and that no charge is incurred", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-001");
    await page
      .getByRole("navigation", { name: "Matter sections" })
      .getByRole("link", { name: "AI Analysis" })
      .click();

    const panel = page.getByRole("region", { name: "Claude Analyst" });
    await expect(panel).toContainText(/Simulated in this build/i);
    await expect(panel).toContainText(/No API call is made/i);
  });

  test("carries every standing caution before any finding", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-001");

    const warnings = page.getByText("Read this first").locator("..");
    await expect(warnings).toContainText(/A person must read this/i);
    await expect(warnings).toContainText(/No document was opened/i);
    await expect(warnings).toContainText(/no date here is confirmed/i);
  });

  test("names the features this firm asked for, and those it did not", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-001");
    await page
      .getByRole("navigation", { name: "Matter sections" })
      .getByRole("link", { name: "AI Analysis" })
      .click();

    const panel = page.getByRole("region", { name: "Claude Analyst" });
    await expect(panel).toContainText(/This firm asked Claude for:/);
    // The demonstration firms did not enable entity extraction, so the key
    // facts section is genuinely absent — and the page says why rather than
    // leaving a reader to wonder whether it broke.
    await expect(panel).toContainText(/Not asked for, and so not produced:/);
  });
});

test.describe("The Moreau matter — a contradiction", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-002");
  });

  test("shows both dates side by side, with where each came from", async ({ page }) => {
    const section = page.getByRole("region", { name: /^Disagreements on the record/ });

    await expect(section).toBeVisible();
    await expect(section).toContainText("Date of last entry");
    await expect(section).toContainText("11 February 2024");
    await expect(section).toContainText("4 March 2024");
    // Each account says where it came from, so a reader can weigh them.
    await expect(section).toContainText("Recorded on the matter");
    await expect(section).toContainText("Document on file");
    await expect(section).toContainText("i94-moreau-entry-2024-03-04.pdf");
  });

  test("refuses to say which is right", async ({ page }) => {
    const section = page.getByRole("region", { name: /^Disagreements on the record/ });

    await expect(section).toContainText(/a question for the client/i);
    await expect(page.locator("main")).not.toContainText(/the correct date is/i);
  });

  test("asks the client rather than deciding", async ({ page }) => {
    await expect(page.getByRole("region", { name: "To ask the client" })).toContainText(
      /Date of last entry/,
    );
  });

  test("says a person must review it, in the page and not only the schema", async ({ page }) => {
    const review = page.getByRole("region", { name: "Independent review" });

    await expect(review).toBeVisible();
    await expect(review).toContainText("Human review required");
  });

  test("shows every check the reviewer ran, not only its failures", async ({ page }) => {
    const review = page.getByRole("region", { name: "Independent review" });

    await expect(review).toContainText(/of \d+ passed/);
    await expect(review).toContainText("Disagreements on the record are all reported");
    await expect(review).toContainText("No legal conclusion, recommendation or confirmed deadline");
  });
});

test.describe("The Hassan matter — not enough on file", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-003");
  });

  test("says more information is required, and reaches no conclusion", async ({ page }) => {
    await expect(page.getByRole("region", { name: "Summary" })).toContainText(
      /More information is required/i,
    );
    await expect(page.getByRole("region", { name: "Independent review" })).toContainText(
      /More information required/i,
    );
  });

  test("says that is about the file, not about the client", async ({ page }) => {
    await expect(page.locator("main")).toContainText(/not about the client/i);
  });

  test("lists what is absent with why it matters, never what its absence proves", async ({
    page,
  }) => {
    const missing = page.getByRole("region", { name: /^Documents not on file/ });

    await expect(missing).toBeVisible();
    await expect(missing).toContainText("I-94");
    await expect(missing).not.toContainText(/will fail|cannot succeed|fatal/i);
  });
});

test.describe("The timeline", () => {
  test("says which dates a person stated and which were read", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-002");

    await page
      .getByRole("navigation", { name: "Matter sections" })
      .getByRole("link", { name: "Timeline" })
      .click();

    const timeline = page.getByRole("region", { name: "Timeline" });
    await expect(timeline).toContainText(/No date here is confirmed/i);
    await expect(timeline).toContainText(/Stated by a person/i);
    await expect(timeline).toContainText(/Read from a document/i);
  });

  test("is empty, and says so, before anything has been run", async ({ page }) => {
    // A matter no other spec analyses, so it has no timeline of its own.
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/matters/new");
    await page.getByLabel("Matter title").fill("Untouched, for the timeline test");
    await page.getByLabel("Client name").fill("Timeline Fixture");
    await page.getByRole("button", { name: "Create matter" }).click();
    await page.waitForURL(/\/matters\/[0-9a-f-]{36}/);
    await page
      .getByRole("navigation", { name: "Matter sections" })
      .getByRole("link", { name: "Timeline" })
      .click();

    // A matter with no analysis says so, rather than showing a blank panel.
    const timeline = page.getByRole("region", { name: "Timeline" });
    await expect(timeline).toContainText(/No timeline yet|No date on this matter/i);
  });
});

test.describe("The AI workspace", () => {
  test("states plainly that nothing leaves the machine", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/ai");

    await expect(page.getByRole("heading", { name: "AI Workspace", level: 1 })).toBeVisible();
    await expect(page.locator("main")).toContainText(/No request leaves this machine/i);
    await expect(page.locator("main")).toContainText(/no charge is incurred/i);
    await expect(page.locator("main")).toContainText(/No document is ever opened/i);
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

    const usage = page.getByRole("region", { name: "Simulated usage" });
    await expect(usage).toContainText("every record is simulated");
  });

  test("names what Claude may never do", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/ai");

    const locked = page.getByRole("region", { name: "What Claude may never do here" });
    await expect(locked).toContainText(/eligibility conclusion/i);
    await expect(locked).toContainText(/Confirm a deadline/i);
    await expect(locked).toContainText(/9 locked rules/i);
  });
});

test.describe("What each role may do", () => {
  test("a read-only reviewer may look but not run", async ({ page }) => {
    await signIn(page, "reviewer@demo.local");
    await page
      .getByRole("region", { name: "Your firms" })
      .getByRole("button", { name: /Dupont Immigration Law/ })
      .click();
    await expect(page.getByRole("heading", { name: "Dupont Immigration Law" })).toBeVisible();

    await openMatter(page, "IMM-2026-001");
    await page
      .getByRole("navigation", { name: "Matter sections" })
      .getByRole("link", { name: "AI Analysis" })
      .click();

    await expect(page.getByRole("region", { name: "Claude Analyst" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Run analysis|Run again/ })).toHaveCount(0);
  });

  test("and is refused by the server, not only by a hidden button", async ({ page }) => {
    await signIn(page, "reviewer@demo.local");
    await page
      .getByRole("region", { name: "Your firms" })
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

    await expect(page.getByRole("region", { name: "Summary" })).toBeVisible();
  });
});

test.describe("Cross-firm", () => {
  test("an analysis cannot be run on another firm's matter", async ({ page }) => {
    // Learn a real identifier honestly, in the firm that owns it.
    await signIn(page, "employment.attorney@demo.local");
    await openMatter(page, "EMP-2026-001");
    const foreignMatterId = page.url().split("/matters/")[1]?.split("?")[0] ?? "";

    await page.getByRole("button", { name: "Sign out" }).click();
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

    const tile = page.locator("p", { hasText: /^Claude analyses run$/ }).locator("..");
    await expect(tile.locator("p").first()).toHaveText(/^\d+$/);
    await expect(tile).toContainText(/still needs a person/i);
  });

  test("counts what is waiting for a person, now that Phase 7 has landed", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");

    const tile = page.locator("p", { hasText: /^Pending approvals$/ }).locator("..");
    await expect(tile.locator("p").first()).toHaveText(/^\d+$/);
    await expect(tile).not.toContainText(/Phase \d/);
  });
});
