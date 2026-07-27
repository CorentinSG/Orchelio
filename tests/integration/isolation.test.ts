// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { FirmScopeError } from "@/lib/data/firm-scope";
import {
  SHARED_CLIENT_NAME,
  SHARED_DOCUMENT_NAME,
  SHARED_MATTER_TITLE,
  type TwoFirmFixture,
  createTwoFirmFixture,
} from "./fixtures";

/**
 * Orchelio — firm isolation.
 *
 * This is the suite the whole product rests on. Two firms exist, holding
 * deliberately similar records: the same client name, the same document
 * filename, the same matter title. Every test below asks the same question in a
 * different way — can one firm reach the other's copy? — and the answer must
 * always be no.
 *
 * The tests run against a real migrated SQLite database through the same
 * guarded client the application uses, so they exercise the actual enforcement
 * rather than a stand-in for it.
 */

let fixture: TwoFirmFixture;

beforeAll(async () => {
  fixture = await createTwoFirmFixture();
}, 120_000);

afterAll(async () => {
  await fixture?.dispose();
});

describe("matters", () => {
  it("an immigration user cannot open an employment matter", async () => {
    const found = await fixture.prisma.matter.findFirst({
      where: { id: fixture.employment.matterId, firmId: fixture.immigration.firmId },
    });

    expect(found).toBeNull();
  });

  it("an employment user cannot open an immigration matter", async () => {
    const found = await fixture.prisma.matter.findFirst({
      where: { id: fixture.immigration.matterId, firmId: fixture.employment.firmId },
    });

    expect(found).toBeNull();
  });

  it("a URL copied from the other firm resolves to nothing, not to a record", async () => {
    // The identifier is real and the row exists — it just is not this firm's.
    const exists = await fixture.prisma.matter.findFirst({
      where: { id: fixture.employment.matterId, firmId: fixture.employment.firmId },
    });
    expect(exists).not.toBeNull();

    const acrossTheBoundary = await fixture.prisma.matter.findFirst({
      where: { id: fixture.employment.matterId, firmId: fixture.immigration.firmId },
    });
    expect(acrossTheBoundary).toBeNull();
  });

  it("a matter list returns only the caller's own matters", async () => {
    const matters = await fixture.prisma.matter.findMany({
      where: { firmId: fixture.immigration.firmId },
    });

    expect(matters).toHaveLength(1);
    expect(matters[0]?.reference).toBe(fixture.immigration.matterReference);
    expect(matters.every((matter) => matter.firmId === fixture.immigration.firmId)).toBe(true);
  });

  it("a matter title shared by both firms still returns only one", async () => {
    const matters = await fixture.prisma.matter.findMany({
      where: { firmId: fixture.immigration.firmId, title: SHARED_MATTER_TITLE },
    });

    expect(matters).toHaveLength(1);
    expect(matters[0]?.firmId).toBe(fixture.immigration.firmId);
  });
});

describe("documents", () => {
  it("a document cannot be downloaded from another firm", async () => {
    const download = await fixture.prisma.document.findFirst({
      where: { id: fixture.employment.documentId, firmId: fixture.immigration.firmId },
      select: { storageKey: true },
    });

    expect(download).toBeNull();
  });

  it("an identical filename in both firms never crosses over", async () => {
    const documents = await fixture.prisma.document.findMany({
      where: { firmId: fixture.immigration.firmId, filename: SHARED_DOCUMENT_NAME },
    });

    expect(documents).toHaveLength(1);
    expect(documents[0]?.storageKey).toContain("test-immigration");
  });
});

describe("clients", () => {
  it("a client with the same name exists in both firms and stays in each", async () => {
    const immigrationClients = await fixture.prisma.clientProfile.findMany({
      where: { firmId: fixture.immigration.firmId, displayName: SHARED_CLIENT_NAME },
    });
    const employmentClients = await fixture.prisma.clientProfile.findMany({
      where: { firmId: fixture.employment.firmId, displayName: SHARED_CLIENT_NAME },
    });

    expect(immigrationClients).toHaveLength(1);
    expect(employmentClients).toHaveLength(1);
    expect(immigrationClients[0]?.id).not.toBe(employmentClients[0]?.id);
  });
});

describe("analyses and reviews", () => {
  it("analyses do not mix between firms", async () => {
    const analyses = await fixture.prisma.aIAnalysis.findMany({
      where: { firmId: fixture.immigration.firmId },
    });

    expect(analyses).toHaveLength(1);
    expect(analyses[0]?.id).toBe(fixture.immigration.analysisId);
    expect(analyses[0]?.result).toContain("Test Immigration Law");
  });

  it("an analysis cannot be read from the other firm", async () => {
    const found = await fixture.prisma.aIAnalysis.findFirst({
      where: { id: fixture.employment.analysisId, firmId: fixture.immigration.firmId },
    });

    expect(found).toBeNull();
  });

  it("a review cannot be read from the other firm", async () => {
    const found = await fixture.prisma.aIReview.findFirst({
      where: { id: fixture.employment.reviewId, firmId: fixture.immigration.firmId },
    });

    expect(found).toBeNull();
  });
});

describe("approvals, tasks and drafts", () => {
  it("keeps pending approvals separate", async () => {
    const approvals = await fixture.prisma.approvalRequest.findMany({
      where: { firmId: fixture.immigration.firmId, status: "pending" },
    });

    expect(approvals).toHaveLength(1);
    expect(approvals[0]?.id).toBe(fixture.immigration.approvalId);
  });

  it("keeps tasks separate", async () => {
    const tasks = await fixture.prisma.task.findMany({
      where: { firmId: fixture.employment.firmId },
    });

    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.id).toBe(fixture.employment.taskId);
  });

  it("keeps draft communications separate", async () => {
    const drafts = await fixture.prisma.draftCommunication.findMany({
      where: { firmId: fixture.immigration.firmId },
    });

    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.id).toBe(fixture.immigration.draftId);
  });
});

describe("statistics", () => {
  it("counts each firm's records separately", async () => {
    const [immigrationMatters, employmentMatters, allMatters] = await Promise.all([
      fixture.prisma.matter.count({ where: { firmId: fixture.immigration.firmId } }),
      fixture.prisma.matter.count({ where: { firmId: fixture.employment.firmId } }),
      fixture.prisma.matter.count({ where: { firmId: { in: [fixture.immigration.firmId, fixture.employment.firmId] } } }),
    ]);

    expect(immigrationMatters).toBe(1);
    expect(employmentMatters).toBe(1);
    // Two firms, one matter each: a per-firm count that returned 2 would mean
    // the boundary had failed.
    expect(allMatters).toBe(2);
  });
});

describe("costs", () => {
  it("totals usage per firm, never across firms", async () => {
    const immigration = await fixture.prisma.usageRecord.aggregate({
      where: { firmId: fixture.immigration.firmId },
      _sum: { costCents: true, inputTokens: true },
    });
    const employment = await fixture.prisma.usageRecord.aggregate({
      where: { firmId: fixture.employment.firmId },
      _sum: { costCents: true, inputTokens: true },
    });

    // 14 + 5 cents per firm. Anything higher would mean one firm was being
    // charged for the other's usage.
    expect(immigration._sum.costCents).toBe(19);
    expect(employment._sum.costCents).toBe(19);
    expect(immigration._sum.inputTokens).toBe(54_500);
  });
});

describe("activity log", () => {
  it("returns only the caller firm's events", async () => {
    const events = await fixture.prisma.auditEvent.findMany({
      where: { firmId: fixture.immigration.firmId },
    });

    expect(events.length).toBeGreaterThan(0);
    expect(events.every((event) => event.firmId === fixture.immigration.firmId)).toBe(true);
    expect(events.some((event) => event.resourceId === fixture.employment.matterId)).toBe(false);
  });
});

describe("the guard itself", () => {
  it("refuses a read of matters with no firm named", async () => {
    await expect(fixture.prisma.matter.findMany({})).rejects.toThrow(FirmScopeError);
  });

  it("refuses a read that filters only by identifier", async () => {
    await expect(
      fixture.prisma.matter.findFirst({ where: { id: fixture.employment.matterId } }),
    ).rejects.toThrow(FirmScopeError);
  });

  it("refuses an unscoped read of documents, analyses, costs and the activity log", async () => {
    await expect(fixture.prisma.document.findMany({})).rejects.toThrow(FirmScopeError);
    await expect(fixture.prisma.aIAnalysis.findMany({})).rejects.toThrow(FirmScopeError);
    await expect(fixture.prisma.usageRecord.aggregate({ _sum: { costCents: true } })).rejects.toThrow(
      FirmScopeError,
    );
    await expect(fixture.prisma.auditEvent.findMany({})).rejects.toThrow(FirmScopeError);
  });

  it("refuses a create with no firm named", async () => {
    await expect(
      fixture.prisma.task.create({ data: { title: "Orphan task" } as never }),
    ).rejects.toThrow(FirmScopeError);
  });

  it("still allows queries against platform-wide catalogues", async () => {
    await expect(fixture.prisma.practiceArea.findMany({})).resolves.toBeInstanceOf(Array);
    await expect(fixture.prisma.firm.findMany({})).resolves.toHaveLength(2);
  });
});
