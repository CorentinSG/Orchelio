import "server-only";

import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import type { FirmScope } from "@/lib/data/scope";
import { firmConfiguration } from "@/lib/data/firms";
import {
  applySensitiveEffect,
  createApprovalRequest,
  decideApproval,
  getApproval,
  pendingApprovalFor,
} from "@/lib/data/approvals";
import { prisma } from "@/lib/prisma";
import { parseJsonObject } from "@/lib/json-field";
import {
  type ApprovableAction,
  type ApprovalDecision,
  approvableAction,
  approvalReason,
  decisionApproves,
  requiresApproval,
} from "@/lib/approvals/actions";

/**
 * Orchelio — raising an approval, and recording the decision.
 *
 * Two functions, and between them the answer to the phase's acceptance
 * criterion: no sensitive action completes without an explicit human decision,
 * and every decision appears in the log.
 *
 * `raiseApproval` is called at the point a sensitive thing *would* happen. It
 * reads the firm's configuration, decides whether a person is needed, and
 * returns what the caller should do. `recordDecision` is called when a person
 * decides, and writes the decision to the activity log whether or not the
 * effect applied.
 */

export type RaiseOutcome =
  | { required: true; approvalId: string; reason: "locked" | "configured" }
  | { required: true; approvalId: string; reason: "already_pending" }
  | { required: false; reason: "not_required"; applied: boolean }
  | { required: false; reason: "matter_not_found"; applied: false };

/**
 * Raises a request if this firm needs one for this action.
 *
 * Returns `required: false` when the firm has not switched the rule on *and*
 * the rule is not locked. That is the only route by which a sensitive action
 * proceeds without a decision, and it is a route the firm chose.
 */
export async function raiseApproval(
  scope: FirmScope,
  input: {
    actionKey: string;
    resourceId: string;
    matterId: string | null;
    summary: string;
    requestedById: string;
  },
): Promise<RaiseOutcome> {
  const action = approvableAction(input.actionKey);
  if (!action) {
    // Failing closed: an undeclared action is not quietly allowed through.
    throw new Error(`Unknown approvable action "${input.actionKey}"`);
  }

  const configuration = await firmConfiguration(scope);
  const firmApprovals = parseJsonObject(configuration?.approvals);

  if (!requiresApproval(action, firmApprovals)) {
    // The firm chose not to require a decision for this, and the rule is not
    // one of the nine that cannot be switched off. The effect is applied here,
    // through the same function the approval path uses — a second
    // implementation is how the two would come to differ.
    const applied = await applySensitiveEffect(
      scope,
      action.key,
      input.resourceId,
      input.matterId,
    );

    // Logged as loudly as a decision would be. "Nobody had to approve this"
    // is exactly the kind of thing an audit needs to be able to show.
    await recordAuditEvent({
      action: AUDIT_ACTIONS.approvalRequested,
      firmId: scope.firmId,
      userId: input.requestedById,
      resourceType: action.resourceType,
      resourceId: input.resourceId,
      newValue: {
        approvalAction: action.key,
        required: "not_required",
        because: `This firm has not switched on "${action.configurableBy}".`,
        effectApplied: applied,
        matterId: input.matterId,
      },
    });

    return { required: false, reason: "not_required", applied };
  }

  // Raising a second identical request would give a reviewer two rows for one
  // question and let the effect apply twice.
  const existing = await pendingApprovalFor(scope, action.resourceType, input.resourceId, action.key);
  if (existing) {
    return { required: true, approvalId: existing.id, reason: "already_pending" };
  }

  const created = await createApprovalRequest(scope, {
    action: action.key,
    resourceType: action.resourceType,
    resourceId: input.resourceId,
    matterId: input.matterId,
    riskLevel: action.riskLevel,
    summary: input.summary,
    requestedById: input.requestedById,
  });
  if (!created) return { required: false, reason: "matter_not_found", applied: false };

  const reason = approvalReason(action, firmApprovals);
  await recordAuditEvent({
    action: AUDIT_ACTIONS.approvalRequested,
    firmId: scope.firmId,
    userId: input.requestedById,
    resourceType: "approval_request",
    resourceId: created.id,
    newValue: {
      approvalAction: action.key,
      riskLevel: action.riskLevel,
      // Recorded so the log can later answer "was this required because the
      // firm asked for it, or because it cannot be switched off?"
      required: reason,
      matterId: input.matterId,
    },
  });

  return {
    required: true,
    approvalId: created.id,
    reason: reason === "locked" ? "locked" : "configured",
  };
}

export type DecisionResult =
  | { ok: true; applied: boolean; action: ApprovableAction; matterId: string | null }
  | { ok: false; reason: "not_found" | "already_decided" | "note_required" | "same_person" };

/**
 * Records a person's decision, and everything that followed from it.
 *
 * The audit entry is written after the decision lands, and carries the note,
 * the decider and whether the effect applied. A decision that changed nothing
 * — a rejection, or an approval of something with no effect to apply — is
 * logged exactly as loudly as one that did.
 */
export async function recordDecision(
  scope: FirmScope,
  input: {
    approvalId: string;
    decision: ApprovalDecision;
    note: string;
    decidedById: string;
  },
): Promise<DecisionResult> {
  const before = await getApproval({ approvalId: input.approvalId, firmId: scope.firmId });
  if (!before) return { ok: false, reason: "not_found" };

  const outcome = await decideApproval(scope, {
    approvalId: input.approvalId,
    decision: input.decision,
    note: input.note,
    decidedById: input.decidedById,
  });

  if (!outcome.ok) return { ok: false, reason: outcome.reason };

  const action = approvableAction(before.action);

  await recordAuditEvent({
    action: AUDIT_ACTIONS.approvalDecided,
    firmId: scope.firmId,
    userId: input.decidedById,
    resourceType: "approval_request",
    resourceId: input.approvalId,
    oldValue: { status: "pending" },
    newValue: {
      status: input.decision,
      approvalAction: before.action,
      // The note is part of the decision, so it belongs in the record of it.
      note: input.note.trim() || null,
      effectApplied: outcome.applied,
      matterId: before.matterId,
      // Whether the decider was the requester. Recorded even where the firm
      // allows it: "this person approved their own request" is precisely the
      // entry somebody reading the log a year from now is looking for, and a
      // log that only records the refused cases records the wrong half.
      decidedOwnRequest: outcome.self,
    },
  });

  // A decision that sends work back needs somewhere for that work to live, or
  // it is a message nobody receives.
  if (input.decision === "new_analysis_requested" && before.matterId) {
    await prisma.task.create({
      data: {
        firmId: scope.firmId,
        matterId: before.matterId,
        title: "Run a new analysis",
        description: `Requested when the previous analysis was reviewed: ${input.note.trim()}`,
        priority: "high",
        createdById: input.decidedById,
      },
    });
  }

  return {
    ok: true,
    applied: outcome.applied,
    action: action ?? {
      key: before.action,
      label: before.action,
      resourceType: before.resourceType,
      riskLevel: "medium",
      lockedBy: null,
      configurableBy: null,
      question: "",
      effect: "",
    },
    matterId: before.matterId,
  };
}

/** Whether a decision permits the underlying thing to be relied on. */
export { decisionApproves };
