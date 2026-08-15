import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GUIDE_STEPS, GUIDE_STEP_COUNT, guideAccounts, guideAccountsExist } from "@/lib/guide";
import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";

/**
 * Orchelio — the guided demonstration.
 *
 * A walkthrough is prose that goes stale silently: a screen moves, and the
 * document keeps confidently sending people to a page that answers 404. So the
 * steps are data, and this checks the two things that rot — the routes and the
 * accounts — against the filesystem and against the seed.
 */

const ROOT = process.cwd();

/** Does a route exist for this href? Checks both the public and the app group. */
function routeExists(href: string): boolean {
  const path = href.split("?")[0] ?? "";
  const segments = path.split("/").filter(Boolean);

  const candidates = [
    join(ROOT, "src", "app", ...segments, "page.tsx"),
    join(ROOT, "src", "app", "(app)", ...segments, "page.tsx"),
  ];

  return candidates.some((candidate) => existsSync(candidate));
}

describe("the guided demonstration", () => {
  it("has exactly twenty-one steps", () => {
    // The number is in the specification, and the constant is rendered on the
    // page — so the two must be the same number, not two numbers that agree.
    expect(GUIDE_STEP_COUNT).toBe(21);
    expect(GUIDE_STEPS).toHaveLength(GUIDE_STEP_COUNT);
  });

  it("numbers them 1 to 21, in order, with no gaps", () => {
    expect(GUIDE_STEPS.map((step) => step.number)).toEqual(
      Array.from({ length: GUIDE_STEP_COUNT }, (_, index) => index + 1),
    );
  });

  it("sends every step to a route that exists", () => {
    for (const step of GUIDE_STEPS) {
      expect(step.href.startsWith("/"), `step ${step.number} href is not a path`).toBe(true);
      expect(routeExists(step.href), `step ${step.number} points at ${step.href}`).toBe(true);
    }
  });

  it("names only accounts the demonstration seeds", () => {
    const seeded = new Set(DEMO_ACCOUNTS.map((account) => account.email));
    for (const email of guideAccounts()) {
      expect(seeded.has(email), `${email} is not a seeded account`).toBe(true);
    }
    expect(guideAccountsExist()).toBe(true);
  });

  it("tells the reader both what to do and what to look for", () => {
    // A step that says only "open the dashboard" is a link, not a walkthrough.
    // The title is only required to exist — "Tasks" is a perfectly good one.
    for (const step of GUIDE_STEPS) {
      expect(step.title.trim(), `step ${step.number}`).not.toBe("");
      expect(step.action.length, `step ${step.number}`).toBeGreaterThan(20);
      expect(step.notice.length, `step ${step.number}`).toBeGreaterThan(30);
    }
  });

  it("ends on the acceptance criterion for this phase", () => {
    const last = GUIDE_STEPS[GUIDE_STEPS.length - 1]!;
    expect(last.href).toBe("/onboarding");
    expect(GUIDE_STEPS[19]!.href).toBe("/admin/firms");
  });

  it("covers what Orchelio refuses to do, not only what it does", () => {
    // The refusals are the substance of the product. A walkthrough that skipped
    // them would be describing something else.
    const text = GUIDE_STEPS.map((step) => `${step.action} ${step.notice}`).join(" ").toLowerCase();
    for (const subject of ["aucun bouton d’envoi", "cadenas", "refus", "conclusion", "simul"]) {
      expect(text.includes(subject), `no step mentions "${subject}"`).toBe(true);
    }
  });
});
