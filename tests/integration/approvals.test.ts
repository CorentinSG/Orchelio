// @vitest-environment node

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type TwoFirmFixture, createTwoFirmFixture } from "./fixtures";

/**
 * Orchelio — approvals, against a real database.
 *
 * The phase's acceptance criterion, in two halves:
 *
 *  1. No sensitive action completes without an explicit human decision.
 *  2. Every decision appears in the log.
 *
 * The first is the harder one to test honestly, because the interesting case
 * is not "approving works" — it is "the effect had not already happened before
 * anybody approved". So most of these check the state *before* the decision as
 * well as after it.
 */

let fixture: TwoFirmFixture;
let approvals: typeof import("@/lib/data/approvals");
let raise: typeof import("@/lib/approvals/raise");
let matters: typeof import("@/lib/data/matters");
let communications: typeof import("@/lib/data/communications");
let activity: typeof import("@/lib/data/activity");

beforeAll(async () => {
  fixture = await createTwoFirmFixture();

  approvals = await import("@/lib/data/approvals");
  raise = await import("@/lib/approvals/raise");
  matters = await import("@/lib/data/matters");
  communications = await import("@/lib/data/communications");
  activity = await import("@/lib/data/activity");
}, 180_000);

afterAll(async () => {
  await fixture?.dispose();
});

/** Sets this firm's configurable approvals. Locked ones are not stored here. */
async function configureApprovals(firmId: string, approvalsConfig: Record<string, boolean>) {
  await fixture.prisma.firmConfiguration.updateMany({
    where: { firmId },
    data: { approvals: JSON.stringify(approvalsConfig) },
  });
}

describe("a locked rule always needs a person", () => {
  it("raises a request even with every configurable rule switched off", async () => {
    const scope = { firmId: fixture.immigration.firmId };
    await configureApprovals(fixture.immigration.firmId, {});

    const draft = await communications.createDraft(scope, {
      matterId: fixture.immigration.matterId,
      channel: "email",
      subject: "Request for the missing I-94",
      body: "Fictional draft.",
      createdById: fixture.immigration.attorneyId,
    });

    const outcome = await raise.raiseApproval(scope, {
      actionKey: "external_transmission",
      resourceId: draft!.id,
      matterId: fixture.immigration.matterId,
      summary: "Email draft",
      requestedById: fixture.immigration.attorneyId,
    });

    expect(outcome.required).toBe(true);
    if (outcome.required) expect(outcome.reason).toBe("locked");
  });

  it("leaves the draft unusable until somebody decides", async () => {
    const scope = { firmId: fixture.immigration.firmId };
    const draft = await communications.createDraft(scope, {
      matterId: fixture.immigration.matterId,
      channel: "email",
      subject: "Second draft",
      body: "Fictional.",
      createdById: fixture.immigration.attorneyId,
    });

    const outcome = await raise.raiseApproval(scope, {
      actionKey: "external_transmission",
      resourceId: draft!.id,
      matterId: fixture.immigration.matterId,
      summary: "Email draft",
      requestedById: fixture.immigration.attorneyId,
    });
    expect(outcome.required).toBe(true);
    if (!outcome.required) return;

    // Before the decision: still a draft.
    const before = await communications.getDraft({
      draftId: draft!.id,
      firmId: fixture.immigration.firmId,
    });
    expect(before?.status).toBe("draft");

    await raise.recordDecision(scope, {
      approvalId: outcome.approvalId,
      decision: "approved",
      note: "",
      decidedById: fixture.immigration.attorneyId,
    });

    const after = await communications.getDraft({
      draftId: draft!.id,
      firmId: fixture.immigration.firmId,
    });
    expect(after?.status).toBe("approved_for_use");
  });

  it("has no status beyond approved for use — there is no sending", async () => {
    const drafts = await communications.listDrafts({ firmId: fixture.immigration.firmId });

    for (const draft of drafts) {
      expect(["draft", "approved_for_use"]).toContain(draft.status);
    }
  });
});

describe("a configurable rule is the firm's choice", () => {
  it("needs a decision when the firm asked for one, and closes nothing before it", async () => {
    const scope = { firmId: fixture.immigration.firmId };
    await configureApprovals(fixture.immigration.firmId, { closeMatter: true });

    const created = await matters.createMatter(scope, {
      title: "To be closed with approval",
      clientName: "Approval Test One",
      matterTypeKey: "family_based",
      practiceAreaKey: "immigration",
      status: "active",
      createdById: fixture.immigration.attorneyId,
      fields: {},
    });

    const outcome = await raise.raiseApproval(scope, {
      actionKey: "close_matter",
      resourceId: created.id,
      matterId: created.id,
      summary: "Close it",
      requestedById: fixture.immigration.attorneyId,
    });

    expect(outcome.required).toBe(true);
    if (!outcome.required) return;

    // The whole point: asking has not closed it.
    const before = await matters.getMatter({
      matterId: created.id,
      firmId: fixture.immigration.firmId,
    });
    expect(before?.closedAt).toBeNull();

    await raise.recordDecision(scope, {
      approvalId: outcome.approvalId,
      decision: "approved",
      note: "",
      decidedById: fixture.immigration.attorneyId,
    });

    const after = await matters.getMatter({
      matterId: created.id,
      firmId: fixture.immigration.firmId,
    });
    expect(after?.closedAt).not.toBeNull();
    expect(after?.status).toBe("closed");
  });

  it("takes effect immediately when the firm did not ask for one", async () => {
    const scope = { firmId: fixture.immigration.firmId };
    await configureApprovals(fixture.immigration.firmId, { closeMatter: false });

    const created = await matters.createMatter(scope, {
      title: "To be closed without approval",
      clientName: "Approval Test Two",
      matterTypeKey: "family_based",
      practiceAreaKey: "immigration",
      status: "active",
      createdById: fixture.immigration.attorneyId,
      fields: {},
    });

    const outcome = await raise.raiseApproval(scope, {
      actionKey: "close_matter",
      resourceId: created.id,
      matterId: created.id,
      summary: "Close it",
      requestedById: fixture.immigration.attorneyId,
    });

    expect(outcome).toEqual({ required: false, reason: "not_required", applied: true });

    const after = await matters.getMatter({
      matterId: created.id,
      firmId: fixture.immigration.firmId,
    });
    expect(after?.closedAt).not.toBeNull();
  });

  it("records that nobody had to approve it, which is what an audit is for", async () => {
    const events = await activity.listActivity(
      { firmId: fixture.immigration.firmId },
      { action: "approval.requested" },
      200,
    );
    const skipped = events.filter((event) => (event.newValue ?? "").includes('"not_required"'));

    expect(skipped.length).toBeGreaterThan(0);
    expect(skipped[0]?.newValue).toContain("has not switched on");
  });
});

describe("a decision that needs a note", () => {
  async function pendingAnalysisApproval() {
    const scope = { firmId: fixture.immigration.firmId };
    await configureApprovals(fixture.immigration.firmId, { legalAnalysis: true });

    const outcome = await raise.raiseApproval(scope, {
      actionKey: "legal_analysis",
      // A fresh identifier each time, so the duplicate guard does not return
      // an earlier request.
      resourceId: `analysis-${Math.round(performance.now() * 1000)}`,
      matterId: fixture.immigration.matterId,
      summary: "Analysis awaiting a decision",
      requestedById: fixture.immigration.attorneyId,
    });
    if (!outcome.required) throw new Error("expected an approval to be required");
    return outcome.approvalId;
  }

  it("is refused without one", async () => {
    const approvalId = await pendingAnalysisApproval();

    for (const decision of ["rejected", "approved_with_edits", "new_analysis_requested"] as const) {
      const result = await raise.recordDecision(
        { firmId: fixture.immigration.firmId },
        { approvalId, decision, note: "   ", decidedById: fixture.immigration.attorneyId },
      );
      expect(result, decision).toEqual({ ok: false, reason: "note_required" });
    }

    // Still waiting: a refused decision must not half-record.
    const stored = await approvals.getApproval({
      approvalId,
      firmId: fixture.immigration.firmId,
    });
    expect(stored?.status).toBe("pending");
    expect(stored?.decidedById).toBeNull();
  });

  it("is accepted with one, and keeps the note", async () => {
    const approvalId = await pendingAnalysisApproval();

    const result = await raise.recordDecision(
      { firmId: fixture.immigration.firmId },
      {
        approvalId,
        decision: "rejected",
        note: "The entry-date contradiction has to be settled with the client first.",
        decidedById: fixture.immigration.attorneyId,
      },
    );

    expect(result.ok).toBe(true);
    const stored = await approvals.getApproval({
      approvalId,
      firmId: fixture.immigration.firmId,
    });
    expect(stored?.status).toBe("rejected");
    expect(stored?.decisionNote).toContain("settled with the client");
    expect(stored?.decidedAt).not.toBeNull();
  });

  it("does not need one for a plain approval", async () => {
    const approvalId = await pendingAnalysisApproval();

    const result = await raise.recordDecision(
      { firmId: fixture.immigration.firmId },
      { approvalId, decision: "approved", note: "", decidedById: fixture.immigration.attorneyId },
    );

    expect(result.ok).toBe(true);
  });

  it("creates a task when a new analysis is asked for, so the ask lands somewhere", async () => {
    const approvalId = await pendingAnalysisApproval();
    const before = await activity.listTasks({ firmId: fixture.immigration.firmId });

    await raise.recordDecision(
      { firmId: fixture.immigration.firmId },
      {
        approvalId,
        decision: "new_analysis_requested",
        note: "Re-run once the employment letter is on file.",
        decidedById: fixture.immigration.attorneyId,
      },
    );

    const after = await activity.listTasks({ firmId: fixture.immigration.firmId });
    expect(after.length).toBe(before.length + 1);
    const task = after.find((candidate) => candidate.title === "Run a new analysis");
    expect(task?.description).toContain("employment letter");
  });
});

describe("deciding twice", () => {
  it("is refused, and does not overwrite the first decision", async () => {
    const scope = { firmId: fixture.immigration.firmId };
    await configureApprovals(fixture.immigration.firmId, { closeMatter: true });

    const created = await matters.createMatter(scope, {
      title: "Decided twice",
      clientName: "Approval Test Three",
      matterTypeKey: "family_based",
      practiceAreaKey: "immigration",
      status: "active",
      createdById: fixture.immigration.attorneyId,
      fields: {},
    });

    const outcome = await raise.raiseApproval(scope, {
      actionKey: "close_matter",
      resourceId: created.id,
      matterId: created.id,
      summary: "Close it",
      requestedById: fixture.immigration.attorneyId,
    });
    if (!outcome.required) throw new Error("expected an approval");

    const first = await raise.recordDecision(scope, {
      approvalId: outcome.approvalId,
      decision: "approved",
      note: "",
      decidedById: fixture.immigration.attorneyId,
    });
    expect(first.ok).toBe(true);

    const second = await raise.recordDecision(scope, {
      approvalId: outcome.approvalId,
      decision: "rejected",
      note: "Changed my mind.",
      decidedById: fixture.immigration.attorneyId,
    });
    expect(second).toEqual({ ok: false, reason: "already_decided" });

    const stored = await approvals.getApproval({
      approvalId: outcome.approvalId,
      firmId: fixture.immigration.firmId,
    });
    expect(stored?.status).toBe("approved");
  });

  it("does not raise a second request for the same thing", async () => {
    const scope = { firmId: fixture.employment.firmId };
    await configureApprovals(fixture.employment.firmId, { legalAnalysis: true });

    const first = await raise.raiseApproval(scope, {
      actionKey: "legal_analysis",
      resourceId: "the-same-analysis",
      matterId: fixture.employment.matterId,
      summary: "One",
      requestedById: fixture.employment.attorneyId,
    });
    const second = await raise.raiseApproval(scope, {
      actionKey: "legal_analysis",
      resourceId: "the-same-analysis",
      matterId: fixture.employment.matterId,
      summary: "Two",
      requestedById: fixture.employment.attorneyId,
    });

    expect(first.required && second.required).toBe(true);
    if (!first.required || !second.required) return;
    expect(second.approvalId).toBe(first.approvalId);
    expect(second.reason).toBe("already_pending");
  });
});

describe("every decision appears in the log", () => {
  it("records the decision, the note and whether anything took effect", async () => {
    const scope = { firmId: fixture.employment.firmId };
    await configureApprovals(fixture.employment.firmId, { closeMatter: true });

    const created = await matters.createMatter(scope, {
      title: "Logged decision",
      clientName: "Approval Test Four",
      matterTypeKey: "unpaid_wages",
      practiceAreaKey: "employment_law",
      status: "active",
      createdById: fixture.employment.attorneyId,
      fields: {},
    });

    const outcome = await raise.raiseApproval(scope, {
      actionKey: "close_matter",
      resourceId: created.id,
      matterId: created.id,
      summary: "Close it",
      requestedById: fixture.employment.attorneyId,
    });
    if (!outcome.required) throw new Error("expected an approval");

    await raise.recordDecision(scope, {
      approvalId: outcome.approvalId,
      decision: "approved_with_edits",
      note: "Closed, but the file note needs tidying.",
      decidedById: fixture.employment.attorneyId,
    });

    const events = await activity.listActivity(scope, { action: "approval.decided" }, 200);
    const entry = events.find((event) => event.resourceId === outcome.approvalId);

    expect(entry).toBeDefined();
    expect(entry!.newValue).toContain("approved_with_edits");
    expect(entry!.newValue).toContain("file note needs tidying");
    expect(entry!.newValue).toContain('"effectApplied":true');
    expect(entry!.userId).toBe(fixture.employment.attorneyId);
  });

  it("logs a decision that changed nothing just as loudly", async () => {
    const scope = { firmId: fixture.employment.firmId };
    await configureApprovals(fixture.employment.firmId, { legalAnalysis: true });

    const outcome = await raise.raiseApproval(scope, {
      actionKey: "legal_analysis",
      resourceId: "analysis-with-no-effect",
      matterId: fixture.employment.matterId,
      summary: "Nothing to apply",
      requestedById: fixture.employment.attorneyId,
    });
    if (!outcome.required) throw new Error("expected an approval");

    await raise.recordDecision(scope, {
      approvalId: outcome.approvalId,
      decision: "rejected",
      note: "Not yet.",
      decidedById: fixture.employment.attorneyId,
    });

    const events = await activity.listActivity(scope, { action: "approval.decided" }, 200);
    const entry = events.find((event) => event.resourceId === outcome.approvalId);

    expect(entry?.newValue).toContain('"effectApplied":false');
    expect(entry?.newValue).toContain('"status":"rejected"');
  });

  it("records why an approval was required", async () => {
    const events = await activity.listActivity(
      { firmId: fixture.immigration.firmId },
      { action: "approval.requested" },
      200,
    );

    expect(events.some((event) => (event.newValue ?? "").includes('"required":"locked"'))).toBe(
      true,
    );
    expect(
      events.some((event) => (event.newValue ?? "").includes('"required":"configured"')),
    ).toBe(true);
  });
});

describe("the firm boundary", () => {
  it("does not return another firm's approvals", async () => {
    const own = await approvals.listApprovals({ firmId: fixture.immigration.firmId });

    expect(own.length).toBeGreaterThan(0);
    expect(own.every((approval) => approval.firmId === fixture.immigration.firmId)).toBe(true);
  });

  it("refuses to decide another firm's approval, with a real identifier", async () => {
    const scope = { firmId: fixture.employment.firmId };
    await configureApprovals(fixture.employment.firmId, { legalAnalysis: true });

    const outcome = await raise.raiseApproval(scope, {
      actionKey: "legal_analysis",
      resourceId: "employment-only-analysis",
      matterId: fixture.employment.matterId,
      summary: "Theirs",
      requestedById: fixture.employment.attorneyId,
    });
    if (!outcome.required) throw new Error("expected an approval");

    const result = await raise.recordDecision(
      { firmId: fixture.immigration.firmId },
      {
        approvalId: outcome.approvalId,
        decision: "approved",
        note: "",
        decidedById: fixture.immigration.attorneyId,
      },
    );

    // Missing and not-yours get the same answer.
    expect(result).toEqual({ ok: false, reason: "not_found" });

    const untouched = await approvals.getApproval({
      approvalId: outcome.approvalId,
      firmId: fixture.employment.firmId,
    });
    expect(untouched?.status).toBe("pending");
  });

  it("refuses to raise one against another firm's matter", async () => {
    const outcome = await raise.raiseApproval(
      { firmId: fixture.immigration.firmId },
      {
        actionKey: "close_matter",
        resourceId: fixture.employment.matterId,
        matterId: fixture.employment.matterId,
        summary: "Not mine",
        requestedById: fixture.immigration.attorneyId,
      },
    );

    // Either refused outright, or refused because the matter is not found —
    // never a request against the other firm's matter.
    if (outcome.required) throw new Error("should not have raised");
    const stillOpen = await matters.getMatter({
      matterId: fixture.employment.matterId,
      firmId: fixture.employment.firmId,
    });
    expect(stillOpen?.closedAt).toBeNull();
  });

  it("counts pending approvals per firm", async () => {
    const immigration = await approvals.countPendingApprovals({
      firmId: fixture.immigration.firmId,
    });
    const employment = await approvals.countPendingApprovals({ firmId: fixture.employment.firmId });
    const all = await approvals.listApprovals({ firmId: fixture.immigration.firmId }, {}, 500);

    expect(immigration).toBe(all.filter((approval) => approval.status === "pending").length);
    expect(employment).toBeGreaterThanOrEqual(0);
  });
});

describe("an action nobody declared", () => {
  it("throws rather than being quietly allowed through", async () => {
    await expect(
      raise.raiseApproval(
        { firmId: fixture.immigration.firmId },
        {
          actionKey: "delete_everything",
          resourceId: "x",
          matterId: null,
          summary: "",
          requestedById: fixture.immigration.attorneyId,
        },
      ),
    ).rejects.toThrow(/Unknown approvable action/);
  });
});
