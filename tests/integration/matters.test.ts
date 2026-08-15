// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  SHARED_CLIENT_NAME,
  type TwoFirmFixture,
  createTwoFirmFixture,
} from "./fixtures";

/**
 * Orchelio — matters and documents, written as well as read.
 *
 * The sibling suites prove that *reads* stay inside one firm. This one covers
 * the paths Phase 5 added that also *write*: creating a matter, attaching a
 * document, marking one verified, recording activity. A write that crosses the
 * boundary is worse than a read that does — it leaves the other firm's file
 * altered rather than merely seen — so each one is tested twice: once inside
 * the firm that owns the record, once with an identifier borrowed from the
 * other firm.
 *
 * "Borrowed identifier" is the shape of the real attack here. Every id below is
 * genuine; the only thing wrong with it is whose it is.
 */

let fixture: TwoFirmFixture;
let matters: typeof import("@/lib/data/matters");
let documents: typeof import("@/lib/data/documents");
let activity: typeof import("@/lib/data/activity");
let statistics: typeof import("@/lib/data/statistics");

beforeAll(async () => {
  fixture = await createTwoFirmFixture();

  matters = await import("@/lib/data/matters");
  documents = await import("@/lib/data/documents");
  activity = await import("@/lib/data/activity");
  statistics = await import("@/lib/data/statistics");
}, 180_000);

afterAll(async () => {
  await fixture?.dispose();
});

describe("creating a matter", () => {
  it("creates it in the caller's firm and nowhere else", async () => {
    const created = await matters.createMatter(
      { firmId: fixture.immigration.firmId },
      {
        title: "Adjustment of status",
        clientName: "Priya Raman",
        matterTypeKey: "family_based",
        practiceAreaKey: "immigration",
        status: "lead",
        createdById: fixture.immigration.attorneyId,
        fields: { nationality: "Indian" },
      },
    );

    expect(created.firmId).toBe(fixture.immigration.firmId);

    const fromOwner = await matters.getMatter({
      matterId: created.id,
      firmId: fixture.immigration.firmId,
    });
    const fromNeighbour = await matters.getMatter({
      matterId: created.id,
      firmId: fixture.employment.firmId,
    });

    expect(fromOwner?.title).toBe("Adjustment of status");
    expect(fromNeighbour).toBeNull();
  });

  it("reuses a client of the same name within the firm, and never the other firm's", async () => {
    // Both firms already hold a client called Alex Rivera. A create that
    // matched on name alone would attach this matter to the wrong firm's client.
    const created = await matters.createMatter(
      { firmId: fixture.employment.firmId },
      {
        title: "Second matter for a returning client",
        clientName: SHARED_CLIENT_NAME,
        matterTypeKey: "unpaid_wages",
        practiceAreaKey: "employment_law",
        status: "lead",
        createdById: fixture.employment.attorneyId,
        fields: {},
      },
    );

    const detail = await matters.getMatter({
      matterId: created.id,
      firmId: fixture.employment.firmId,
    });

    expect(detail?.clientProfile?.displayName).toBe(SHARED_CLIENT_NAME);
    expect(detail?.clientProfile?.firmId).toBe(fixture.employment.firmId);
    expect(detail?.clientProfile?.id).not.toBe(fixture.immigration.clientId);

    // And no duplicate was created inside the employment firm either.
    const employmentClients = await fixture.prisma.clientProfile.findMany({
      where: { firmId: fixture.employment.firmId, displayName: SHARED_CLIENT_NAME },
    });
    expect(employmentClients).toHaveLength(1);
  });

  it("stores practice-area fields as given", async () => {
    const created = await matters.createMatter(
      { firmId: fixture.immigration.firmId },
      {
        title: "Asylum claim",
        clientName: "Nadia Oduya",
        matterTypeKey: "family_based",
        practiceAreaKey: "immigration",
        status: "lead",
        createdById: fixture.immigration.attorneyId,
        fields: { nationality: "Kenyan", dependants: 2, i94_available: true },
      },
    );

    expect(JSON.parse(created.fields)).toEqual({
      nationality: "Kenyan",
      dependants: 2,
      i94_available: true,
    });
  });
});

describe("matter references", () => {
  it("numbers sequentially within a firm", async () => {
    const scope = { firmId: fixture.employment.firmId };
    const first = await matters.nextReference(scope, "employment_law");

    await matters.createMatter(scope, {
      title: "Overtime claim",
      clientName: "Ruth Callahan",
      matterTypeKey: "unpaid_wages",
      practiceAreaKey: "employment_law",
      status: "lead",
      createdById: fixture.employment.attorneyId,
      fields: {},
    });

    const second = await matters.nextReference(scope, "employment_law");

    expect(first).toMatch(/^EMP-\d{4}-\d{3}$/);
    expect(Number(second.slice(-3))).toBe(Number(first.slice(-3)) + 1);
  });

  it("does not count the other firm's matters", async () => {
    // Both firms number from 001. If numbering spanned firms, one firm's
    // creations would silently advance the other's — and the reference a lawyer
    // quotes on a filing would have gaps it cannot explain.
    const employmentBefore = await matters.nextReference(
      { firmId: fixture.employment.firmId },
      "immigration",
    );

    await matters.createMatter(
      { firmId: fixture.immigration.firmId },
      {
        title: "Consular processing",
        clientName: "Yusuf Demir",
        matterTypeKey: "family_based",
        practiceAreaKey: "immigration",
        status: "lead",
        createdById: fixture.immigration.attorneyId,
        fields: {},
      },
    );

    const employmentAfter = await matters.nextReference(
      { firmId: fixture.employment.firmId },
      "immigration",
    );

    expect(employmentAfter).toBe(employmentBefore);
  });
});

describe("matterDetail", () => {
  it("returns the documents, tasks and intake of its own firm", async () => {
    const detail = await matters.matterDetail({
      matterId: fixture.immigration.matterId,
      firmId: fixture.immigration.firmId,
    });

    expect(detail?.documents.map((document) => document.id)).toEqual([
      fixture.immigration.documentId,
    ]);
    expect(detail?.tasks.map((task) => task.id)).toEqual([fixture.immigration.taskId]);
    expect(detail?.intakeResponses.map((intake) => intake.id)).toEqual([
      fixture.immigration.intakeId,
    ]);
  });

  it("returns nothing for a matter identifier borrowed from the other firm", async () => {
    const detail = await matters.matterDetail({
      matterId: fixture.employment.matterId,
      firmId: fixture.immigration.firmId,
    });

    expect(detail).toBeNull();
  });
});

describe("filters", () => {
  it("filters by status within the firm", async () => {
    const active = await matters.listMatters(
      { firmId: fixture.immigration.firmId },
      { status: "active" },
    );
    const leads = await matters.listMatters(
      { firmId: fixture.immigration.firmId },
      { status: "lead" },
    );

    expect(active.every((matter) => matter.status === "active")).toBe(true);
    expect(leads.every((matter) => matter.status === "lead")).toBe(true);
    expect(active.every((matter) => matter.firmId === fixture.immigration.firmId)).toBe(true);
  });

  it("filters by matter type without reaching the other firm's types", async () => {
    // "unpaid_wages" exists in the catalogue and is used by the employment
    // firm. Asked for by the immigration firm, it must return nothing rather
    // than the employment firm's matters.
    const list = await matters.listMatters(
      { firmId: fixture.immigration.firmId },
      { matterTypeKey: "unpaid_wages" },
    );

    expect(list).toEqual([]);
  });

  it("filters by the side represented", async () => {
    const scope = { firmId: fixture.employment.firmId };

    await matters.createMatter(scope, {
      title: "Defence of a wage claim",
      clientName: "Northwind Logistics",
      matterTypeKey: "unpaid_wages",
      practiceAreaKey: "employment_law",
      status: "lead",
      representationSide: "employer",
      createdById: fixture.employment.attorneyId,
      fields: {},
    });

    const employerSide = await matters.listMatters(scope, { representationSide: "employer" });
    const employeeSide = await matters.listMatters(scope, { representationSide: "employee" });

    expect(employerSide).toHaveLength(1);
    expect(employerSide[0]?.title).toBe("Defence of a wage claim");
    expect(employeeSide).toEqual([]);
  });

  it("counts by status for one firm only", async () => {
    const counts = await matters.matterCountsByStatus({ firmId: fixture.employment.firmId });
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const all = await matters.listMatters({ firmId: fixture.employment.firmId });

    expect(total).toBe(all.length);
  });
});

describe("attaching a document", () => {
  it("attaches it to a matter of the caller's firm", async () => {
    const document = await documents.addDocument(
      { firmId: fixture.immigration.firmId },
      {
        matterId: fixture.immigration.matterId,
        filename: "i-797-notice.pdf",
        category: "uscis_notice",
        mimeType: "application/pdf",
        sizeBytes: 245_000,
        uploadedById: fixture.immigration.attorneyId,
      },
    );

    expect(document?.firmId).toBe(fixture.immigration.firmId);
    expect(document?.verified).toBe(false);
    expect(document?.storageKey).toContain(fixture.immigration.firmId);
  });

  it("refuses a matter identifier borrowed from the other firm", async () => {
    const before = await documents.countDocuments({ firmId: fixture.employment.firmId });

    const document = await documents.addDocument(
      { firmId: fixture.immigration.firmId },
      {
        matterId: fixture.employment.matterId,
        filename: "planted.pdf",
        category: "other",
        mimeType: "application/pdf",
        sizeBytes: 1_000,
        uploadedById: fixture.immigration.attorneyId,
      },
    );

    expect(document).toBeNull();

    // Nothing was written anywhere — not into the caller's firm under a foreign
    // matter, and not into the other firm's.
    expect(await documents.countDocuments({ firmId: fixture.employment.firmId })).toBe(before);
    const planted = await fixture.prisma.document.findMany({
      where: { firmId: fixture.immigration.firmId, filename: "planted.pdf" },
    });
    expect(planted).toEqual([]);
  });

  it("arrives unverified, because nobody has looked at it yet", async () => {
    const document = await documents.addDocument(
      { firmId: fixture.employment.firmId },
      {
        matterId: fixture.employment.matterId,
        filename: "march-pay-stub.pdf",
        category: "pay_stub",
        mimeType: "application/pdf",
        sizeBytes: 88_000,
        uploadedById: fixture.employment.attorneyId,
      },
    );

    expect(document?.verified).toBe(false);
    expect(document?.analysisStatus).toBe("pending");
  });
});

describe("verifying a document", () => {
  it("marks the firm's own document as checked by a person", async () => {
    const changed = await documents.setDocumentVerified(
      { firmId: fixture.immigration.firmId },
      fixture.immigration.documentId,
      true,
    );

    expect(changed).toBe(1);

    const document = await documents.getDocument({
      documentId: fixture.immigration.documentId,
      firmId: fixture.immigration.firmId,
    });
    expect(document?.verified).toBe(true);
  });

  it("changes nothing when the document belongs to the other firm", async () => {
    const changed = await documents.setDocumentVerified(
      { firmId: fixture.immigration.firmId },
      fixture.employment.documentId,
      true,
    );

    expect(changed).toBe(0);

    const untouched = await documents.getDocument({
      documentId: fixture.employment.documentId,
      firmId: fixture.employment.firmId,
    });
    expect(untouched?.verified).toBe(false);
  });
});

describe("document categories on a matter", () => {
  it("lists the categories present, for one firm's matter", async () => {
    const categories = await documents.documentCategories(
      { firmId: fixture.immigration.firmId },
      fixture.immigration.matterId,
    );

    expect(categories).toContain("passport");
    expect(categories).toContain("uscis_notice");
    // Categories the employment firm files under never appear here.
    expect(categories).not.toContain("pay_stub");
  });

  it("returns nothing for a matter identifier borrowed from the other firm", async () => {
    const categories = await documents.documentCategories(
      { firmId: fixture.immigration.firmId },
      fixture.employment.matterId,
    );

    expect(categories).toEqual([]);
  });
});

describe("recording activity on a matter", () => {
  it("updates the firm's own matter", async () => {
    const before = await matters.getMatter({
      matterId: fixture.immigration.matterId,
      firmId: fixture.immigration.firmId,
    });

    await matters.touchMatter({ firmId: fixture.immigration.firmId }, fixture.immigration.matterId);

    const after = await matters.getMatter({
      matterId: fixture.immigration.matterId,
      firmId: fixture.immigration.firmId,
    });

    expect(after!.lastActivityAt.getTime()).toBeGreaterThanOrEqual(
      before!.lastActivityAt.getTime(),
    );
  });

  it("leaves the other firm's matter alone", async () => {
    const before = await matters.getMatter({
      matterId: fixture.employment.matterId,
      firmId: fixture.employment.firmId,
    });

    await matters.touchMatter({ firmId: fixture.immigration.firmId }, fixture.employment.matterId);

    const after = await matters.getMatter({
      matterId: fixture.employment.matterId,
      firmId: fixture.employment.firmId,
    });

    expect(after!.lastActivityAt.getTime()).toBe(before!.lastActivityAt.getTime());
  });
});

describe("the dashboard's practice-area counts", () => {
  const NOW = new Date("2026-07-28T12:00:00Z");

  it("counts an immigration firm's own matters only", async () => {
    const counts = await statistics.practiceAreaCounts(
      { firmId: fixture.immigration.firmId },
      "immigration",
      NOW,
    );
    const own = await matters.listMatters({ firmId: fixture.immigration.firmId });

    // Every count *of matters* is bounded by this firm's own matters. A figure
    // above that would mean the other firm had been included. `monthly_usage`
    // counts tokens rather than matters, so it is excluded rather than being
    // compared against the wrong thing.
    for (const [key, value] of Object.entries(counts)) {
      if (key === "monthly_usage") continue;
      expect(value, key).toBeLessThanOrEqual(own.length);
    }
    expect(counts["new_leads"]).toBe(
      own.filter((matter) => matter.status === "lead" && matter.closedAt === null).length,
    );
  });

  it("counts each side separately for an employment firm", async () => {
    const scope = { firmId: fixture.employment.firmId };
    const before = await statistics.practiceAreaCounts(scope, "employment_law", NOW);

    await matters.createMatter(scope, {
      title: "A second employer-side matter",
      clientName: "Kestrel Manufacturing",
      matterTypeKey: "unpaid_wages",
      practiceAreaKey: "employment_law",
      status: "lead",
      representationSide: "employer",
      createdById: fixture.employment.attorneyId,
      fields: {},
    });

    const after = await statistics.practiceAreaCounts(scope, "employment_law", NOW);

    expect(after["employer_side_matters"]).toBe((before["employer_side_matters"] ?? 0) + 1);
    expect(after["employee_side_matters"]).toBe(before["employee_side_matters"]);
  });

  it("does not move the other firm's counts when one firm gains a matter", async () => {
    const before = await statistics.practiceAreaCounts(
      { firmId: fixture.immigration.firmId },
      "immigration",
      NOW,
    );

    await matters.createMatter(
      { firmId: fixture.employment.firmId },
      {
        title: "Another wage claim",
        clientName: "Iris Nakamura",
        matterTypeKey: "unpaid_wages",
        practiceAreaKey: "employment_law",
        status: "lead",
        createdById: fixture.employment.attorneyId,
        fields: {},
      },
    );

    const after = await statistics.practiceAreaCounts(
      { firmId: fixture.immigration.firmId },
      "immigration",
      NOW,
    );

    expect(after).toEqual(before);
  });

  it("counts a matter as missing an identity document until one is filed", async () => {
    const scope = { firmId: fixture.immigration.firmId };

    const created = await matters.createMatter(scope, {
      title: "No documents yet",
      clientName: "Tomas Lindqvist",
      matterTypeKey: "family_based",
      practiceAreaKey: "immigration",
      status: "lead",
      createdById: fixture.immigration.attorneyId,
      fields: {},
    });

    const before = await statistics.practiceAreaCounts(scope, "immigration", NOW);

    // A family-based petition expects three identity documents and a marriage
    // certificate. Filing the identity ones removes this matter from that
    // count — and from that count only, because the marriage certificate is
    // still outstanding.
    for (const category of ["passport", "residence_permit", "birth_certificate"]) {
      await documents.addDocument(scope, {
        matterId: created.id,
        filename: `${category}-lindqvist.pdf`,
        category,
        mimeType: "application/pdf",
        sizeBytes: 1_000,
        uploadedById: fixture.immigration.attorneyId,
      });
    }

    const after = await statistics.practiceAreaCounts(scope, "immigration", NOW);

    expect(after["missing_identity_documents"]).toBe(
      (before["missing_identity_documents"] ?? 0) - 1,
    );
    expect(after["missing_immigration_documents"]).toBe(before["missing_immigration_documents"]);
  });

  it("stops counting a matter once every expected document is on file", async () => {
    const scope = { firmId: fixture.immigration.firmId };

    const created = await matters.createMatter(scope, {
      title: "Fully documented",
      clientName: "Grace Abara",
      matterTypeKey: "family_based",
      practiceAreaKey: "immigration",
      status: "lead",
      createdById: fixture.immigration.attorneyId,
      fields: {},
    });

    const before = await statistics.practiceAreaCounts(scope, "immigration", NOW);

    for (const category of ["passport", "residence_permit", "birth_certificate", "marriage_certificate"]) {
      await documents.addDocument(scope, {
        matterId: created.id,
        filename: `${category}-abara.pdf`,
        category,
        mimeType: "application/pdf",
        sizeBytes: 1_000,
        uploadedById: fixture.immigration.attorneyId,
      });
    }

    const after = await statistics.practiceAreaCounts(scope, "immigration", NOW);

    expect(after["missing_identity_documents"]).toBe(
      (before["missing_identity_documents"] ?? 0) - 1,
    );
    expect(after["missing_immigration_documents"]).toBe(
      (before["missing_immigration_documents"] ?? 0) - 1,
    );
  });

  it("answers no practice-area question it has no template for", async () => {
    const counts = await statistics.practiceAreaCounts(
      { firmId: fixture.immigration.firmId },
      "family_law",
      NOW,
    );

    // Token usage is a fact about the firm, not about its practice area, so it
    // is still counted. Every area-specific key is absent, which is what makes
    // those widgets show a dash rather than a zero.
    expect(Object.keys(counts)).toEqual(["monthly_usage"]);
    for (const areaSpecific of [
      "new_leads",
      "missing_identity_documents",
      "employee_side_matters",
      "wage_records_missing",
    ]) {
      expect(counts[areaSpecific]).toBeUndefined();
    }
  });
});

describe("tasks and intakes", () => {
  it("lists only the caller firm's open tasks", async () => {
    const tasks = await activity.listTasks({ firmId: fixture.immigration.firmId });

    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.id).toBe(fixture.immigration.taskId);
    expect(tasks[0]?.matter?.reference).toBe(fixture.immigration.matterReference);
  });

  it("lists only the caller firm's intakes", async () => {
    const intakes = await activity.listIntakes({ firmId: fixture.employment.firmId });

    expect(intakes).toHaveLength(1);
    expect(intakes[0]?.id).toBe(fixture.employment.intakeId);
    expect(intakes[0]?.matter.reference).toBe(fixture.employment.matterReference);
  });
});
