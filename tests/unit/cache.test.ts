import { beforeEach, describe, expect, it } from "vitest";

import {
  CACHEABLE_MODEL_NAMES,
  UncacheableModelError,
  catalogueCacheSize,
  clearCatalogueCache,
  platformCatalogue,
} from "@/lib/cache";
import { FIRM_SCOPED_MODELS, PLATFORM_MODELS } from "@/lib/data/firm-scope";

/**
 * A cache is a place where one request's answer is handed to another. In a
 * multi-tenant product that is the same shape as the bug the architecture
 * exists to prevent — and worse, because no query is involved, so the firm
 * scoping guard never sees it.
 *
 * These tests are what stop a future convenience from becoming a breach.
 */

describe("what may be cached across requests", () => {
  it("caches only platform-wide catalogues", () => {
    expect([...CACHEABLE_MODEL_NAMES].sort()).toEqual([
      "MatterType",
      "PracticeArea",
      "WorkflowTemplate",
    ]);
  });

  it("refuses every firm-scoped model, without exception", () => {
    for (const model of FIRM_SCOPED_MODELS) {
      expect(() => platformCatalogue(model, "all", async () => [])).toThrow(UncacheableModelError);
    }
  });

  it("names the model and the rule when it refuses", () => {
    try {
      platformCatalogue("Matter", "all", async () => []);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as Error).message).toContain("Matter");
      expect((error as Error).message).toContain("read fresh");
    }
  });

  it("never allows a cacheable model that is not classified as platform-wide", () => {
    // Belt and braces: the cacheable list is a subset of the models the firm
    // scoping guard already agrees belong to no firm. The two lists cannot
    // drift apart without this failing.
    for (const model of CACHEABLE_MODEL_NAMES) {
      expect(PLATFORM_MODELS.has(model)).toBe(true);
      expect(FIRM_SCOPED_MODELS.has(model)).toBe(false);
    }
  });

  it("refuses an unknown model rather than assuming it is safe", () => {
    // Failing closed matters: a model nobody classified is not a model anybody
    // has reasoned about.
    expect(() => platformCatalogue("SomeNewModel", "all", async () => [])).toThrow(
      UncacheableModelError,
    );
  });
});

describe("the catalogue cache itself", () => {
  beforeEach(() => {
    clearCatalogueCache();
  });

  it("loads once and serves the same answer afterwards", async () => {
    let loads = 0;
    const read = platformCatalogue("PracticeArea", "all", async () => {
      loads += 1;
      return [{ key: "immigration" }];
    });

    expect(await read()).toEqual([{ key: "immigration" }]);
    expect(await read()).toEqual([{ key: "immigration" }]);
    expect(loads).toBe(1);
  });

  it("keeps separate keys separate", async () => {
    const a = platformCatalogue("MatterType", "immigration", async () => ["family_based"]);
    const b = platformCatalogue("MatterType", "employment_law", async () => ["unpaid_wages"]);

    expect(await a()).toEqual(["family_based"]);
    expect(await b()).toEqual(["unpaid_wages"]);
    expect(catalogueCacheSize()).toBe(2);
  });

  it("is emptied by clearCatalogueCache, so a reseeded instance starts clean", async () => {
    let loads = 0;
    const read = platformCatalogue("WorkflowTemplate", "all", async () => {
      loads += 1;
      return [];
    });

    await read();
    clearCatalogueCache();
    await read();

    expect(loads).toBe(2);
  });
});
