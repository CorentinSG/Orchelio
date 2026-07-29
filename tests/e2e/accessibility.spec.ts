import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Phase 9 — the accessibility pass.
 *
 * Two halves, because they catch different things.
 *
 * The first is an automated audit: axe-core, injected into each page and run
 * against the WCAG 2.1 A and AA rules. It runs entirely in the browser — no
 * API key, no network, nothing leaves the machine — which is what makes it
 * usable under this project's constraints.
 *
 * The second is a set of ordinary browser tests for the things an automated
 * audit cannot judge: that the skip link works, that a keyboard reaches every
 * control in a sensible order, that focus is visible, and that a refusal is
 * announced to a screen reader rather than merely being on the page.
 *
 * Automated coverage is roughly a third of WCAG. Saying so is the point: this
 * suite passing means no *machine-detectable* violation on these pages, not
 * that the product is accessible.
 */

const PASSWORD = "orchelio-demo";

type Page = import("@playwright/test").Page;

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** The rule sets Orchelio holds itself to. */
function audit(page: Page) {
  return new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
    "best-practice",
  ]);
}

async function expectNoViolations(page: Page, where: string) {
  const results = await audit(page).analyze();

  // Reported by rule and by the element that tripped it: "3 violations" sends
  // somebody hunting, "colour-contrast on .text-ink-subtle" does not.
  const summary = results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.map((node) => node.target.join(" ")),
  }));

  expect(summary, `${where} has accessibility violations`).toEqual([]);
}

// --- The automated audit ---------------------------------------------------

test.describe("public pages", () => {
  for (const path of ["/", "/login", "/guide"]) {
    test(`${path} has no detectable violation`, async ({ page }) => {
      await page.goto(path);
      await expectNoViolations(page, path);
    });
  }
});

test.describe("the firm workspace", () => {
  for (const path of [
    "/dashboard",
    "/matters",
    "/intake",
    "/documents",
    "/tasks",
    "/ai",
    "/approvals",
    "/activity",
    "/usage",
    "/settings",
    "/onboarding/1",
  ]) {
    test(`${path} has no detectable violation`, async ({ page }) => {
      await signIn(page, "immigration.attorney@demo.local");
      await page.goto(path);
      await expectNoViolations(page, path);
    });
  }

  test("a matter record has no detectable violation", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/matters");
    await page.getByRole("link", { name: /IMM-2026-001/ }).first().click();
    await page.waitForURL(/\/matters\/[0-9a-f-]{36}/);
    await expectNoViolations(page, "a matter record");
  });

  test("every settings section has no detectable violation", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");

    for (const section of [
      "profile",
      "matter-types",
      "ai",
      "approvals",
      "people",
      "branding",
      "confidentiality",
      "demonstration",
    ]) {
      await page.goto(`/settings?section=${section}`);
      await expectNoViolations(page, `/settings?section=${section}`);
    }
  });
});

test.describe("platform administration", () => {
  for (const path of ["/admin/firms", "/admin/system", "/admin/demo"]) {
    test(`${path} has no detectable violation`, async ({ page }) => {
      await signIn(page, "platform.admin@demo.local");
      await page.goto(path);
      await expectNoViolations(page, path);
    });
  }
});

/**
 * The same audit in the dark theme.
 *
 * Not a formality: contrast is the rule that fails most often, and the two
 * themes have entirely separate palettes. A token can clear 4.5:1 in one and
 * fail in the other, and testing only the default would have said the product
 * was fine while half its users saw the failure.
 */
test.describe("the dark theme", () => {
  test.use({ colorScheme: "dark" });

  for (const path of ["/", "/login", "/guide"]) {
    test(`${path} has no detectable violation in the dark`, async ({ page }) => {
      await page.goto(path);
      await expectNoViolations(page, `${path} (dark)`);
    });
  }

  for (const path of ["/dashboard", "/matters", "/ai", "/approvals", "/usage", "/settings"]) {
    test(`${path} has no detectable violation in the dark`, async ({ page }) => {
      await signIn(page, "immigration.attorney@demo.local");
      await page.goto(path);
      await expectNoViolations(page, `${path} (dark)`);
    });
  }
});

test.describe("the screens nobody wants to reach", () => {
  test("the refusal page has no detectable violation", async ({ page }) => {
    await signIn(page, "immigration.paralegal@demo.local");
    await page.goto("/usage");
    await expect(page).toHaveURL(/\/403/);
    await expectNoViolations(page, "/403");
  });

  test("the not-found page has no detectable violation", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/matters/00000000-0000-0000-0000-000000000000");
    await expectNoViolations(page, "a matter that does not exist");
  });
});

// --- What an automated audit cannot judge ----------------------------------

test.describe("keyboard and focus", () => {
  test("the first tab reaches a skip link that works", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/dashboard");

    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toHaveText(/skip/i);

    await page.keyboard.press("Enter");
    // The skip link has to move focus, not merely scroll: a link that jumps the
    // viewport while leaving focus in the header sends the next Tab back into
    // the navigation the user just asked to skip.
    await expect(page.locator(":focus")).toHaveAttribute("id", "main");
  });

  test("focus is visible on every interactive element it lands on", async ({ page }) => {
    await page.goto("/login");

    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press("Tab");
      const outline = await page.evaluate(() => {
        const element = document.activeElement;
        if (!element || element === document.body) return null;
        const style = getComputedStyle(element);
        return { width: style.outlineWidth, style: style.outlineStyle };
      });
      if (!outline) continue;
      expect(outline.style, `step ${step}`).not.toBe("none");
      expect(parseFloat(outline.width), `step ${step}`).toBeGreaterThan(0);
    }
  });

  test("the sign-in form can be completed and submitted by keyboard alone", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email address").focus();
    await page.keyboard.type("immigration.attorney@demo.local");
    await page.keyboard.press("Tab");
    await page.keyboard.type(PASSWORD);
    await page.keyboard.press("Enter");

    await page.waitForURL((url) => !url.pathname.startsWith("/login"));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("a matter's tabs are reachable and announce which one is open", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/matters");
    await page.getByRole("link", { name: /IMM-2026-001/ }).first().click();
    await page.waitForURL(/\/matters\/[0-9a-f-]{36}/);

    const tabs = page.getByRole("navigation", { name: "Matter sections" });
    // aria-current is what tells a screen-reader user where they are. Colour
    // alone would leave them counting.
    await expect(tabs.locator("[aria-current='page']")).toHaveCount(1);
  });
});

test.describe("announcements", () => {
  test("a refused save is announced, not merely displayed", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/settings?section=profile");

    await page.evaluate(() => {
      document.querySelectorAll("[required]").forEach((node) => node.removeAttribute("required"));
    });
    await page.getByLabel("Firm name").fill("");
    await page.getByRole("button", { name: "Save changes" }).click();

    // role="alert" is reserved for genuine errors, so a screen reader is not
    // interrupted by the standing demonstration notice.
    await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  });

  test("the demonstration banner is not an alert", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByText(/Do not upload real client information/).first();
    await expect(banner).toBeVisible();
    await expect(banner.locator("xpath=ancestor-or-self::*[@role='alert']")).toHaveCount(0);
  });

  test("every page has exactly one first-level heading", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");

    for (const path of ["/dashboard", "/matters", "/documents", "/usage", "/settings"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 }), path).toHaveCount(1);
    }
  });
});
