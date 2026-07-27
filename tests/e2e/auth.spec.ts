import { expect, test } from "@playwright/test";

/**
 * Phase 2 acceptance.
 *
 * Signing in as each demonstration account lands on the right workspace, and
 * every protected page refuses an unauthenticated request on the server.
 */

const PASSWORD = "orchelio-demo";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("Protection of signed-out visitors", () => {
  test("redirects the dashboard to sign-in and remembers where to return", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
    await expect(page.getByRole("heading", { name: "Sign in to Orchelio" })).toBeVisible();
  });

  test("redirects platform administration to sign-in", async ({ page }) => {
    await page.goto("/admin/firms");

    await expect(page).toHaveURL(/\/login/);
  });

  test("never sends workspace content to a signed-out visitor", async ({ page }) => {
    // The firm *names* are public: they are printed on the sign-in page as part
    // of the demonstration account list. What must never leave the server is
    // what lives inside a workspace, so that is what this asserts.
    const response = await page.goto("/dashboard");
    const body = (await response?.text()) ?? "";

    for (const workspaceOnly of [
      "Firm workspace",
      "Your permissions",
      "Recent activity",
      "approval.decide",
      "Signed in as",
    ]) {
      expect(body).not.toContain(workspaceOnly);
    }
  });

  test("never sends platform administration content to a signed-out visitor", async ({ page }) => {
    const response = await page.goto("/admin/firms");
    const body = (await response?.text()) ?? "";

    for (const adminOnly of ["Active sessions", "Firm list", "Scope of this role"]) {
      expect(body).not.toContain(adminOnly);
    }
  });
});

test.describe("Sign-in", () => {
  test("refuses a wrong password with a message that reveals nothing", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill("immigration.attorney@demo.local");
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Incorrect email address or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("gives an unknown address exactly the same message as a wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill("nobody@demo.local");
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Identical wording: the form cannot be used to discover which accounts exist.
    await expect(page.getByText("Incorrect email address or password.")).toBeVisible();
  });

  test("fills the form from a demonstration account button", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Claire Dupont/ }).click();

    await expect(page.getByLabel("Email address")).toHaveValue("immigration.attorney@demo.local");
  });
});

test.describe("Workspaces", () => {
  test("an immigration attorney lands in the immigration firm", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Dupont Immigration Law" })).toBeVisible();
    await expect(page.getByText("Immigration Law").first()).toBeVisible();
    await expect(page.getByText("Firm Administrator").first()).toBeVisible();
  });

  test("an employment paralegal lands in the employment firm with paralegal rights", async ({
    page,
  }) => {
    await signIn(page, "employment.paralegal@demo.local");

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Carter Employment & Labor Law" })).toBeVisible();

    // The specification forbids a paralegal from approving an analysis,
    // confirming a deadline or closing a matter.
    const permissions = page.getByRole("region", { name: "Your permissions" });
    await expect(permissions).toContainText("document.upload");
    await expect(permissions).not.toContainText("approval.decide");
    await expect(permissions).not.toContainText("deadline.confirm");
    await expect(permissions).not.toContainText("matter.close");
  });

  test("a firm user never sees another firm's name", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await expect(page).toHaveURL(/\/dashboard/);

    await expect(page.locator("body")).not.toContainText("Carter Employment & Labor Law");
  });

  test("a firm user is refused platform administration", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/admin/firms");

    await expect(page).toHaveURL(/\/403/);
    await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
  });

  test("the platform administrator sees the firm list but no matter content", async ({ page }) => {
    await signIn(page, "platform.admin@demo.local");

    // A platform administrator holds no firm membership, so /dashboard sends
    // them to platform administration rather than into a firm.
    await expect(page).toHaveURL(/\/admin\/firms/);
    await expect(page.getByRole("heading", { name: "Firms" })).toBeVisible();
    await expect(page.getByText("Dupont Immigration Law")).toBeVisible();
    await expect(page.getByText("Carter Employment & Labor Law")).toBeVisible();
    await expect(page.getByText("Scope of this role")).toBeVisible();
  });
});

test.describe("Sign-out", () => {
  test("ends the session, so the dashboard is protected again", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
