import { describe, expect, it } from "vitest";

import {
  creatablePracticeAreas,
  looksLikeRealAddress,
  slugify,
  uniqueSlug,
  validateNewFirm,
} from "@/lib/platform/new-firm";
import { PRACTICE_AREAS, isPracticeAreaAvailable } from "@/lib/practice-areas";

/**
 * Orchelio — creating a firm.
 *
 * The phase's acceptance criterion runs through these rules, so they are tested
 * where they can be tested exactly: without a database, without a browser, and
 * including the cases a form would never send but a request could.
 */

describe("slugify", () => {
  it("makes a readable identifier", () => {
    expect(slugify("Dupont Immigration Law")).toBe("dupont-immigration-law");
    expect(slugify("Carter Employment & Labor Law")).toBe("carter-employment-labor-law");
  });

  it("folds accents rather than dropping them", () => {
    // Dropping them would give "lefvre-associs", which the firm would not
    // recognise as its own name.
    expect(slugify("Lefèvre & Associés")).toBe("lefevre-associes");
    expect(slugify("Müller Rechtsanwälte")).toBe("muller-rechtsanwalte");
  });

  it("leaves no leading, trailing or doubled separator", () => {
    expect(slugify("  ---Hello   World!!!  ")).toBe("hello-world");
    expect(slugify("A / B / C")).toBe("a-b-c");
  });

  it("returns nothing for a name with nothing in it", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("   ")).toBe("");
  });

  it("bounds the length", () => {
    expect(slugify("x".repeat(200))).toHaveLength(60);
  });
});

describe("uniqueSlug", () => {
  it("keeps the plain slug when it is free", () => {
    expect(uniqueSlug("smith-law", new Set())).toBe("smith-law");
  });

  it("suffixes rather than refusing", () => {
    // Two firms may legitimately share a name. Refusing the second would be a
    // rule about the world rather than about the database.
    expect(uniqueSlug("smith-law", new Set(["smith-law"]))).toBe("smith-law-2");
    expect(uniqueSlug("smith-law", new Set(["smith-law", "smith-law-2"]))).toBe("smith-law-3");
  });

  it("still produces something for an empty base", () => {
    expect(uniqueSlug("", new Set())).toBe("firm-2");
  });
});

describe("validateNewFirm", () => {
  const valid = {
    name: "Rivera Immigration Group",
    primaryPracticeArea: "immigration",
    administratorName: "Dana Rivera",
    administratorEmail: "dana@rivera.local",
  };

  it("accepts a complete form", () => {
    expect(validateNewFirm(valid)).toEqual({ ok: true });
  });

  it("refuses a name too short to identify anything", () => {
    expect(validateNewFirm({ ...valid, name: "R" }).ok).toBe(false);
    expect(validateNewFirm({ ...valid, name: "   " }).ok).toBe(false);
  });

  it("refuses a name that produces no identifier", () => {
    expect(validateNewFirm({ ...valid, name: "!!!!" }).ok).toBe(false);
  });

  it("refuses a practice area with no template", () => {
    // A firm created into an empty template could not finish its questionnaire:
    // a dead end two screens later, which is worse than a refusal here.
    const planned = PRACTICE_AREAS.find((area) => !isPracticeAreaAvailable(area.key));
    expect(planned, "the fixture assumes at least one planned area").toBeDefined();

    const result = validateNewFirm({ ...valid, primaryPracticeArea: planned!.key });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("pas encore de modèle");
  });

  it("requires an administrator with a plausible address", () => {
    expect(validateNewFirm({ ...valid, administratorName: "" }).ok).toBe(false);
    expect(validateNewFirm({ ...valid, administratorEmail: "dana" }).ok).toBe(false);
    expect(validateNewFirm({ ...valid, administratorEmail: "@rivera.local" }).ok).toBe(false);
    expect(validateNewFirm({ ...valid, administratorEmail: "dana@" }).ok).toBe(false);
  });
});

describe("what may be created", () => {
  it("offers only practice areas with a full template", () => {
    const offered = creatablePracticeAreas();
    expect(offered.length).toBeGreaterThan(0);
    for (const area of offered) {
      expect(isPracticeAreaAvailable(area.key)).toBe(true);
    }
  });
});

describe("looksLikeRealAddress", () => {
  it("recognises the reserved domains as invented", () => {
    expect(looksLikeRealAddress("dana@rivera.local")).toBe(false);
    expect(looksLikeRealAddress("dana@rivera.example")).toBe(false);
  });

  it("flags anything that could reach a real person", () => {
    expect(looksLikeRealAddress("dana@rivera.com")).toBe(true);
  });
});
