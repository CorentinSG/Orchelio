import { expect, test } from "@playwright/test";

/**
 * Phase 8 — firm settings, in a real browser.
 *
 * The rules are tested in `tests/unit/settings-config.test.ts` and the writes in
 * `tests/integration/settings.test.ts`. What only a browser can prove is that
 * the guarantees are *visible*: that the nine locked rules appear with no
 * control to switch them off, that a role without the permission is refused by
 * the server rather than merely shown fewer buttons, and that switching an AI
 * feature off removes the dashboard card that depended on it instead of leaving
 * it showing zero.
 */

/**
 * Serial: these tests change one firm's configuration, and a test that reads a
 * setting while another is writing it would be a race dressed up as a bug.
 */
test.describe.configure({ mode: "serial" });

const PASSWORD = "orchelio-demo";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

function alerts(page: import("@playwright/test").Page) {
  return page.getByRole("main").getByRole("alert");
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

test.describe("firm settings", () => {
  test("a firm administrator can reach every section", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/settings");

    const tabs = page.getByRole("navigation", { name: "Settings sections" });
    for (const name of [
      "Profile",
      "Matter types",
      "AI features",
      "Approval rules",
      "People and roles",
      "Branding",
      "Demonstration",
    ]) {
      await expect(tabs.getByRole("link", { name, exact: true })).toBeVisible();
    }
  });

  test("the nine locked rules are shown with no way to switch them off", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/settings?section=approvals");

    const heading = page.getByRole("heading", { name: /9 rules nobody can switch off/ });
    await expect(heading).toBeVisible();

    // The rules are listed, and none of them is a form control. A disabled
    // checkbox would still be a control; there is not even that.
    const locked = page.getByText("Always required");
    await expect(locked).toHaveCount(9);

    for (const key of ["fileSubmission", "permanentDeletion", "externalTransmission"]) {
      await expect(page.locator(`input[value="${key}"]`)).toHaveCount(0);
    }
  });

  test("a configurable rule can be switched off and stays off", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/settings?section=approvals");

    const closeMatter = page.getByRole("checkbox", { name: /Close a matter/ });
    const wasChecked = await closeMatter.isChecked();

    if (wasChecked) await closeMatter.uncheck();
    else await closeMatter.check();

    await page.getByRole("button", { name: "Save changes" }).click();
    await page.waitForURL(/section=approvals&saved=1/);

    await expect(page.getByRole("checkbox", { name: /Close a matter/ })).toBeChecked({
      checked: !wasChecked,
    });

    // Put it back, so the rest of the suite meets the firm it expects.
    const restored = page.getByRole("checkbox", { name: /Close a matter/ });
    if (wasChecked) await restored.check();
    else await restored.uncheck();
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.waitForURL(/saved=1/);
  });

  test("switching an AI feature off removes the card that depended on it", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");

    // The exact widget label, not a loose match: "Missing identity documents"
    // does not contain the phrase "missing documents", and a regex that assumed
    // it did would report the card as absent while it was on screen.
    const card = page.getByText("Missing identity documents");

    await page.goto("/dashboard");
    await expect(card, "the fixture assumes this firm starts with the feature on").toBeVisible();

    await page.goto("/settings?section=ai");
    await page.getByRole("checkbox", { name: /Identify missing documents/ }).uncheck();
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.waitForURL(/saved=1/);

    // Omitted, not shown as zero: a "0 missing documents" card at a firm that
    // never asked Orchelio to look would read as reassurance.
    await page.goto("/dashboard");
    await expect(page.getByText("Missing identity documents")).toHaveCount(0);
    await expect(page.getByText("Missing immigration documents")).toHaveCount(0);

    await page.goto("/settings?section=ai");
    await page.getByRole("checkbox", { name: /Identify missing documents/ }).check();
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.waitForURL(/saved=1/);
  });

  test("branding changes the firm's name in the sidebar, never the product's", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/settings?section=branding");

    await page.getByLabel("Display name").fill("Carter Law");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.waitForURL(/saved=1/);

    const sidebar = page.getByRole("complementary", { name: "Firm workspace" });
    await expect(sidebar.getByText("Carter Law")).toBeVisible();
    // The product's own name is untouched by anything a firm can type.
    await expect(sidebar.getByText("Orchelio", { exact: true })).toBeVisible();

    await page.goto("/settings?section=branding");
    await page.getByLabel("Display name").fill("");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.waitForURL(/saved=1/);
  });

  test("a read-only reviewer is refused, not merely shown fewer buttons", async ({ page }) => {
    await signIn(page, "reviewer@demo.local");

    // No permission to view settings at all: the guard redirects.
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/403/);
  });

  test("a paralegal cannot save a setting even by posting directly", async ({ page }) => {
    await signIn(page, "immigration.paralegal@demo.local");

    // The form is not on their screen, so the request is built by hand — which
    // is the only version of this test worth running.
    await page.goto("/dashboard");
    const result = await postForm(page, "/api/settings", {
      section: "approvals",
      approvalKeys: "sendEmail",
    });

    expect(result.url).toContain("/403");
  });

  test("the demonstration tab offers adding data and no way to erase it", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/settings?section=demonstration");

    await expect(page.getByRole("button", { name: /Add \d+ sample matter/ })).toBeVisible();
    await expect(page.getByText("npm run reset-demo")).toBeVisible();

    // Nothing on the page deletes anything.
    await expect(page.getByRole("button", { name: /delete|erase|reset/i })).toHaveCount(0);
  });

  test("the confidentiality report states what nothing enforces yet", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/settings?section=confidentiality");

    // The easy half. The page's own wording, not the check script's. Since V1
    // the sentence is governed rather than absolute (ADR-0025): destinations
    // are listed, and under the simulation this instance runs, unused.
    await expect(page.getByRole("main")).toContainText(
      "Nothing leaves this machine except what is listed",
    );
    await expect(page.getByRole("main")).toContainText("Sent to an AI provider");
    await expect(page.getByRole("main")).toContainText(
      "no key is configured and the simulation opens no socket",
    );
    await expect(page.getByText("prisma/orchelio-demo.db")).toBeVisible();

    // The half a supplier would leave out. A page listing only the enforced
    // promises would be the same shape of lie as a zero where a dash belongs.
    await expect(page.getByRole("heading", { name: /promise\(s\) nothing enforces yet/ })).toBeVisible();
    await expect(page.getByRole("main")).toContainText(/encrypted with a key the firm holds/i);
    await expect(page.getByText("not implemented").first()).toBeVisible();

    // And it says the uncomfortable fact about this build outright.
    await expect(page.getByRole("main")).toContainText("Encrypted at rest");
    await expect(page.getByRole("main")).toContainText("anybody with the file has everything");
  });

  test("the confidentiality report offers nothing to change", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/settings?section=confidentiality");

    // Confidentiality is not a preference a firm sets. It is the one section
    // with no form, and a switch here would imply it could be switched off.
    await expect(page.getByRole("button", { name: "Save changes" })).toHaveCount(0);
    await expect(page.getByRole("checkbox")).toHaveCount(0);
  });

  test("a settings error is announced, not silently discarded", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/settings?section=profile");

    // The browser would block an empty required field, so the attribute is
    // removed: this asserts the server's copy of the rule, not the browser's.
    await page.evaluate(() => {
      document.querySelectorAll("[required]").forEach((node) => node.removeAttribute("required"));
    });
    await page.getByLabel("Firm name").fill("");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(alerts(page)).toContainText(/Enter a firm name/);
  });
});

test.describe("the time zone a firm chose", () => {
  /**
   * The setting used to change nothing.
   *
   * A firm picked one of four zones in the questionnaire and every date on
   * every screen stayed UTC, so a decision recorded at half past six on a
   * Tuesday evening in Los Angeles was dated Wednesday and nothing said why.
   * These tests are the difference between a setting and a decoration.
   */
  async function chooseTimezone(page: import("@playwright/test").Page, value: string) {
    await page.goto("/settings?section=profile");
    await page.getByLabel("Timezone").selectOption(value);
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.waitForURL(/section=profile/);
  }

  /**
   * How one particular event is worded on the log, found by its instant.
   *
   * By instant rather than by position: saving the setting is itself an event,
   * so "the first row" is a different row on the second reading. The first
   * draft of this test compared two different events and reported a 373ms
   * discrepancy as a failure.
   */
  async function eventShownAs(page: import("@playwright/test").Page, instant: string) {
    await page.goto("/activity");
    const row = page.locator(`time[datetime="${instant}"]`).first();
    await expect(row).toBeVisible();
    return (await row.textContent())?.trim() ?? "";
  }

  /** The instant of the most recent event, as the page itself records it. */
  async function latestInstant(page: import("@playwright/test").Page) {
    await page.goto("/activity");
    const instant = await page.locator("time").first().getAttribute("datetime");
    expect(instant).toBeTruthy();
    return instant ?? "";
  }

  test("names itself, so nobody has to guess which zone a date is in", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await chooseTimezone(page, "America/Los_Angeles");

    await page.goto("/activity");
    await expect(page.getByRole("main")).toContainText(
      "Dates and times are shown in Pacific (Los Angeles).",
    );

    await page.goto("/approvals");
    await expect(page.getByRole("main")).toContainText("Pacific (Los Angeles)");
  });

  test("moves the clock on the activity log by the difference between the zones", async ({
    page,
  }) => {
    await signIn(page, "employment.attorney@demo.local");

    await chooseTimezone(page, "America/New_York");
    const instant = await latestInstant(page);
    const eastern = await eventShownAs(page, instant);

    await chooseTimezone(page, "America/Los_Angeles");
    const pacific = await eventShownAs(page, instant);

    // One event, read twice. Any difference is the zone and nothing else.
    expect(pacific).not.toBe(eastern);

    // Both zones observe the same daylight-saving rules, so the gap is three
    // hours whatever time of year the suite runs.
    const read = (text: string) => Date.parse(`${text.replace(" ", "T")}Z`);
    expect(read(eastern) - read(pacific)).toBe(3 * 60 * 60 * 1000);
  });

  test("says plainly that the language setting changes nothing", async ({ page }) => {
    // The honest half. Time zone now does something; the interface language
    // does not, and a control that quietly does nothing is the same shape of
    // claim as a zero where a dash belongs.
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/settings?section=profile");

    await expect(page.getByRole("main")).toContainText(
      "English is the only interface language Orchelio has",
    );
    await expect(page.getByRole("main")).toContainText("nothing reads it yet");
  });

  test("puts the firm's zone back where the rest of the suite expects it", async ({ page }) => {
    // Not a test so much as the tidying the serial mode makes safe. Left on
    // Pacific, every other spec's dates would shift under it.
    await signIn(page, "employment.attorney@demo.local");
    await chooseTimezone(page, "America/New_York");

    await page.goto("/settings?section=profile");
    await expect(page.getByLabel("Timezone")).toHaveValue("America/New_York");
  });
});
