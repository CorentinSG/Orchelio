// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  SHARED_CLIENT_NAME,
  SHARED_DOCUMENT_NAME,
  SHARED_MATTER_TITLE,
  type TwoFirmFixture,
  createTwoFirmFixture,
} from "./fixtures";

/**
 * Orchelio — the data-access layer, exercised as the pages use it.
 *
 * The sibling suite (isolation.test.ts) proves the database client refuses an
 * unscoped query. This one proves the functions built on top of it — the ones
 * every screen actually calls — return one firm's records and no other's.
 *
 * The repositories are imported dynamically, after the fixture has pointed
 * DATABASE_URL at the throwaway database, because the application's Prisma
 * client is created on first import.
 */

let fixture: TwoFirmFixture;
let matters: typeof import("@/lib/data/matters");
let documents: typeof import("@/lib/data/documents");
let analyses: typeof import("@/lib/data/analyses");
let usage: typeof import("@/lib/data/usage");
let activity: typeof import("@/lib/data/activity");
let search: typeof import("@/lib/data/search");
let statistics: typeof import("@/lib/data/statistics");

beforeAll(async () => {
  fixture = await createTwoFirmFixture();

  matters = await import("@/lib/data/matters");
  documents = await import("@/lib/data/documents");
  analyses = await import("@/lib/data/analyses");
  usage = await import("@/lib/data/usage");
  activity = await import("@/lib/data/activity");
  search = await import("@/lib/data/search");
  statistics = await import("@/lib/data/statistics");
}, 180_000);

afterAll(async () => {
  await fixture?.dispose();
});

describe("getMatter", () => {
  it("returns the matter to its own firm", async () => {
    const matter = await matters.getMatter({
      matterId: fixture.immigration.matterId,
      firmId: fixture.immigration.firmId,
    });

    expect(matter?.reference).toBe(fixture.immigration.matterReference);
  });

  it("returns nothing when the firm does not own the matter", async () => {
    const matter = await matters.getMatter({
      matterId: fixture.employment.matterId,
      firmId: fixture.immigration.firmId,
    });

    expect(matter).toBeNull();
  });
});

describe("listMatters", () => {
  it("lists only the caller firm's matters", async () => {
    const list = await matters.listMatters({ firmId: fixture.employment.firmId });

    expect(list).toHaveLength(1);
    expect(list[0]?.reference).toBe(fixture.employment.matterReference);
  });

  it("does not leak through a free-text filter that both firms would match", async () => {
    const list = await matters.listMatters(
      { firmId: fixture.immigration.firmId },
      { search: SHARED_MATTER_TITLE },
    );

    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(fixture.immigration.matterId);
  });

  it("does not leak through a client-name filter that both firms would match", async () => {
    const list = await matters.listMatters(
      { firmId: fixture.employment.firmId },
      { search: SHARED_CLIENT_NAME },
    );

    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(fixture.employment.matterId);
  });
});

describe("documents", () => {
  it("refuses a download of another firm's document", async () => {
    const download = await documents.getDocumentForDownload({
      documentId: fixture.employment.documentId,
      firmId: fixture.immigration.firmId,
    });

    expect(download).toBeNull();
  });

  it("returns the firm's own document for download", async () => {
    const download = await documents.getDocumentForDownload({
      documentId: fixture.immigration.documentId,
      firmId: fixture.immigration.firmId,
    });

    expect(download?.filename).toBe(SHARED_DOCUMENT_NAME);
    expect(download?.storageKey).toContain("test-immigration");
  });
});

describe("analyses", () => {
  it("refuses to return another firm's analysis", async () => {
    const analysis = await analyses.getAnalysis({
      analysisId: fixture.employment.analysisId,
      firmId: fixture.immigration.firmId,
    });

    expect(analysis).toBeNull();
  });

  it("lists only the caller firm's recent analyses", async () => {
    const recent = await analyses.listRecentAnalyses({ firmId: fixture.immigration.firmId });

    expect(recent).toHaveLength(1);
    expect(recent[0]?.result).toContain("Test Immigration Law");
  });

  it("refuses to return another firm's review", async () => {
    const review = await analyses.getReview({
      reviewId: fixture.employment.reviewId,
      firmId: fixture.immigration.firmId,
    });

    expect(review).toBeNull();
  });
});

describe("search", () => {
  it("never returns a result from another firm", async () => {
    const results = await search.searchFirm({ firmId: fixture.immigration.firmId }, SHARED_CLIENT_NAME);

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((result) => result.firmId === fixture.immigration.firmId)).toBe(true);
  });

  it("returns each firm its own copy of an identically named document", async () => {
    const immigrationResults = await search.searchFirm(
      { firmId: fixture.immigration.firmId },
      SHARED_DOCUMENT_NAME,
    );
    const employmentResults = await search.searchFirm(
      { firmId: fixture.employment.firmId },
      SHARED_DOCUMENT_NAME,
    );

    expect(immigrationResults).toHaveLength(1);
    expect(employmentResults).toHaveLength(1);
    expect(immigrationResults[0]?.id).not.toBe(employmentResults[0]?.id);
  });

  it("refuses to run on a query too short to be meaningful", async () => {
    expect(await search.searchFirm({ firmId: fixture.immigration.firmId }, "a")).toEqual([]);
    expect(await search.searchFirm({ firmId: fixture.immigration.firmId }, " ")).toEqual([]);
  });
});

describe("statistics", () => {
  it("counts each firm separately", async () => {
    const immigration = await statistics.firmStatistics({ firmId: fixture.immigration.firmId });
    const employment = await statistics.firmStatistics({ firmId: fixture.employment.firmId });

    for (const stats of [immigration, employment]) {
      expect(stats.matters).toBe(1);
      expect(stats.documents).toBe(1);
      expect(stats.analyses).toBe(1);
      expect(stats.clients).toBe(1);
      expect(stats.pendingApprovals).toBe(1);
      expect(stats.openTasks).toBe(1);
      // 14 + 5 cents. A figure of 38 would mean the two firms had been summed.
      expect(stats.usageCostCents).toBe(19);
    }
  });
});

describe("usage and cost", () => {
  it("summarises one firm's usage only", async () => {
    const summary = await usage.usageSummary({ firmId: fixture.immigration.firmId });

    expect(summary.analyses).toBe(1);
    expect(summary.reviews).toBe(1);
    expect(summary.inputTokens).toBe(54_500);
    expect(summary.costCents).toBe(19);
    expect(summary.includesRealCharges).toBe(false);
  });

  it("formats a simulated cost as currency", () => {
    // \u00a0 is the non-breaking space fr-FR puts before the currency symbol.
    expect(usage.formatCost(19)).toBe("0,19\u00a0$US");
    expect(usage.formatCost(1842)).toBe("18,42\u00a0$US");
  });
});

describe("activity log", () => {
  it("returns only the caller firm's events", async () => {
    const events = await activity.listActivity({ firmId: fixture.immigration.firmId });

    expect(events.length).toBeGreaterThan(0);
    expect(events.every((event) => event.firmId === fixture.immigration.firmId)).toBe(true);
  });

  it("counts each firm's events separately", async () => {
    const immigration = await activity.countActivity({ firmId: fixture.immigration.firmId });
    const employment = await activity.countActivity({ firmId: fixture.employment.firmId });

    expect(immigration).toBe(1);
    expect(employment).toBe(1);
  });
});
