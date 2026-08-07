import { expect, test } from "@playwright/test";

/**
 * Orchelio — the short way in, in a real browser.
 *
 * The claim this screen makes is not "it is fewer clicks". It is that a person
 * who does not think of themselves as a computer person can predict what one
 * button will do before pressing it, and can see afterwards what each part of
 * it did. Both halves are only provable by rendering the thing.
 */

test.describe.configure({ mode: "serial" });

const PASSWORD = "orchelio-demo";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/**
 * A hand-built form post carrying the browser's real session.
 *
 * `page.request.post` does not send a `Secure` cookie over http, so a request
 * built that way arrives signed out and would pass on a redirect to /login
 * while proving nothing about the permission it claims to check.
 */
async function postForm(
  page: import("@playwright/test").Page,
  path: string,
  fields: Record<string, string>,
) {
  return page.evaluate(
    async ([target, body]) => {
      const response = await fetch(target as string, {
        method: "POST",
        body: new URLSearchParams(body as Record<string, string>),
        credentials: "same-origin",
      });
      return { url: response.url, status: response.status };
    },
    [path, fields] as const,
  );
}

test.describe("Before the button is pressed", () => {
  test("says what each of the four steps will do", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/start");

    const steps = page.getByRole("region", { name: /^What happens when you press/ });
    await expect(steps).toContainText("A matter is opened");
    await expect(steps).toContainText("Your files are listed");
    await expect(steps).toContainText("Orchelio reads what you have entered");
    await expect(steps).toContainText("Nothing is decided");
  });

  test("says the file itself never leaves the computer, where the decision is made", async ({
    page,
  }) => {
    // The sentence belongs beside the drop zone, not on a settings page a
    // solicitor will never open.
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/start");

    await expect(page.getByRole("main")).toContainText(/stay on your computer/i);
    await expect(page.getByRole("main")).toContainText(/never opens one/i);
  });

  test("asks four things, not a dozen", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/start");

    await expect(page.getByLabel("Who is the client?")).toBeVisible();
    await expect(page.getByLabel("What is it about?")).toBeVisible();
    await expect(page.getByLabel("Which kind of matter?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open the matter" })).toBeVisible();
  });

  test("offers only the kinds of matter this firm handles", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/start");

    const options = await page.getByLabel("Which kind of matter?").locator("option").allTextContents();
    expect(options.length).toBeGreaterThan(0);
    // An immigration firm is never offered an employment matter type.
    expect(options.join(" ")).not.toMatch(/wrongful termination|wage/i);
  });
});

test.describe("Pressing it once", () => {
  test("opens the matter, lists the files and reads it, then says so", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/start");

    await page.getByLabel("Who is the client?").fill("Priya Raman");
    await page.getByLabel("What is it about?").fill("Spouse petition — first review");
    await page.getByLabel("Choose documents").setInputFiles([
      { name: "passport-raman.pdf", mimeType: "application/pdf", buffer: Buffer.from("x") },
      { name: "i94-raman.pdf", mimeType: "application/pdf", buffer: Buffer.from("y") },
    ]);
    await page.getByRole("button", { name: "Open the matter" }).click();

    await page.waitForURL(/\/matters\/[0-9a-f-]{36}/);

    // One press, three things done, and the page says how many of each.
    // Located by its words rather than by a landmark: the arrival notice is a
    // callout, and a callout is deliberately not a region — only the
    // demonstration banner is, so screen-reader users get one named area to
    // skip rather than a page full of them.
    const main = page.getByRole("main");
    await expect(main).toContainText("Le dossier est ouvert");
    await expect(main).toContainText(/IMM-\d{4}-\d{3}/);
    await expect(main).toContainText("2 fichiers y sont répertoriés");
    await expect(main).toContainText(/Rien n’a été décidé/i);

    // It landed on the analysis, because there is one to read.
    await expect(page).toHaveURL(/tab=analysis/);
    await expect(main).toContainText(/Personne n’a encore validé ceci/i);

    // Both files are on the matter it just opened — checked here rather than
    // by searching the matter list for a title, because a firm may legitimately
    // open two matters with the same title and the test must not depend on
    // which one it finds.
    const matterUrl = page.url().split("?")[0];
    await page.goto(`${matterUrl}?tab=documents`);
    await expect(main).toContainText("passport-raman.pdf");
    await expect(main).toContainText("i94-raman.pdf");
  });

  test("leaves the analysis waiting for a person, like any other", async ({ page }) => {
    // The short way in grants no shortcut past the approval. Whatever it
    // raised is in the queue with everything else.
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/approvals?action=legal_analysis");

    await expect(page.getByRole("region", { name: /^Waiting for a decision/ })).toContainText(
      "Rely on an AI analysis",
    );
  });
});

test.describe("What it refuses", () => {
  test("tells a read-only reviewer who can open one instead", async ({ page }) => {
    await signIn(page, "reviewer@demo.local");
    await page.goto("/start");

    await expect(page.getByRole("main")).toContainText(/attorneys and firm administrators/i);
    await expect(page.getByRole("button", { name: "Open the matter" })).toHaveCount(0);
  });

  test("refuses that reviewer on the server, not only on the screen", async ({ page }) => {
    await signIn(page, "reviewer@demo.local");
    await page.goto("/start");

    const result = await postForm(page, "/api/start", {
      clientName: "Forged Client",
      title: "Should not exist",
      matterTypeKey: "family_based",
    });
    expect(result.url).toContain("/403");
  });

  test("refuses a kind of matter this firm does not handle", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/start");

    const result = await postForm(page, "/api/start", {
      clientName: "Wrong Area",
      title: "An employment matter at an immigration firm",
      matterTypeKey: "wrongful_termination",
    });

    await page.goto(result.url);
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      /not a kind of matter this firm handles/i,
    );
  });
});
