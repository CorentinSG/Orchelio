// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type TwoFirmFixture, createTwoFirmFixture } from "./fixtures";

/**
 * Orchelio — running an analysis, against a real database.
 *
 * The rules are tested in `tests/unit/ai-analyst.test.ts`. This suite is about
 * everything around them: that a run stays inside its firm, that it leaves a
 * record whether it succeeds or fails, that a failure keeps nothing partial,
 * and that the simulated charge is stored as simulated rather than merely
 * captioned that way on a screen.
 */

const FEATURES = [
  "document_summary",
  "entity_extraction",
  "timeline",
  "missing_documents",
  "inconsistency_detection",
  "consultation_questions",
];

let fixture: TwoFirmFixture;
let run: typeof import("@/lib/ai/run");
let analyses: typeof import("@/lib/data/analyses");
let usage: typeof import("@/lib/data/usage");
let matters: typeof import("@/lib/data/matters");

beforeAll(async () => {
  fixture = await createTwoFirmFixture();

  run = await import("@/lib/ai/run");
  analyses = await import("@/lib/data/analyses");
  usage = await import("@/lib/data/usage");
  matters = await import("@/lib/data/matters");
}, 180_000);

afterAll(async () => {
  await fixture?.dispose();
});

describe("a successful run", () => {
  it("produces an analysis and its review, in the caller's firm", async () => {
    const scope = { firmId: fixture.immigration.firmId };
    const outcome = await run.runAnalysis(scope, {
      matterId: fixture.immigration.matterId,
      userId: fixture.immigration.attorneyId,
      enabledFeatures: FEATURES,
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    const stored = await analyses.getAnalysis({
      analysisId: outcome.analysisId,
      firmId: fixture.immigration.firmId,
    });

    expect(stored?.status).toBe("completed");
    expect(stored?.firmId).toBe(fixture.immigration.firmId);
    expect(stored?.provider).toBe("mock");
    // Recorded so a past output can still be explained.
    expect(stored?.promptVersion).toBe("v1");
    expect(stored?.reviews).toHaveLength(1);
    expect(stored?.reviews[0]?.humanReviewRequired).toBe(true);
  });

  it("cannot be read from the other firm", async () => {
    const scope = { firmId: fixture.employment.firmId };
    const outcome = await run.runAnalysis(scope, {
      matterId: fixture.employment.matterId,
      userId: fixture.employment.attorneyId,
      enabledFeatures: FEATURES,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    const acrossTheBoundary = await analyses.getAnalysis({
      analysisId: outcome.analysisId,
      firmId: fixture.immigration.firmId,
    });

    expect(acrossTheBoundary).toBeNull();
  });

  it("records the run on the matter, so the list can show it", async () => {
    const scope = { firmId: fixture.immigration.firmId };
    await run.runAnalysis(scope, {
      matterId: fixture.immigration.matterId,
      userId: fixture.immigration.attorneyId,
      enabledFeatures: FEATURES,
    });

    const matter = await matters.getMatter({
      matterId: fixture.immigration.matterId,
      firmId: fixture.immigration.firmId,
    });

    expect(matter?.aiStatus).toBe("completed");
  });

  it("charges the firm that ran it, as a simulated charge", async () => {
    const before = await usage.usageSummary({ firmId: fixture.employment.firmId });

    await run.runAnalysis(
      { firmId: fixture.employment.firmId },
      {
        matterId: fixture.employment.matterId,
        userId: fixture.employment.attorneyId,
        enabledFeatures: FEATURES,
      },
    );

    const after = await usage.usageSummary({ firmId: fixture.employment.firmId });

    expect(after.analyses).toBe(before.analyses + 1);
    expect(after.reviews).toBe(before.reviews + 1);
    expect(after.costCents).toBeGreaterThan(before.costCents);
    // A property of the stored row, not a caption on a screen.
    expect(after.includesRealCharges).toBe(false);
  });

  it("does not charge the other firm", async () => {
    const before = await usage.usageSummary({ firmId: fixture.immigration.firmId });

    await run.runAnalysis(
      { firmId: fixture.employment.firmId },
      {
        matterId: fixture.employment.matterId,
        userId: fixture.employment.attorneyId,
        enabledFeatures: FEATURES,
      },
    );

    const after = await usage.usageSummary({ firmId: fixture.immigration.firmId });

    expect(after.costCents).toBe(before.costCents);
  });

  it("writes both the start and the finish to the activity log", async () => {
    const activity = await import("@/lib/data/activity");
    const events = await activity.listActivity({ firmId: fixture.immigration.firmId }, {}, 100);
    const actions = events.map((event) => event.action);

    expect(actions).toContain("ai.analysis.started");
    expect(actions).toContain("ai.analysis.completed");
    expect(actions).toContain("ai.review.completed");
  });
});

describe("a matter that belongs to another firm", () => {
  it("produces nothing at all, even with a real identifier", async () => {
    const before = await analyses.countAnalyses({ firmId: fixture.immigration.firmId });

    const outcome = await run.runAnalysis(
      { firmId: fixture.immigration.firmId },
      {
        matterId: fixture.employment.matterId,
        userId: fixture.immigration.attorneyId,
        enabledFeatures: FEATURES,
      },
    );

    expect(outcome).toEqual({ ok: false, reason: "matter_not_found" });
    // Not even an opened, failed record: nothing was created.
    expect(await analyses.countAnalyses({ firmId: fixture.immigration.firmId })).toBe(before);
  });
});

describe("a firm with no AI features switched on", () => {
  it("is refused rather than given a page of empty sections", async () => {
    const before = await analyses.countAnalyses({ firmId: fixture.immigration.firmId });

    const outcome = await run.runAnalysis(
      { firmId: fixture.immigration.firmId },
      {
        matterId: fixture.immigration.matterId,
        userId: fixture.immigration.attorneyId,
        enabledFeatures: [],
      },
    );

    expect(outcome).toEqual({ ok: false, reason: "no_features" });
    // Refused before anything was opened, so there is no misleading record.
    expect(await analyses.countAnalyses({ firmId: fixture.immigration.firmId })).toBe(before);
  });
});

describe("a run that fails", () => {
  it("leaves a record saying so, rather than leaving no trace", async () => {
    // A matter that shows nothing and a matter whose analysis failed are very
    // different things to a lawyer, so the failure has to be visible.
    const scope = { firmId: fixture.immigration.firmId };
    const opened = await analyses.beginAnalysis(scope, {
      matterId: fixture.immigration.matterId,
      provider: "mock",
      model: "unavailable",
      promptVersion: "v1",
      startedById: fixture.immigration.attorneyId,
    });
    expect(opened).not.toBeNull();

    await analyses.completeAnalysis(scope, opened!.id, {
      result: { summary: "half-written" },
      warnings: [],
      completedAt: new Date(),
    });
    const changed = await analyses.failAnalysis(scope, opened!.id, run.ANALYSIS_FAILURE_MESSAGE);

    expect(changed).toBe(1);

    const stored = await analyses.getAnalysis({
      analysisId: opened!.id,
      firmId: fixture.immigration.firmId,
    });

    expect(stored?.status).toBe("failed");
    expect(stored?.errorMessage).toBe(run.ANALYSIS_FAILURE_MESSAGE);
    // A half-written analysis shown beside a failure notice is the sort of
    // thing a reader takes for a whole one, so it is cleared.
    expect(stored?.result).toBeNull();
  });

  it("says nothing about why, to the browser", () => {
    // The real error goes to the server console. What is stored is fixed text.
    expect(run.ANALYSIS_FAILURE_MESSAGE).not.toMatch(/error|exception|stack|prisma|sql/i);
    expect(run.ANALYSIS_FAILURE_MESSAGE).toMatch(/ne s’est pas terminée/i);
  });

  it("cannot be failed from another firm", async () => {
    const opened = await analyses.beginAnalysis(
      { firmId: fixture.employment.firmId },
      {
        matterId: fixture.employment.matterId,
        provider: "mock",
        model: "simulated",
        promptVersion: "v1",
        startedById: fixture.employment.attorneyId,
      },
    );

    const changed = await analyses.failAnalysis(
      { firmId: fixture.immigration.firmId },
      opened!.id,
      "tampered",
    );

    expect(changed).toBe(0);
  });
});

describe("attaching a review", () => {
  it("refuses an analysis identifier borrowed from the other firm", async () => {
    const outcome = await run.runAnalysis(
      { firmId: fixture.employment.firmId },
      {
        matterId: fixture.employment.matterId,
        userId: fixture.employment.attorneyId,
        enabledFeatures: FEATURES,
      },
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    const review = await analyses.recordReview(
      { firmId: fixture.immigration.firmId },
      {
        analysisId: outcome.analysisId,
        provider: "mock",
        model: "simulated",
        promptVersion: "v1",
        status: "approved_for_human_review",
        result: {},
      },
    );

    expect(review).toBeNull();
  });

  it("never stores humanReviewRequired as false", async () => {
    const outcome = await run.runAnalysis(
      { firmId: fixture.immigration.firmId },
      {
        matterId: fixture.immigration.matterId,
        userId: fixture.immigration.attorneyId,
        enabledFeatures: FEATURES,
      },
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    const stored = await analyses.getAnalysis({
      analysisId: outcome.analysisId,
      firmId: fixture.immigration.firmId,
    });

    expect(stored?.reviews.every((review) => review.humanReviewRequired)).toBe(true);
  });
});

describe("determinism", () => {
  it("gives the same result for the same matter", async () => {
    const scope = { firmId: fixture.immigration.firmId };
    const options = {
      matterId: fixture.immigration.matterId,
      userId: fixture.immigration.attorneyId,
      enabledFeatures: FEATURES,
    };

    const first = await run.runAnalysis(scope, options);
    const second = await run.runAnalysis(scope, options);

    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    // Two runs that disagree are two results a lawyer cannot use.
    expect(second.result).toEqual(first.result);
    expect(second.reviewStatus).toBe(first.reviewStatus);
    // But they are separate records — a re-run does not overwrite history.
    expect(second.analysisId).not.toBe(first.analysisId);
  });
});

describe("re-running an analysis", () => {
  /**
   * The defect this exists for.
   *
   * Every run raises "may we rely on this analysis?" against the analysis it
   * just produced. Nothing used to retire the previous one, so a matter
   * analysed repeatedly grew a queue of requests about work products nobody
   * was looking at any more — 113 of them on one demonstration matter, which
   * buried a "confirm a recorded date" request that a person did need to see.
   */
  it("retires the request the previous analysis left waiting", async () => {
    const scope = { firmId: fixture.immigration.firmId };
    const matter = await matters.createMatter(scope, {
      title: "Analysed twice",
      clientName: "Rerun Test",
      matterTypeKey: "family_based",
      practiceAreaKey: "immigration",
      status: "active",
      createdById: fixture.immigration.attorneyId,
      fields: {},
    });

    await fixture.prisma.firmConfiguration.updateMany({
      where: { firmId: scope.firmId },
      data: { approvals: JSON.stringify({ legalAnalysis: true }) },
    });

    const options = {
      matterId: matter.id,
      userId: fixture.immigration.attorneyId,
      enabledFeatures: FEATURES,
    };
    const first = await run.runAnalysis(scope, options);
    const second = await run.runAnalysis(scope, options);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    const requests = await fixture.prisma.approvalRequest.findMany({
      where: { firmId: scope.firmId, matterId: matter.id, action: "legal_analysis" },
    });

    expect(requests).toHaveLength(2);
    const forFirst = requests.find((request) => request.resourceId === first.analysisId);
    const forSecond = requests.find((request) => request.resourceId === second.analysisId);

    expect(forFirst?.status).toBe("superseded");
    expect(forSecond?.status).toBe("pending");
    // Retired, not decided. Nobody read the first analysis.
    expect(forFirst?.decidedById).toBeNull();
    expect(forFirst?.decidedAt).toBeNull();
  });

  it("leaves exactly one request waiting however many times it is run", async () => {
    const scope = { firmId: fixture.immigration.firmId };
    const matter = await matters.createMatter(scope, {
      title: "Analysed five times",
      clientName: "Rerun Test Two",
      matterTypeKey: "family_based",
      practiceAreaKey: "immigration",
      status: "active",
      createdById: fixture.immigration.attorneyId,
      fields: {},
    });

    const options = {
      matterId: matter.id,
      userId: fixture.immigration.attorneyId,
      enabledFeatures: FEATURES,
    };
    for (let attempt = 0; attempt < 5; attempt += 1) await run.runAnalysis(scope, options);

    const waiting = await fixture.prisma.approvalRequest.count({
      where: {
        firmId: scope.firmId,
        matterId: matter.id,
        action: "legal_analysis",
        status: "pending",
      },
    });
    const kept = await fixture.prisma.approvalRequest.count({
      where: { firmId: scope.firmId, matterId: matter.id, action: "legal_analysis" },
    });

    expect(waiting).toBe(1);
    // Five runs, five rows: superseding is not deleting, and the history of
    // what was asked stays readable.
    expect(kept).toBe(5);
  });

  it("does not bury a request of another kind under the analysis ones", async () => {
    // The symptom that made the pile-up visible: a "confirm a recorded date"
    // request fell outside the window a screen could show, because a hundred
    // stale analysis requests sat in front of it.
    const scope = { firmId: fixture.immigration.firmId };
    const matter = await matters.createMatter(scope, {
      title: "A date and many analyses",
      clientName: "Rerun Test Three",
      matterTypeKey: "family_based",
      practiceAreaKey: "immigration",
      status: "active",
      createdById: fixture.immigration.attorneyId,
      fields: {},
    });

    await fixture.prisma.approvalRequest.create({
      data: {
        firmId: scope.firmId,
        matterId: matter.id,
        resourceType: "matter",
        resourceId: matter.id,
        action: "deadline_confirmation",
        riskLevel: "high",
        summary: "Confirm the recorded date",
        requestedById: fixture.immigration.attorneyId,
      },
    });

    const options = {
      matterId: matter.id,
      userId: fixture.immigration.attorneyId,
      enabledFeatures: FEATURES,
    };
    for (let attempt = 0; attempt < 6; attempt += 1) await run.runAnalysis(scope, options);

    const waiting = await fixture.prisma.approvalRequest.findMany({
      where: { firmId: scope.firmId, matterId: matter.id, status: "pending" },
    });

    expect(waiting.map((request) => request.action).sort()).toEqual([
      "deadline_confirmation",
      "legal_analysis",
    ]);
  });
});
