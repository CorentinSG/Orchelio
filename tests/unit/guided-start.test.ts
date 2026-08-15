import { describe, expect, it } from "vitest";

import {
  MAX_FILES_AT_ONCE,
  UNSORTED_CATEGORY,
  guidedReadiness,
} from "@/lib/start/guided";

/**
 * Orchelio — the short way in.
 *
 * The screen's whole claim is that a person can predict what one button will
 * do. So the tests are about what it *says* as much as what it allows: a step
 * that will not run has to appear, saying why, rather than being dropped from
 * the list.
 */

const ABLE = {
  canCreateMatter: true,
  canAddDocuments: true,
  canRunAnalysis: true,
  matterTypes: ["family_based"],
  aiFeatures: ["timeline"],
};

describe("when everything is in place", () => {
  const readiness = guidedReadiness(ABLE);

  it("offers the form", () => {
    expect(readiness.canOpen).toBe(true);
    expect(readiness.blocked).toBeNull();
  });

  it("lists four steps, all of which will run", () => {
    expect(readiness.steps.map((step) => step.key)).toEqual([
      "matter",
      "documents",
      "analysis",
      "decision",
    ]);
    expect(readiness.steps.every((step) => step.will)).toBe(true);
  });

  it("says the file never leaves the person's computer, where they decide", () => {
    const documents = readiness.steps.find((step) => step.key === "documents");
    expect(documents?.note).toMatch(/restent sur votre ordinateur/i);
    expect(documents?.note).toMatch(/n’en ouvre aucun/i);
  });

  it("ends by saying nothing was decided", () => {
    const decision = readiness.steps.at(-1);
    expect(decision?.key).toBe("decision");
    // The last thing on the page, and the point of the product.
    expect(decision?.note).toMatch(/personne ne s’est rangé/i);
    expect(decision?.note).toMatch(/cette personne, c’est vous/i);
  });
});

describe("when the form should not be offered", () => {
  it("refuses somebody who may not open a matter, and says who can", () => {
    const readiness = guidedReadiness({ ...ABLE, canCreateMatter: false });
    expect(readiness.canOpen).toBe(false);
    expect(readiness.blocked).toMatch(/appartient aux avocats et aux administrateurs/i);
    // A refusal without a route forward is a dead end.
    expect(readiness.blocked).toMatch(/pourrez y ajouter des documents/i);
  });

  it("refuses a firm that has chosen no matter types, and says where to fix it", () => {
    const readiness = guidedReadiness({ ...ABLE, matterTypes: [] });
    expect(readiness.canOpen).toBe(false);
    expect(readiness.blocked).toMatch(/Réglages, sous Types de dossier/i);
  });

  it("names the person's problem before the firm's when both apply", () => {
    // Two refusals at once: the one they can act on is the one that is shown.
    const readiness = guidedReadiness({
      ...ABLE,
      canCreateMatter: false,
      matterTypes: [],
    });
    expect(readiness.blocked).toMatch(/appartient aux avocats et aux administrateurs/i);
  });
});

describe("a step that will not run is shown, not hidden", () => {
  it("keeps the documents step when the role may not add them", () => {
    const readiness = guidedReadiness({ ...ABLE, canAddDocuments: false });
    const documents = readiness.steps.find((step) => step.key === "documents");

    expect(readiness.canOpen).toBe(true);
    expect(documents?.will).toBe(false);
    expect(documents?.note).toMatch(/dossier sera tout de même ouvert/i);
    // Dropping the step would let somebody believe their files were recorded.
    expect(readiness.steps).toHaveLength(4);
  });

  it("keeps the analysis step when the firm switched every feature off", () => {
    const readiness = guidedReadiness({ ...ABLE, aiFeatures: [] });
    const analysis = readiness.steps.find((step) => step.key === "analysis");

    expect(analysis?.will).toBe(false);
    expect(analysis?.note).toMatch(/a désactivé toutes les fonctions d’IA/i);
    expect(analysis?.note).toMatch(/Réglages, sous Fonctions d’IA/i);
  });

  it("tells a role that cannot run one apart from a firm that switched them off", () => {
    // Two different situations with two different remedies. One message for
    // both would send half its readers to a settings page they cannot fix.
    const byRole = guidedReadiness({ ...ABLE, canRunAnalysis: false });
    const byFirm = guidedReadiness({ ...ABLE, aiFeatures: [] });

    const noteFor = (r: ReturnType<typeof guidedReadiness>) =>
      r.steps.find((step) => step.key === "analysis")?.note;

    expect(noteFor(byRole)).toMatch(/Votre rôle ne lance pas d’analyse/i);
    expect(noteFor(byRole)).not.toBe(noteFor(byFirm));
  });

  it("still opens the matter when only the later steps are unavailable", () => {
    const readiness = guidedReadiness({
      ...ABLE,
      canAddDocuments: false,
      canRunAnalysis: false,
    });
    expect(readiness.canOpen).toBe(true);
    expect(readiness.steps.find((step) => step.key === "matter")?.will).toBe(true);
  });
});

describe("the two constants the screen depends on", () => {
  it("bounds one submission", () => {
    expect(MAX_FILES_AT_ONCE).toBeGreaterThan(1);
    expect(MAX_FILES_AT_ONCE).toBeLessThanOrEqual(25);
  });

  it("files a document as unsorted rather than guessing what it is", () => {
    // A wrong category is worse than none: the missing-documents check would
    // then believe something is on file that is not.
    expect(UNSORTED_CATEGORY).toBe("other");
  });
});
