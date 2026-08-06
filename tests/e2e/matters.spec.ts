import { expect, test } from "@playwright/test";

/**
 * Phase 5 acceptance, in a real browser.
 *
 * Two things are being proved here that no unit test can prove: that the matter
 * screens are assembled from the firm's own configuration — an immigration firm
 * is asked about status and entry, an employment firm about pay and termination
 * — and that a refusal is a refusal in the browser too, not merely in the data
 * layer underneath it.
 */

const PASSWORD = "orchelio-demo";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  // Wait for the sign-in to land before doing anything else: navigating on
  // while the request is in flight races it and arrives signed out.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** Opens the matter whose reference is given, from the list. */
async function openMatter(page: import("@playwright/test").Page, reference: string) {
  await page.goto("/matters");
  await page.getByRole("link", { name: new RegExp(reference) }).click();
  // Waiting on the URL, not on a heading: the list has a heading too, so
  // "a heading is visible" is satisfied before the click has gone anywhere.
  await page.waitForURL(/\/matters\/[0-9a-f-]{36}/);
  await expect(page.getByText(reference, { exact: true })).toBeVisible();
}

/**
 * Error messages inside the page.
 *
 * Scoped to `main` on purpose: Next renders its own route announcer with
 * `role="alert"`, so an unscoped query matches two things and fails.
 */
function alerts(page: import("@playwright/test").Page) {
  return page.locator("main").getByRole("alert");
}

async function openDocumentsTab(page: import("@playwright/test").Page) {
  await page
    .getByRole("navigation", { name: "Sections du dossier" })
    .getByRole("link", { name: "Documents" })
    .click();
  await expect(page.getByRole("region", { name: /^Documents \(/ })).toBeVisible();
}

/** The list row for one document, by filename. */
function documentRow(page: import("@playwright/test").Page, filename: string) {
  return page
    .getByRole("region", { name: /^Documents \(/ })
    .locator("li")
    .filter({ hasText: filename })
    .first();
}

test.describe("The matter list", () => {
  test("shows an immigration firm only its own matters", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/matters");

    await expect(page.getByRole("heading", { name: "Dossiers", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /IMM-2026-001/ })).toBeVisible();

    // The employment firm's references exist in the same database.
    const body = await page.locator("main").innerText();
    expect(body).not.toContain("EMP-2026-");
  });

  test("shows an employment firm only its own matters", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/matters");

    await expect(page.getByRole("link", { name: /EMP-2026-001/ })).toBeVisible();

    const body = await page.locator("main").innerText();
    expect(body).not.toContain("IMM-2026-");
  });

  test("offers the side filter to an employment firm and not to an immigration one", async ({
    page,
  }) => {
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/matters");
    await expect(page.getByLabel("Representing")).toBeVisible();

    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/matters");
    await expect(page.getByLabel("Representing")).toHaveCount(0);
  });

  test("filters on the server, and the filter survives in the address bar", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/matters");

    // Both are visible unfiltered. Counting every matter instead would be a
    // test that other tests in this file can change underneath it.
    await expect(page.getByRole("link", { name: /IMM-2026-001/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /IMM-2026-002/ })).toBeVisible();

    await page.getByLabel("Search").fill("Moreau");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/[?&]q=Moreau/);
    await expect(page.getByRole("link", { name: /IMM-2026-002/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /IMM-2026-001/ })).toHaveCount(0);

    await page.getByRole("link", { name: "Clear" }).click();
    await expect(page).toHaveURL(/\/matters$/);
    await expect(page.getByRole("link", { name: /IMM-2026-001/ })).toBeVisible();
  });

  test("offers only the matter types this firm enabled", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/matters");

    const options = await page.getByLabel("Matter type").locator("option").allInnerTexts();

    expect(options.length).toBeGreaterThan(1);
    // Employment types belong to the other firm's configuration entirely.
    expect(options.join(" ")).not.toContain("Unpaid wages");
  });

  test("says nothing matched rather than showing an empty table", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/matters?q=zzzznotamatter");

    await expect(page.getByText("No matter in this firm matches those filters.")).toBeVisible();
  });
});

test.describe("A matter record", () => {
  test("shows the immigration fields, and none of the employment ones", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-001");

    const body = await page.locator("main").innerText();
    // Labels unique to this area — "Employer" appears in both, so it proves
    // nothing.
    expect(body).toContain("Status expiration date");
    expect(body).toContain("I-94 available");
    expect(body).not.toContain("Alleged unpaid hours");
    expect(body).not.toContain("Exempt or non-exempt");
  });

  test("shows the employment fields, and none of the immigration ones", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await openMatter(page, "EMP-2026-001");

    const body = await page.locator("main").innerText();
    expect(body).toContain("Alleged unpaid hours");
    expect(body).toContain("Exempt or non-exempt");
    expect(body).not.toContain("Status expiration date");
    expect(body).not.toContain("I-94 available");
  });

  test("moves between the tabs, all of which now exist", async ({
    page,
  }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-001");

    const tabs = page.getByRole("navigation", { name: "Sections du dossier" });
    // All nine exist as of Phase 7. None is a placeholder any more.
    for (const label of ["Vue d’ensemble", "Chronologie", "Analyse", "Courriers", "Validations"]) {
      await expect(tabs.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await expect(tabs).not.toContainText(/Phase \d/);

    await tabs.getByRole("link", { name: "Documents" }).click();
    await expect(page.getByRole("region", { name: /^Documents \(/ })).toBeVisible();

    await tabs.getByRole("link", { name: "Tâches" }).click();
    await expect(page.getByRole("region", { name: /^Tâches \(/ })).toBeVisible();

    await tabs.getByRole("link", { name: "Questionnaire client" }).click();
    await expect(page.getByRole("region", { name: "Questionnaire client" })).toBeVisible();
  });

  test("presents intake answers as the client's words, not as fact", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-002");
    await page
      .getByRole("navigation", { name: "Sections du dossier" })
      .getByRole("link", { name: "Questionnaire client" })
      .click();

    await expect(page.getByText("What the client said")).toBeVisible();
    await expect(page.getByText(/not verified/)).toBeVisible();
  });

  test("lists expected documents that are not on file, without calling it a problem", async ({
    page,
  }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-003");

    const checklist = page.getByRole("region", {
      name: "Expected documents not yet received",
    });
    await expect(checklist).toBeVisible();
    await expect(checklist).toContainText("Not received");
    // A checklist, not a conclusion — and it says so, pointing at the analysis
    // for the reasons rather than stating them here.
    await expect(checklist).toContainText(/read by a person before it is used/i);
    await expect(checklist).not.toContainText(/will fail|cannot succeed|fatal/i);
  });

  test("refuses another firm's matter as though it did not exist", async ({ page }) => {
    // Learn a real identifier the honest way, in the firm that owns it.
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/matters");
    await page.getByRole("link", { name: /EMP-2026-001/ }).click();
    await page.waitForURL(/\/matters\/[0-9a-f-]{36}/);
    const employmentMatterUrl = page.url();

    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await signIn(page, "immigration.attorney@demo.local");

    const response = await page.goto(employmentMatterUrl);

    // 404, not 403: a distinct refusal would confirm the matter exists.
    expect(response?.status()).toBe(404);
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("EMP-2026-001");
  });
});

test.describe("Creating a matter", () => {
  test("assigns a reference and lands on the new matter", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/matters/new");

    await page.getByLabel("Matter title").fill("Naturalisation — fictional applicant");
    await page.getByLabel("Client name").fill("Test Client Playwright");
    await page.getByRole("button", { name: "Create matter" }).click();

    await page.waitForURL(/\/matters\/[0-9a-f-]{36}/);
    await expect(
      page.getByRole("heading", { name: "Naturalisation — fictional applicant" }),
    ).toBeVisible();
    // Sequential within the firm, assigned by the server.
    await expect(page.getByText(/^IMM-\d{4}-\d{3}$/)).toBeVisible();
  });

  test("asks an employment firm which side it acts for", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/matters/new");

    await expect(page.getByLabel("Matter title")).toBeVisible();
    await expect(page.getByLabel("Representing", { exact: true })).toBeVisible();
    // The immigration questions are absent entirely.
    const body = await page.locator("main").innerText();
    expect(body).not.toContain("Status expiration date");
    expect(body).not.toContain("I-94 available");
  });

  test("refuses a title the browser was told to skip", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/matters/new");

    // Strip the browser's own validation, so the server's answer is what is
    // being tested rather than the browser's willingness to submit.
    await page.evaluate(() => {
      document
        .querySelectorAll<HTMLElement>("[required]")
        .forEach((element) => element.removeAttribute("required"));
    });
    await page.getByRole("button", { name: "Create matter" }).click();

    await expect(alerts(page)).toContainText("Give the matter a title.");
  });

  test("refuses a matter type this firm does not handle", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/matters/new");

    await page.getByLabel("Matter title").fill("Injected type");
    await page.getByLabel("Client name").fill("Test Client Playwright");
    // Rewrite the select to the other firm's type, exactly as somebody with
    // developer tools would.
    await page.evaluate(() => {
      const select = document.querySelector<HTMLSelectElement>('select[name="matterTypeKey"]');
      if (select) {
        const option = document.createElement("option");
        option.value = "unpaid_wages";
        select.append(option);
        select.value = "unpaid_wages";
      }
    });
    await page.getByRole("button", { name: "Create matter" }).click();

    await expect(alerts(page)).toContainText("Choose a matter type this firm handles.");
  });
});

test.describe("Documents", () => {
  test("records a chosen file's name without uploading it", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-001");
    await openDocumentsTab(page);

    await page.getByLabel("Choose a document").setInputFiles({
      name: "fictional-passport.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("fictional content, never uploaded"),
    });
    await expect(page.getByText("fictional-passport.pdf").first()).toBeVisible();

    // "Other" is expected for nothing, so this upload cannot change the
    // missing-document checklist another test reads.
    await page.getByLabel("What kind of document is it?").selectOption("other");
    await page.getByRole("button", { name: "Add document" }).click();
    await page.waitForURL(/tab=documents/);

    await expect(page.getByText("Document recorded")).toBeVisible();

    // `.first()` throughout: this test adds a row every time it runs, and the
    // demonstration database is not reset between runs.
    const row = documentRow(page, "fictional-passport.pdf");
    await expect(row).toBeVisible();
    // A new document has been seen by nobody yet.
    await expect(row.getByText("Not verified")).toBeVisible();
  });

  test("refuses a file type the specification does not allow", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-001");
    await openDocumentsTab(page);

    await page.getByLabel("Choose a document").setInputFiles({
      name: "script.exe",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("no"),
    });

    await expect(alerts(page)).toContainText("That file is .exe");
    await expect(page.getByRole("button", { name: "Add document" })).toBeDisabled();
  });

  test("refuses a hand-crafted post that skips the browser's checks", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-001");
    await openDocumentsTab(page);

    // Fill the hidden fields directly with something the browser copy would
    // have rejected, and submit. Only the server's answer is under test.
    await page.evaluate(() => {
      const form = document.querySelector<HTMLFormElement>('form[action="/api/documents"]');
      if (!form) return;
      const set = (name: string, value: string) => {
        const input = form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
        if (input) input.value = value;
      };
      set("filename", "malware.exe");
      set("sizeBytes", "1024");
      set("mimeType", "application/pdf");
      form.submit();
    });

    await expect(alerts(page)).toContainText("That document was not added");
    await expect(alerts(page)).toContainText("pdf");
    const body = await page.locator("main").innerText();
    expect(body).not.toContain("malware.exe");
  });

  test("marks a document as checked by a person", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-003");
    await openDocumentsTab(page);

    // Add the document this test will then verify, rather than verifying one
    // from the seed: verifying is permanent, so a test that consumed a seeded
    // document would pass once and fail on every later run.
    await page.getByLabel("Choose a document").setInputFiles({
      name: "to-be-checked.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("fictional"),
    });
    await page.getByLabel("What kind of document is it?").selectOption("other");
    await page.getByRole("button", { name: "Add document" }).click();
    await page.waitForURL(/tab=documents/);

    const row = documentRow(page, "to-be-checked.pdf");
    await expect(row.getByText("Not verified")).toBeVisible();

    await row.getByRole("button", { name: "Mark as checked" }).click();
    await page.waitForURL(/tab=documents/);

    await expect(documentRow(page, "to-be-checked.pdf").getByText("Checked by a person")).toBeVisible();
  });

  test("states plainly that nothing is uploaded or read", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-001");
    await openDocumentsTab(page);

    await expect(page.getByText(/the file stays on your computer/i)).toBeVisible();
    await expect(page.getByText(/there is no OCR in this build/i)).toBeVisible();
  });
});

test.describe("What each role may do", () => {
  test("a paralegal is not offered matter creation, and is refused the page", async ({ page }) => {
    await signIn(page, "immigration.paralegal@demo.local");
    await page.goto("/matters");

    // The button is absent — but that is decoration, so the page itself is
    // requested directly.
    await expect(page.getByRole("link", { name: "New matter" })).toHaveCount(0);

    await page.goto("/matters/new");
    await expect(page).toHaveURL(/\/403/);
  });

  test("a paralegal may still add documents", async ({ page }) => {
    await signIn(page, "immigration.paralegal@demo.local");
    await openMatter(page, "IMM-2026-001");
    await openDocumentsTab(page);

    await expect(page.getByRole("region", { name: "Add a document" })).toBeVisible();
  });

  test("a read-only reviewer sees the matter but is not offered an upload", async ({ page }) => {
    await signIn(page, "reviewer@demo.local");
    await page
      .getByRole("region", { name: "Your firms" })
      .getByRole("button", { name: /Dupont Immigration Law/ })
      .click();
    await expect(page.getByRole("heading", { name: "Dupont Immigration Law" })).toBeVisible();

    await openMatter(page, "IMM-2026-001");
    await openDocumentsTab(page);

    await expect(page.getByRole("region", { name: "Add a document" })).toHaveCount(0);
    await expect(page.getByText("Read only")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark as checked" })).toHaveCount(0);
  });

  test("the read-only reviewer's upload is refused by the server, not only hidden", async ({
    page,
  }) => {
    await signIn(page, "reviewer@demo.local");
    await page
      .getByRole("region", { name: "Your firms" })
      .getByRole("button", { name: /Dupont Immigration Law/ })
      .click();
    await expect(page.getByRole("heading", { name: "Dupont Immigration Law" })).toBeVisible();

    await openMatter(page, "IMM-2026-001");
    await page.waitForURL(/\/matters\/[0-9a-f-]{36}/);
    const matterId = page.url().split("/matters/")[1]?.split("?")[0] ?? "";

    // Build the post the hidden panel would have made, and send it anyway.
    await page.evaluate((id) => {
      const form = document.createElement("form");
      form.method = "post";
      form.action = "/api/documents";
      for (const [name, value] of Object.entries({
        matterId: id,
        filename: "reviewer-upload.pdf",
        category: "passport",
        mimeType: "application/pdf",
        sizeBytes: "1024",
      })) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.append(input);
      }
      document.body.append(form);
      form.submit();
    }, matterId);

    await expect(page).toHaveURL(/\/403/);
  });
});

test.describe("The firm workspace pages", () => {
  test("the documents page lists this firm's documents only", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/documents");

    await expect(page.getByRole("heading", { name: "Documents", level: 1 })).toBeVisible();
    const body = await page.locator("main").innerText();
    expect(body).not.toContain("EMP-2026-");
  });

  test("the tasks page lists this firm's tasks only", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/tasks");

    await expect(page.getByRole("heading", { name: "Tâches", level: 1 })).toBeVisible();
    const body = await page.locator("main").innerText();
    expect(body).not.toContain("IMM-2026-");
  });

  test("the intake page lists this firm's intakes only", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/intake");

    await expect(page.getByRole("heading", { name: "Questionnaire client", level: 1 })).toBeVisible();
    const body = await page.locator("main").innerText();
    expect(body).not.toContain("EMP-2026-");
  });

  test("the dashboard counts matters now that they exist", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");

    // A number, not a dash: Phase 5 fills these.
    for (const label of [
      "Dossiers actifs",
      "Premiers contacts",
      "Documents d’identité manquants",
      "Dates d’expiration de statut à revoir",
    ]) {
      const tile = page.locator("p", { hasText: new RegExp(`^${label}$`) }).locator("..");
      await expect(tile, label).toBeVisible();
      await expect(tile.locator("p").first(), label).toHaveText(/^\d+$/);
    }
  });

  test("shows a number for every tile, now that every phase behind them has landed", async ({
    page,
  }) => {
    await signIn(page, "immigration.attorney@demo.local");

    // Through Phase 6 this asserted the opposite — a dash for the tiles waiting
    // on a later phase. Phase 7 filled the last of them. The rule it was
    // protecting (a dash, never a zero, for a figure that is not known) is
    // asserted directly in tests/unit/dashboard-widgets.test.ts.
    for (const label of ["Validations en attente", "Analyses Claude effectuées", "Dossiers actifs"]) {
      const tile = page.locator("p", { hasText: new RegExp(`^${label}$`) }).locator("..");
      await expect(tile.locator("p").first(), label).toHaveText(/^\d+$/);
      await expect(tile, label).not.toContainText(/Phase \d/);
    }
  });

  test("an employment firm's counts are its own", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");

    const tile = (label: string) =>
      page.locator("p", { hasText: new RegExp(`^${label}$`) }).locator("..");

    await expect(tile("Dossiers côté salarié").locator("p").first()).toHaveText(/^\d+$/);
    await expect(tile("Dossiers côté employeur").locator("p").first()).toHaveText(/^\d+$/);
    // The immigration firm's questions are not asked here.
    await expect(page.locator("p", { hasText: /^Premiers contacts$/ })).toHaveCount(0);
  });
});
