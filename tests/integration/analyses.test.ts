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
    expect(run.ANALYSIS_FAILURE_MESSAGE).toMatch(/did not complete/i);
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
