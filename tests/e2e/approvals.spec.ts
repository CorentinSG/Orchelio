import { expect, test } from "@playwright/test";

/**
 * Phase 7 acceptance, in a real browser.
 *
 * The rules are tested in `tests/unit/approval-rules.test.ts` and the effects
 * in `tests/integration/approvals.test.ts`. What only a browser can prove is
 * that a person is actually confronted with the decision — that approving is
 * not the effortless default, that what approving causes is on screen before
 * the buttons, and that a role without the permission is refused by the server
 * and not merely shown fewer buttons.
 */

/**
 * Serial, and every card located by its matter's reference.
 *
 * These tests consume approvals: deciding one is not repeatable, and "the
 * first pending card" is a different card depending on what else has run.
 * Serial removes the interleaving inside this file; the reference filter
 * handles the analyses that `analysis.spec.ts` raises in parallel.
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

async function openMatter(page: import("@playwright/test").Page, reference: string) {
  await page.goto("/matters");
  await page.getByRole("link", { name: new RegExp(reference) }).click();
  await page.waitForURL(/\/matters\/[0-9a-f-]{36}/);
}

function tabs(page: import("@playwright/test").Page) {
  return page.getByRole("navigation", { name: "Matter sections" });
}

/** Runs an analysis, which raises the approval both demo firms require. */
async function runAnalysis(page: import("@playwright/test").Page, reference: string) {
  await openMatter(page, reference);
  await tabs(page).getByRole("link", { name: "AI Analysis" }).click();
  await page.getByRole("button", { name: /^Run analysis$|^Run again$/ }).click();
  await page.waitForURL(/tab=analysis/);
}

/**
 * The pending approval card for one matter.
 *
 * By reference rather than position: the queue holds every firm's pending
 * decisions, and which one is first depends on what else has run.
 */
function pendingCard(page: import("@playwright/test").Page, reference: string) {
  return page
    .getByRole("region", { name: /^Waiting for a decision/ })
    .locator("li")
    .filter({ hasText: reference })
    .first();
}

test.describe("An analysis nobody has approved", () => {
  test("says so, before the analysis rather than after it", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-001");

    await expect(page.getByText("Nobody has approved this yet")).toBeVisible();
    await expect(page.locator("main")).toContainText(/a draft nobody has stood behind/i);
  });

  test("raises the approval because the firm asked for it", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-001");
    await page.goto("/approvals");

    const waiting = page.getByRole("region", { name: /^Waiting for a decision/ });
    await expect(waiting).toContainText("Rely on an AI analysis");
    await expect(waiting).toContainText("IMM-2026-001");
  });
});

test.describe("Deciding", () => {
  test("states what approving will cause, above the buttons", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-002");
    await page.goto("/approvals");

    const waiting = page.getByRole("region", { name: /^Waiting for a decision/ });
    await expect(waiting).toContainText("If you approve:");
    await expect(waiting).toContainText(/Has an attorney read this analysis/i);
  });

  test("offers four decisions, none of them the obvious one", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-002");
    await page.goto("/approvals");

    const waiting = page.getByRole("region", { name: /^Waiting for a decision/ });
    for (const label of [
      "Approved",
      "Approved with edits",
      "New analysis requested",
      "Rejected",
    ]) {
      await expect(waiting.getByRole("button", { name: new RegExp(`^${label}`) }).first()).toBeVisible();
    }
  });

  test("refuses a rejection with no note, on the server", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await runAnalysis(page, "EMP-2026-001");
    await page.goto("/approvals");

    const card = pendingCard(page, "EMP-2026-001");
    await card.getByRole("button", { name: /^Rejected/ }).click();
    await page.waitForURL(/\/approvals/);

    await expect(page.locator("main").getByRole("alert")).toContainText(/needs a note/i);
    // Still waiting: a refused decision must not half-record.
    await expect(page.getByRole("region", { name: /^Waiting for a decision/ })).toContainText(
      "Awaiting a decision",
    );
  });

  test("records a decision with a note, and says where it went", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await runAnalysis(page, "EMP-2026-002");
    await page.goto("/approvals");

    const card = pendingCard(page, "EMP-2026-002");
    await card.getByLabel("Note").fill("Read in full. The sequence is reported, not characterised.");
    await card.getByRole("button", { name: /^Approved with edits/ }).click();
    await page.waitForURL(/\/approvals/);

    await expect(page.getByText("Decision recorded")).toBeVisible();
    await expect(page.getByRole("region", { name: /^Decided/ })).toContainText(
      "Approved with edits",
    );
    await expect(page.getByRole("region", { name: /^Decided/ })).toContainText(
      "The sequence is reported",
    );
  });

  test("a decided approval keeps its record rather than disappearing", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/approvals?status=approved_with_edits");

    await expect(page.getByRole("region", { name: /^Decided/ })).toBeVisible();
  });
});

test.describe("A locked rule", () => {
  test("raises a decision on a draft, whatever the firm configured", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-003");
    await tabs(page).getByRole("link", { name: "Communications" }).click();

    await page.getByLabel("Subject").fill("Documents we still need");
    await page.getByLabel("Text").fill("Fictional draft to a fictional client.");
    await page.getByRole("button", { name: "Prepare draft" }).click();
    await page.waitForURL(/tab=communications/);

    await expect(page.getByText("Draft prepared, and waiting for a decision")).toBeVisible();
    await expect(page.getByText("Not approved — do not use").first()).toBeVisible();

    await tabs(page).getByRole("link", { name: "Approvals", exact: true }).click();
    const approvals = page.getByRole("region", { name: /^Approvals on this matter/ });
    await expect(approvals).toContainText("Approve a draft for use outside the firm");
    await expect(approvals).toContainText("Cannot be switched off");
  });

  test("says Orchelio sends nothing, and approving does not change that", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-003");
    await tabs(page).getByRole("link", { name: "Communications" }).click();

    await expect(page.getByText("Orchelio sends nothing")).toBeVisible();
    await expect(page.locator("main")).toContainText(/no .*sent.* status and no\s+transport/i);
    // There is no send button anywhere on the page, approved or not.
    await expect(page.getByRole("button", { name: /send/i })).toHaveCount(0);
  });

  test("never confirms a date without a person", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-002");
    await tabs(page).getByRole("link", { name: "Approvals", exact: true }).click();

    const ask = page.getByRole("button", { name: /Ask a person to confirm/ });
    await expect(ask).toBeVisible();
    await ask.click();
    await page.waitForURL(/tab=approvals/);

    await expect(page.getByText("Raised, and waiting for a person")).toBeVisible();
    const approvals = page.getByRole("region", { name: /^Approvals on this matter/ });
    await expect(approvals).toContainText("Confirm a recorded date");
    await expect(approvals).toContainText("Cannot be switched off");
  });
});

test.describe("What each role may do", () => {
  test("a paralegal sees the queue and cannot decide", async ({ page }) => {
    await signIn(page, "immigration.paralegal@demo.local");
    await page.goto("/approvals");

    await expect(page.getByRole("heading", { name: "Approvals", level: 1 })).toBeVisible();
    await expect(page.locator("main")).toContainText(/Your role does not decide these/i);
    await expect(page.getByRole("button", { name: /^Approved$/ })).toHaveCount(0);
  });

  test("and is refused by the server, not only by a hidden button", async ({ page }) => {
    // Learn a real pending approval's identifier as somebody who may see it.
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-001");
    await page.goto("/approvals");
    const approvalId = (await pendingCard(page, "IMM-2026-001").getAttribute("id")) ?? "";

    await page.getByRole("button", { name: "Sign out" }).click();
    await signIn(page, "immigration.paralegal@demo.local");
    await page.goto("/approvals");

    await page.evaluate((id) => {
      const form = document.createElement("form");
      form.method = "post";
      form.action = "/api/approvals/decide";
      for (const [name, value] of Object.entries({
        approvalId: id.replace("approval-", ""),
        decision: "approved",
        note: "",
      })) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.append(input);
      }
      document.body.append(form);
      form.submit();
    }, approvalId);

    await expect(page).toHaveURL(/\/403/);
  });

  test("a read-only reviewer cannot prepare a draft", async ({ page }) => {
    await signIn(page, "reviewer@demo.local");
    await page
      .getByRole("region", { name: "Your firms" })
      .getByRole("button", { name: /Dupont Immigration Law/ })
      .click();
    await expect(page.getByRole("heading", { name: "Dupont Immigration Law" })).toBeVisible();

    await openMatter(page, "IMM-2026-001");
    await tabs(page).getByRole("link", { name: "Communications" }).click();

    await expect(page.getByRole("region", { name: "Prepare a draft" })).toHaveCount(0);
    await expect(page.getByText("Read only")).toBeVisible();
  });

  test("the activity log is held by firm administrators", async ({ page }) => {
    await signIn(page, "immigration.paralegal@demo.local");
    await page.goto("/activity");

    await expect(page).toHaveURL(/\/403/);
  });
});

test.describe("The activity log", () => {
  test("shows decisions, and says the append-only guarantee is the code's", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await runAnalysis(page, "EMP-2026-003");
    await page.goto("/approvals");
    const card = pendingCard(page, "EMP-2026-003");
    await card.getByRole("button", { name: /^Approved$/ }).click();
    await page.waitForURL(/\/approvals/);

    await page.goto("/activity");
    await expect(page.getByRole("heading", { name: "Activity log", level: 1 })).toBeVisible();
    await expect(page.locator("main")).toContainText("Decision recorded");
    // Honest about what the guarantee rests on.
    await expect(page.locator("main")).toContainText(/append-only.*discipline/i);
    await expect(page.locator("main")).toContainText(/write-once storage/i);
  });

  test("filters on the server", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/activity?action=approval.decided");

    await expect(page).toHaveURL(/action=approval.decided/);
    const body = await page.getByRole("region", { name: /^Events/ }).innerText();
    expect(body).toContain("Decision recorded");
    expect(body).not.toContain("Document added");
  });

  test("shows a refusal as a refusal", async ({ page }) => {
    // Produce one: a paralegal asking for the activity log is denied and logged.
    await signIn(page, "employment.paralegal@demo.local");
    await page.goto("/activity");
    await expect(page).toHaveURL(/\/403/);

    // The refusal page is outside the workspace shell and has no sign-out
    // control, which is correct — it is a dead end by design.
    await page.goto("/matters");
    await page.getByRole("button", { name: "Sign out" }).click();
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/activity?status=denied");

    await expect(page.getByRole("region", { name: /^Events/ })).toContainText("Access refused");
  });

  test("never shows another firm's events", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/activity");

    const body = await page.locator("main").innerText();
    expect(body).not.toContain("EMP-2026-");
  });
});

test.describe("The approval centre", () => {
  test("is honest about rules it does not yet raise", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/approvals");

    const honesty = page.getByRole("region", { name: "Rules this build does not yet raise" });
    await expect(honesty).toBeVisible();
    await expect(honesty).toContainText(/a rule nobody raises protects nobody/i);
  });

  test("says which rules this firm chose and which cannot be switched off", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/approvals");

    const chosen = page.getByRole("region", { name: "What raises an approval here" });
    await expect(chosen).toContainText("Always — cannot be switched off");
    await expect(chosen).toContainText("This firm requires it");
  });

  test("never shows another firm's approvals", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/approvals");

    const body = await page.locator("main").innerText();
    expect(body).not.toContain("IMM-2026-");
  });

  test("cannot decide another firm's approval", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-001");
    await page.goto("/approvals");
    const approvalId = (
      (await pendingCard(page, "IMM-2026-001").getAttribute("id")) ?? ""
    ).replace("approval-", "");

    await page.getByRole("button", { name: "Sign out" }).click();
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/approvals");

    await page.evaluate((id) => {
      const form = document.createElement("form");
      form.method = "post";
      form.action = "/api/approvals/decide";
      for (const [name, value] of Object.entries({
        approvalId: id,
        decision: "approved",
        note: "",
      })) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.append(input);
      }
      document.body.append(form);
      form.submit();
    }, approvalId);

    await expect(page).toHaveURL(/\/403/);
  });
});

test.describe("The dashboard", () => {
  test("counts what is waiting for a person", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-001");
    await page.goto("/dashboard");

    const tile = page.locator("p", { hasText: /^Pending approvals$/ }).locator("..");
    await expect(tile.locator("p").first()).toHaveText(/^\d+$/);
    await expect(tile).toContainText(/Awaiting a human decision/i);
  });
});

test.describe("Separation of duties", () => {
  test("names the requester when they are the one about to decide", async ({ page }) => {
    // The firm has the rule off, so this is information rather than a refusal —
    // and it is given anyway, because that is what makes the decision considered.
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-003");
    await page.goto("/approvals");

    const card = pendingCard(page, "IMM-2026-003");
    await expect(card).toContainText("You raised this request");
    await expect(card).toContainText("that person is you");
    // Still decidable: informed, not blocked.
    await expect(card.getByRole("button", { name: /^Approved$/ })).toBeVisible();
  });

  test("refuses to switch the rule on at a firm with one decider", async ({ page }) => {
    // Both demonstration firms have exactly one person who may decide: the
    // paralegal and the read-only reviewer do not hold `approval.decide`. So
    // this is the case the product has to handle, and it handles it by
    // refusing rather than by warning beside a control that still works.
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/settings?section=approvals");

    await page
      .getByRole("checkbox", { name: /must be decided by somebody other than the person/ })
      .check();
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByRole("main").getByRole("alert")).toContainText(/undecidable/i);

    // Nothing was stored: the box comes back unticked.
    await page.goto("/settings?section=approvals");
    await expect(
      page.getByRole("checkbox", { name: /must be decided by somebody other than the person/ }),
    ).not.toBeChecked();
  });

  test("says why, rather than only that the rule is unavailable", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/settings?section=approvals");

    // The count is real rather than assumed: this firm has one person who may
    // decide, and the screen names the consequence instead of saying "not
    // available".
    await expect(page.getByRole("main")).toContainText(/Only one person here may decide/);
    await expect(page.getByRole("main")).toContainText(/undecidable/);
    await expect(page.getByRole("main")).toContainText(/Give a second person the attorney/);
  });
});
