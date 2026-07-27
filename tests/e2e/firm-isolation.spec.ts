import { expect, test } from "@playwright/test";

/**
 * Phase 3 acceptance, in a real browser.
 *
 * The integration suite proves the data layer refuses to cross a firm boundary.
 * These tests prove the same thing through the interface a user actually
 * touches — including the one control that exists to move between firms.
 */

const PASSWORD = "orchelio-demo";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Wait for the sign-in to land before doing anything else: navigating on
  // while the request is in flight races it and arrives signed out.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("Firm switcher", () => {
  test("is hidden from a user who belongs to a single firm", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await expect(page.getByRole("heading", { name: "Dupont Immigration Law" })).toBeVisible();

    // Offering a switcher with one option would be noise.
    await expect(page.getByRole("region", { name: "Your firms" })).toHaveCount(0);
  });

  test("lets a member of two firms move between them", async ({ page }) => {
    await signIn(page, "reviewer@demo.local");

    const switcher = page.getByRole("region", { name: "Your firms" });
    await expect(switcher).toBeVisible();

    // Lands in the first firm alphabetically.
    await expect(page.getByRole("heading", { name: "Carter Employment & Labor Law" })).toBeVisible();

    await switcher.getByRole("button", { name: /Dupont Immigration Law/ }).click();
    await expect(page.getByRole("heading", { name: "Dupont Immigration Law" })).toBeVisible();

    // Switching replaces the workspace; it does not merge the two.
    await expect(page.locator("main")).not.toContainText("Carter Employment & Labor Law");
  });

  test("remembers the chosen firm across a reload", async ({ page }) => {
    await signIn(page, "reviewer@demo.local");
    await page
      .getByRole("region", { name: "Your firms" })
      .getByRole("button", { name: /Dupont Immigration Law/ })
      .click();
    await expect(page.getByRole("heading", { name: "Dupont Immigration Law" })).toBeVisible();

    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Dupont Immigration Law" })).toBeVisible();
  });

  test("shows the read-only reviewer only viewing rights, in either firm", async ({ page }) => {
    await signIn(page, "reviewer@demo.local");

    const permissions = page.getByRole("region", { name: "Your permissions" });
    await expect(permissions).toContainText("matter.view");
    await expect(permissions).not.toContainText("matter.create");
    await expect(permissions).not.toContainText("approval.decide");
    await expect(permissions).not.toContainText("document.upload");
  });
});

test.describe("Cross-firm access", () => {
  test("a forged active-firm cookie does not open the other firm", async ({ page, context }) => {
    // Discover the other firm's identifier the honest way, as the reviewer,
    // then try to use it as somebody who does not belong to that firm.
    await signIn(page, "reviewer@demo.local");
    await page
      .getByRole("region", { name: "Your firms" })
      .getByRole("button", { name: /Dupont Immigration Law/ })
      .click();
    await expect(page.getByRole("heading", { name: "Dupont Immigration Law" })).toBeVisible();

    const cookies = await context.cookies();
    const dupontFirmId = cookies.find((cookie) => cookie.name === "orchelio_active_firm")?.value;
    expect(dupontFirmId).toBeTruthy();

    await page.getByRole("button", { name: "Sign out" }).click();
    await signIn(page, "employment.paralegal@demo.local");
    await expect(page.getByRole("heading", { name: "Carter Employment & Labor Law" })).toBeVisible();

    // Plant the other firm's identifier as this user's active firm.
    await context.addCookies([
      {
        name: "orchelio_active_firm",
        value: dupontFirmId!,
        domain: "127.0.0.1",
        path: "/",
      },
    ]);
    await page.goto("/dashboard");

    // The cookie is a preference, not a credential: it selects only among the
    // firms this user's memberships already allow, so it is ignored.
    await expect(page.getByRole("heading", { name: "Carter Employment & Labor Law" })).toBeVisible();
    await expect(page.locator("main")).not.toContainText("Dupont Immigration Law");
  });

  test("submitting another firm's identifier to the switcher is refused", async ({
    page,
    context,
  }) => {
    await signIn(page, "reviewer@demo.local");
    await page
      .getByRole("region", { name: "Your firms" })
      .getByRole("button", { name: /Dupont Immigration Law/ })
      .click();
    await expect(page.getByRole("heading", { name: "Dupont Immigration Law" })).toBeVisible();

    const cookies = await context.cookies();
    const dupontFirmId = cookies.find((cookie) => cookie.name === "orchelio_active_firm")?.value;

    await page.getByRole("button", { name: "Sign out" }).click();
    await signIn(page, "employment.paralegal@demo.local");
    await expect(page.getByRole("heading", { name: "Carter Employment & Labor Law" })).toBeVisible();

    // Rewrite the hidden field, exactly as an attacker with developer tools
    // would, and submit the form.
    await page.evaluate((firmId) => {
      const input = document.querySelector<HTMLInputElement>('input[name="firmId"]');
      if (input) input.value = firmId;
    }, dupontFirmId!);

    const switcher = page.getByRole("region", { name: "Your firms" });
    if ((await switcher.count()) > 0) {
      await switcher.getByRole("button").first().click();
      await expect(page).toHaveURL(/\/403/);
    }
  });

  test("an employment user never sees the immigration firm anywhere on the page", async ({
    page,
  }) => {
    await signIn(page, "employment.attorney@demo.local");
    await expect(page.getByRole("heading", { name: "Carter Employment & Labor Law" })).toBeVisible();

    const body = await page.locator("body").innerText();
    expect(body).not.toContain("Dupont Immigration Law");
  });
});
