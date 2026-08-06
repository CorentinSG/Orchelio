import { expect, test } from "@playwright/test";

/**
 * Phase 8 acceptance, in a real browser.
 *
 * > A third firm can be created entirely through the interface, with no code
 * > change.
 *
 * The last test in this file is that sentence, executed: a platform
 * administrator creates a firm, its administrator signs in and answers the
 * seven questions, and the firm ends up with a working dashboard — without
 * anything being edited, seeded or run from a terminal.
 *
 * The tests before it cover what a browser can prove and the other layers
 * cannot: that the administration screens name no client data, and that a firm
 * administrator cannot reach them.
 */

test.describe.configure({ mode: "serial" });

const PASSWORD = "orchelio-demo";

/**
 * A distinct firm per run.
 *
 * A fixed name would work — the slug is made unique automatically — but the
 * account would then already exist on the second run and belong to two firms,
 * and "which firm opens after sign-in" would depend on how many times the suite
 * had been run. That is a flaky test built on purpose.
 */
function uniqueFirm() {
  const token = Math.random().toString(36).slice(2, 8);
  return {
    name: `Meridian Immigration ${token}`,
    administratorName: "Robin Meridian",
    email: `admin.${token}@meridian.local`,
  };
}

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/**
 * A form POST issued from inside the page.
 *
 * Not `page.request.post`, and the reason is measured rather than stylistic:
 * the session cookie is `Secure`, and Playwright's HTTP client applies the
 * plain specification rule and withholds it over http. Chromium sends it
 * because it treats 127.0.0.1 as a trusted origin. A request built with
 * `page.request` therefore arrives signed *out*, and the test would pass on a
 * redirect to /login while proving nothing about the permission it claims to
 * check.
 *
 * Issued through `fetch` in the page, it carries the real session — which is
 * what a hand-crafted request from a signed-in user actually looks like.
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

async function continueStep(page: import("@playwright/test").Page, nextStep: number) {
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(new RegExp(`/onboarding/${nextStep}`));
}

async function signOut(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/login|\/$/);
}

test.describe("platform administration", () => {
  test("names no matter, client or document anywhere", async ({ page }) => {
    await signIn(page, "platform.admin@demo.local");

    for (const path of ["/admin/firms", "/admin/system", "/admin/demo"]) {
      await page.goto(path);
      const text = (await page.getByRole("main").textContent()) ?? "";

      // Client names and matter titles from the seeded firms. A platform
      // administrator operates the platform; that does not include reading a
      // firm's client files.
      for (const forbidden of ["Sofia Alvarez", "Marcus Reed", "IMM-2026-001", "passport"]) {
        expect(text, `${path} leaked "${forbidden}"`).not.toContain(forbidden);
      }
    }
  });

  test("the system overview reports what it measured", async ({ page }) => {
    await signIn(page, "platform.admin@demo.local");
    await page.goto("/admin/system");

    await expect(page.getByRole("heading", { name: "System overview" })).toBeVisible();
    await expect(page.getByText("connected")).toBeVisible();
    await expect(page.getByText("simulated")).toBeVisible();
  });

  test("the demonstration screen offers no destructive control", async ({ page }) => {
    await signIn(page, "platform.admin@demo.local");
    await page.goto("/admin/demo");

    await expect(page.getByText("npm run reset-demo")).toBeVisible();
    await expect(page.getByRole("button", { name: /delete|erase|reset|wipe/i })).toHaveCount(0);
  });

  test("a firm administrator cannot reach platform administration", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");

    for (const path of ["/admin/firms", "/admin/system", "/admin/demo"]) {
      await page.goto(path);
      await expect(page, `${path} was not refused`).toHaveURL(/\/403/);
    }
  });

  test("creating a firm is refused for anyone but a platform administrator", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");

    await page.goto("/dashboard");
    const result = await postForm(page, "/api/admin/firms", {
      name: "Should Not Exist",
      primaryPracticeArea: "immigration",
      administratorName: "Nobody",
      administratorEmail: "nobody@nowhere.local",
    });

    expect(result.url).toContain("/403");
  });

  test("a firm cannot be created into a practice area with no template", async ({ page }) => {
    await signIn(page, "platform.admin@demo.local");
    await page.goto("/admin/firms");

    // The select does not offer it, so the request is built by hand: the server
    // is the copy that decides.
    const result = await postForm(page, "/api/admin/firms", {
      name: "Corporate Partners",
      primaryPracticeArea: "corporate",
      administratorName: "Nobody",
      administratorEmail: "nobody@nowhere.local",
    });

    expect(decodeURIComponent(result.url)).toContain("no template yet");
  });
});

test("a third firm can be created entirely through the interface", async ({ page }) => {
  const firm = uniqueFirm();

  // --- 1. The platform administrator creates it ----------------------------

  await signIn(page, "platform.admin@demo.local");
  await page.goto("/admin/firms");

  await page.getByLabel("Firm name").fill(firm.name);
  await page.getByLabel("Main practice area").selectOption("immigration");
  await page.getByLabel("First administrator").fill(firm.administratorName);
  await page.getByLabel("Their email").fill(firm.email);
  await page.getByRole("button", { name: "Create firm" }).click();

  await page.waitForURL(/created=/);
  // Exact: the practice-area hint on the same page also contains the words
  // "firm created", and a loose match resolves to two elements.
  await expect(page.getByText("Firm created", { exact: true })).toBeVisible();
  await expect(page.getByText(firm.email)).toBeVisible();
  await expect(page.getByRole("main")).toContainText(firm.name);

  await signOut(page);

  // --- 2. Its administrator signs in and answers the questionnaire ---------

  await signIn(page, firm.email);
  await page.goto("/onboarding/1");

  await page.getByLabel("Firm name").fill(firm.name);
  await page.getByLabel("Firm administrator").fill(firm.administratorName);
  await page.getByLabel("Email address").fill(firm.email);
  await continueStep(page, 2);

  await page.getByRole("checkbox", { name: "Immigration Law" }).check();
  await page.getByLabel("Main practice area").selectOption("immigration");
  await continueStep(page, 3);

  await page.getByRole("checkbox", { name: "Family-based immigration" }).check();
  await continueStep(page, 4);

  await page.getByRole("checkbox", { name: "Lead intake" }).check();
  await continueStep(page, 5);

  await page.getByRole("checkbox", { name: "Identify missing documents" }).check();
  await continueStep(page, 6);

  // No configurable approval rule is required — the nine locked ones are
  // enforced whatever this firm chooses, which is the point of them.
  await continueStep(page, 7);

  await page.getByRole("button", { name: "Confirm configuration" }).click();
  await page.waitForURL(/\/dashboard/);

  // --- 3. It is a working firm --------------------------------------------

  // The dashboard's heading is the firm's own name — which is exactly the
  // assertion worth making here: the workspace that opened belongs to the firm
  // that was just created, not to one that already existed.
  await expect(page.getByRole("heading", { level: 1, name: firm.name })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Immigration Law");
  await expect(page.getByRole("main")).not.toContainText("not configured yet");

  // And it holds nothing belonging to anybody else.
  await page.goto("/matters");
  await expect(page.getByRole("main")).not.toContainText("Sofia Alvarez");
  await expect(page.getByRole("main")).not.toContainText("Marcus Reed");

  // --- 4. Its own administrator can give it demonstration data -------------

  await page.goto("/settings?section=demonstration");
  const addButton = page.getByRole("button", { name: /Add \d+ sample matter/ });
  await expect(addButton).toBeVisible();
  await addButton.click();
  await page.waitForURL(/added=/);

  await page.goto("/matters");
  await expect(page.getByRole("link", { name: /IMM-2026-/ }).first()).toBeVisible();
});
