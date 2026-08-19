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
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

async function openMatter(page: import("@playwright/test").Page, reference: string) {
  // Searched rather than scrolled: the list pages at twenty since L-1, so a
  // seeded matter is only on the first page by luck.
  await page.goto(`/matters?q=${encodeURIComponent(reference)}`);
  await page.getByRole("link", { name: new RegExp(reference) }).first().click();
  await page.waitForURL(/\/matters\/[0-9a-f-]{36}/);
}

function tabs(page: import("@playwright/test").Page) {
  return page.getByRole("navigation", { name: "Sections du dossier" });
}

/** Runs an analysis, which raises the approval both demo firms require. */
async function runAnalysis(page: import("@playwright/test").Page, reference: string) {
  await openMatter(page, reference);
  await tabs(page).getByRole("link", { name: "Analyse" }).click();
  await page.getByRole("button", { name: /^Lancer l’analyse$|^Relancer l’analyse$/ }).click();
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
    .getByRole("region", { name: /^En attente d’une décision/ })
    .locator("li")
    .filter({ hasText: reference })
    .first();
}

/**
 * The same card, opened.
 *
 * Since L-1 a pending card is a folded `<details>`: the question, the effect
 * and the four buttons are behind a summary line. Anything that decides has
 * to open it first, exactly as a person does.
 */
async function openPendingCard(page: import("@playwright/test").Page, reference: string) {
  const card = pendingCard(page, reference);
  await card.locator("summary").click();
  return card;
}

test.describe("An analysis nobody has approved", () => {
  test("says so, before the analysis rather than after it", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-001");

    await expect(page.getByText("Personne n’a encore validé ceci")).toBeVisible();
    await expect(page.locator("main")).toContainText(/un brouillon derrière lequel personne ne s’est rangé/i);
  });

  test("raises the approval because the firm asked for it", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-001");
    await page.goto("/approvals");

    const waiting = page.getByRole("region", { name: /^En attente d’une décision/ });
    await expect(waiting).toContainText("S’appuyer sur une analyse d’IA");
    await expect(waiting).toContainText("IMM-2026-001");
  });
});

test.describe("Deciding", () => {
  test("states what approving will cause, above the buttons", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-002");
    await page.goto("/approvals");

    // Opened first, and asserted with toBeVisible rather than toContainText:
    // since L-1 folded the card, toContainText reads the collapsed text too,
    // so it would pass on a screen where nobody could see any of this.
    const card = await openPendingCard(page, "IMM-2026-002");

    await expect(card.getByText("Si vous validez :")).toBeVisible();
    await expect(card.getByText(/Un avocat a-t-il lu cette analyse/i)).toBeVisible();
    // And the effect really is above the buttons, not after them.
    const effectY = (await card.getByText("Si vous validez :").boundingBox())?.y ?? 0;
    const buttonY = (await card.getByRole("button", { name: /^Validée$/ }).boundingBox())?.y ?? 0;
    expect(effectY).toBeLessThan(buttonY);
  });

  test("offers four decisions, none of them the obvious one", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-002");
    await page.goto("/approvals");

    const card = await openPendingCard(page, "IMM-2026-002");

    for (const label of [
      "Validée",
      "Validée avec modifications",
      "Nouvelle analyse demandée",
      "Refusée",
    ]) {
      // Anchored at both ends: "Validée" is a prefix of "Validée avec
      // modifications", and a loose match would find two buttons.
      await expect(
        card.getByRole("button", { name: new RegExp(`^${label}( —|$)`) }),
      ).toBeVisible();
    }
  });

  test("refuses a rejection with no note, on the server", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await runAnalysis(page, "EMP-2026-001");
    await page.goto("/approvals");

    const card = await openPendingCard(page, "EMP-2026-001");
    await card.getByRole("button", { name: /^Refusée/ }).click();
    await page.waitForURL(/\/approvals/);

    await expect(page.locator("main").getByRole("alert")).toContainText(/La note est obligatoire/i);
    // Still waiting: a refused decision must not half-record.
    await expect(page.getByRole("region", { name: /^En attente d’une décision/ })).toContainText(
      "En attente d’une décision",
    );
  });

  test("records a decision with a note, and says where it went", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await runAnalysis(page, "EMP-2026-002");
    await page.goto("/approvals");

    const card = await openPendingCard(page, "EMP-2026-002");
    await card.getByLabel("Note").fill("Read in full. The sequence is reported, not characterised.");
    await card.getByRole("button", { name: /^Validée avec modifications/ }).click();
    await page.waitForURL(/\/approvals/);

    await expect(page.getByText("Décision enregistrée")).toBeVisible();
    await expect(page.getByRole("region", { name: /^Décidées/ })).toContainText(
      "Validée avec modifications",
    );
    await expect(page.getByRole("region", { name: /^Décidées/ })).toContainText(
      "The sequence is reported",
    );
  });

  test("a decided approval keeps its record rather than disappearing", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/approvals?status=approved_with_edits");

    await expect(page.getByRole("region", { name: /^Décidées/ })).toBeVisible();
  });
});

test.describe("A locked rule", () => {
  test("raises a decision on a draft, whatever the firm configured", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-003");
    await tabs(page).getByRole("link", { name: "Courriers" }).click();

    await page.getByLabel("Objet").fill("Documents we still need");
    await page.getByLabel("Texte").fill("Fictional draft to a fictional client.");
    await page.getByRole("button", { name: "Préparer le brouillon" }).click();
    await page.waitForURL(/tab=communications/);

    await expect(page.getByText("Brouillon préparé, en attente d’une décision")).toBeVisible();
    await expect(page.getByText("Non validé — ne pas utiliser").first()).toBeVisible();

    await tabs(page).getByRole("link", { name: "Validations", exact: true }).click();
    const approvals = page.getByRole("region", { name: /^Validations sur ce dossier/ });
    await expect(approvals).toContainText("Valider un brouillon pour usage hors du cabinet");
    await expect(approvals).toContainText("Impossible à désactiver");
  });

  test("says Orchelio sends nothing, and approving does not change that", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-003");
    await tabs(page).getByRole("link", { name: "Courriers" }).click();

    await expect(page.getByText("Orchelio n’envoie rien")).toBeVisible();
    await expect(page.locator("main")).toContainText(/ni statut « envoyé »,\s*ni transport/i);
    // There is no send button anywhere on the page, approved or not.
    await expect(page.getByRole("button", { name: /send|envoyer/i })).toHaveCount(0);
  });

  test("never confirms a date without a person", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await openMatter(page, "IMM-2026-002");
    await tabs(page).getByRole("link", { name: "Validations", exact: true }).click();

    const ask = page.getByRole("button", { name: /Demander à une personne de confirmer/ });
    await expect(ask).toBeVisible();
    await ask.click();
    await page.waitForURL(/tab=approvals/);

    await expect(page.getByText("Demandé, en attente d’une personne")).toBeVisible();
    const approvals = page.getByRole("region", { name: /^Validations sur ce dossier/ });
    await expect(approvals).toContainText("Confirmer une date enregistrée");
    await expect(approvals).toContainText("Impossible à désactiver");
  });
});

test.describe("What each role may do", () => {
  test("a paralegal sees the queue and cannot decide", async ({ page }) => {
    await signIn(page, "immigration.paralegal@demo.local");
    await page.goto("/approvals");

    await expect(page.getByRole("heading", { name: "Validations", level: 1 })).toBeVisible();
    await expect(page.locator("main")).toContainText(/Votre rôle ne décide pas/i);
    await expect(page.getByRole("button", { name: /^Validée$/ })).toHaveCount(0);
  });

  test("and is refused by the server, not only by a hidden button", async ({ page }) => {
    // Learn a real pending approval's identifier as somebody who may see it.
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-001");
    await page.goto("/approvals");
    const approvalId = (await pendingCard(page, "IMM-2026-001").getAttribute("id")) ?? "";

    await page.getByRole("button", { name: "Se déconnecter" }).click();
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
      .getByRole("region", { name: "Vos cabinets" })
      .getByRole("button", { name: /Dupont & Associés/ })
      .click();
    await expect(page.getByRole("heading", { name: "Dupont & Associés" })).toBeVisible();

    await openMatter(page, "IMM-2026-001");
    await tabs(page).getByRole("link", { name: "Courriers" }).click();

    await expect(page.getByRole("region", { name: "Préparer un brouillon" })).toHaveCount(0);
    await expect(page.getByText("Votre rôle ne permet pas de préparer un brouillon")).toBeVisible();
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
    const card = await openPendingCard(page, "EMP-2026-003");
    await card.getByRole("button", { name: /^Validée$/ }).click();
    await page.waitForURL(/\/approvals/);

    await page.goto("/activity");
    await expect(page.getByRole("heading", { name: "Journal d’activité", level: 1 })).toBeVisible();
    await expect(page.locator("main")).toContainText("Décision enregistrée");
    // Honest about what the guarantee rests on.
    await expect(page.locator("main")).toContainText(/En ajout seul — par discipline/i);
    await expect(page.locator("main")).toContainText(/écriture unique/i);
  });

  test("filters on the server", async ({ page }) => {
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/activity?action=approval.decided");

    await expect(page).toHaveURL(/action=approval.decided/);
    const body = await page.getByRole("region", { name: /^Événements/ }).innerText();
    expect(body).toContain("Décision enregistrée");
    expect(body).not.toContain("Document ajouté");
  });

  test("shows a refusal as a refusal", async ({ page }) => {
    // Produce one: a paralegal asking for the activity log is denied and logged.
    await signIn(page, "employment.paralegal@demo.local");
    await page.goto("/activity");
    await expect(page).toHaveURL(/\/403/);

    // The refusal page is outside the workspace shell and has no sign-out
    // control, which is correct — it is a dead end by design.
    await page.goto("/matters");
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/activity?status=denied");

    await expect(page.getByRole("region", { name: /^Événements/ })).toContainText("Accès refusé");
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

    const honesty = page.getByRole("region", { name: "Les règles que cette version ne déclenche pas encore" });
    await expect(honesty).toBeVisible();
    await expect(honesty).toContainText(/une règle que rien ne déclenche ne protège personne/i);
  });

  test("says which rules this firm chose and which cannot be switched off", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/approvals");

    const chosen = page.getByRole("region", { name: "Ce qui crée une demande de validation ici" });
    await expect(chosen).toContainText("Toujours — impossible à désactiver");
    await expect(chosen).toContainText("Ce cabinet l’exige");
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

    await page.getByRole("button", { name: "Se déconnecter" }).click();
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

    const tile = page.locator("p", { hasText: /^Validations en attente$/ }).locator("..");
    await expect(tile.locator("p").first()).toHaveText(/^\d+$/);
    await expect(tile).toContainText(/d.une décision humaine/i);
  });
});

test.describe("Separation of duties", () => {
  test("names the requester when they are the one about to decide", async ({ page }) => {
    // The firm has the rule off, so this is information rather than a refusal —
    // and it is given anyway, because that is what makes the decision considered.
    await signIn(page, "immigration.attorney@demo.local");
    await runAnalysis(page, "IMM-2026-003");
    await page.goto("/approvals");

    const card = await openPendingCard(page, "IMM-2026-003");
    await expect(card).toContainText("Vous avez formé cette demande");
    await expect(card).toContainText("cette personne, c’est vous");
    // Still decidable: informed, not blocked.
    await expect(card.getByRole("button", { name: /^Validée$/ })).toBeVisible();
  });

  test("refuses to switch the rule on at a firm with one decider", async ({ page }) => {
    // Both demonstration firms have exactly one person who may decide: the
    // paralegal and the read-only reviewer do not hold `approval.decide`. So
    // this is the case the product has to handle, and it handles it by
    // refusing rather than by warning beside a control that still works.
    await signIn(page, "employment.attorney@demo.local");
    await page.goto("/settings?section=approvals");

    await page
      .getByRole("checkbox", { name: /doit être décidée par quelqu’un d’autre que la personne/ })
      .check();
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();

    await expect(page.getByRole("main").getByRole("alert")).toContainText(/indécidable/i);

    // Nothing was stored: the box comes back unticked.
    await page.goto("/settings?section=approvals");
    await expect(
      page.getByRole("checkbox", { name: /doit être décidée par quelqu’un d’autre que la personne/ }),
    ).not.toBeChecked();
  });

  test("says why, rather than only that the rule is unavailable", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await page.goto("/settings?section=approvals");

    // The count is real rather than assumed: this firm has one person who may
    // decide, and the screen names the consequence instead of saying "not
    // available".
    await expect(page.getByRole("main")).toContainText(/Une seule personne peut décider ici/);
    await expect(page.getByRole("main")).toContainText(/indécidable/);
    await expect(page.getByRole("main")).toContainText(/Donnez d’abord à une deuxième personne le rôle d’avocat/);
  });
});

/**
 * A hand-built form post carrying the browser's real session.
 *
 * `page.request.post` does not send a `Secure` cookie over http, so a request
 * built that way arrives signed out and would pass on a redirect to /login
 * while proving nothing. Issued through `fetch` in the page, it carries the
 * session — which is what a request built by hand by a signed-in user actually
 * looks like.
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

test.describe("A request a newer analysis replaced", () => {
  const REFERENCE = "IMM-2026-001";

  /** Two runs, so the first run's request is no longer the live one. */
  async function analyseTwice(page: import("@playwright/test").Page) {
    await runAnalysis(page, REFERENCE);
    await runAnalysis(page, REFERENCE);
  }

  function supersededCards(page: import("@playwright/test").Page) {
    return page.getByRole("region", { name: /^Remplacées/ });
  }

  test("leaves one request waiting, not one per run", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await analyseTwice(page);
    await page.goto("/approvals?action=legal_analysis");

    const waiting = page
      .getByRole("region", { name: /^En attente d’une décision/ })
      .locator("li")
      .filter({ hasText: REFERENCE });
    await expect(waiting).toHaveCount(1);
  });

  test("says nobody decided it, rather than showing it as decided", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await analyseTwice(page);
    await page.goto("/approvals?action=legal_analysis");

    const superseded = supersededCards(page);
    await expect(superseded).toContainText(/personne ne l’a décidée/i);
    await expect(superseded).toContainText(/rien n’a été validé/i);
    // And never in the section that says a person took responsibility. Counted
    // rather than asserted absent from the region: the region itself may not
    // exist yet, and a `not.toContainText` against nothing fails for the wrong
    // reason.
    const inDecided = await page
      .getByRole("region", { name: /^Décidées/ })
      .locator("li")
      .filter({ hasText: "Remplacée" })
      .count();
    expect(inDecided).toBe(0);
  });

  test("offers no way to decide it", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await analyseTwice(page);
    await page.goto("/approvals?status=superseded");

    const superseded = supersededCards(page);
    await expect(superseded.locator("li").first()).toBeVisible();
    for (const label of ["Validée", "Validée avec modifications", "Nouvelle analyse demandée", "Refusée"]) {
      await expect(superseded.getByRole("button", { name: new RegExp(`^${label}`) })).toHaveCount(0);
    }
  });

  test("is refused by the server when the post is built by hand", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await analyseTwice(page);
    await page.goto("/approvals?status=superseded");

    // The card carries its own identifier, which is what a hand-built request
    // would use.
    const id = await supersededCards(page)
      .locator("li")
      .first()
      .getAttribute("id");
    expect(id).toMatch(/^approval-/);

    const result = await postForm(page, "/api/approvals/decide", {
      approvalId: (id ?? "").replace(/^approval-/, ""),
      decision: "approved",
      note: "",
      returnTo: "/approvals",
    });
    expect(result.url).toContain("problem=");

    await page.goto(result.url);
    const alert = page.locator("main").getByRole("alert");
    await expect(alert).toContainText(/plus rien à décider/i);
    // Not "somebody has already decided this one": nobody did, and saying so
    // would send the reader looking for a decision that does not exist.
    await expect(alert).not.toContainText(/déjà décidé/i);
  });

  test("keeps the row rather than deleting it", async ({ page }) => {
    await signIn(page, "immigration.attorney@demo.local");
    await analyseTwice(page);
    await openMatter(page, REFERENCE);
    await tabs(page).getByRole("link", { name: "Validations" }).click();
    await page.waitForURL(/tab=approvals/);

    const section = page.getByRole("region", { name: /^Validations sur ce dossier/ });
    await expect(section).toContainText("Remplacée");
    await expect(section).toContainText(/personne ne l’a décidée/i);
  });
});
