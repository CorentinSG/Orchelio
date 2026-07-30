import "server-only";

import { prisma } from "@/lib/prisma";
import type { FirmScope } from "@/lib/data/scope";
import { judgeSeparation } from "@/lib/approvals/separation";
import {
  APPROVAL_DECISIONS,
  type ApprovalDecision,
  approvableAction,
  decisionApproves,
  requiresNote,
} from "@/lib/approvals/actions";
import {
  PENDING_STATUS,
  SUPERSEDED_STATUS,
  isDecisionStatus,
  isPendingStatus,
  isSupersededStatus,
} from "@/lib/approvals/status";

/**
 * Orchelio — approval requests, and the decisions taken on them.
 *
 * The important function here is `decideApproval`, and the important thing
 * about it is that it is the only way a sensitive action takes effect. A
 * matter does not close because somebody called a close function; it closes
 * because a person approved a request to close it, and this module applied the
 * effect afterwards.
 *
 * That ordering is what makes "no sensitive action completes without an
 * explicit human decision" a property of the code rather than a rule people
 * are asked to follow. There is no `closeMatter()` to call by mistake.
 */

export type ApprovalFilters = {
  status?: string;
  action?: string;
  matterId?: string;
  riskLevel?: string;
};

export async function listApprovals(scope: FirmScope, filters: ApprovalFilters = {}, take = 100) {
  return prisma.approvalRequest.findMany({
    where: {
      firmId: scope.firmId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.matterId ? { matterId: filters.matterId } : {}),
      ...(filters.riskLevel ? { riskLevel: filters.riskLevel } : {}),
    },
    // Grouped by status, then most recent first. The status ordering is
    // alphabetical rather than meaningful — every screen asks for one status at
    // a time, and arranges the groups itself.
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take,
    include: {
      matter: { select: { id: true, reference: true, title: true } },
      requestedBy: { select: { id: true, name: true } },
      decidedBy: { select: { id: true, name: true } },
    },
  });
}

export async function getApproval({ approvalId, firmId }: { approvalId: string } & FirmScope) {
  return prisma.approvalRequest.findFirst({
    where: { id: approvalId, firmId },
    include: {
      matter: { select: { id: true, reference: true, title: true, nextDeadlineAt: true } },
      requestedBy: { select: { id: true, name: true } },
      decidedBy: { select: { id: true, name: true } },
    },
  });
}

export async function countPendingApprovals(scope: FirmScope): Promise<number> {
  return prisma.approvalRequest.count({ where: { firmId: scope.firmId, status: PENDING_STATUS } });
}

/**
 * How many requests there really are, in each of the three states.
 *
 * Separate from `listApprovals` on purpose. The approvals screen used to derive
 * both numbers from the rows it had fetched, which meant that a firm with 172
 * requests waiting was told 100 were — the size of the window, reported as the
 * size of the queue. A number on a screen is a claim, and that one was false.
 *
 * The buckets are exhaustive, and an unrecognised status is counted in none of
 * them rather than swept into `decided`. Over-reporting decisions is the one
 * error that must not happen here: `decided` is read on screen as "a person
 * took responsibility for this many things".
 */
export async function approvalCounts(
  scope: FirmScope,
  filters: ApprovalFilters = {},
): Promise<{ pending: number; decided: number; superseded: number }> {
  const rows = await prisma.approvalRequest.groupBy({
    by: ["status"],
    where: {
      firmId: scope.firmId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.matterId ? { matterId: filters.matterId } : {}),
      ...(filters.riskLevel ? { riskLevel: filters.riskLevel } : {}),
    },
    _count: { _all: true },
  });

  let pending = 0;
  let decided = 0;
  let superseded = 0;
  for (const row of rows) {
    if (isPendingStatus(row.status)) pending += row._count._all;
    else if (isSupersededStatus(row.status)) superseded += row._count._all;
    else if (isDecisionStatus(row.status)) decided += row._count._all;
    else console.error(`[orchelio] approval request with unknown status "${row.status}"`);
  }

  return { pending, decided, superseded };
}

/** Requests still waiting for a person, newest first. */
export async function listPendingApprovals(
  scope: FirmScope,
  filters: ApprovalFilters = {},
  take = 50,
) {
  return listApprovals(scope, { ...filters, status: PENDING_STATUS }, take);
}

/**
 * Requests a person decided, most recently decided first.
 *
 * The filter names the four decisions rather than saying "not pending", and
 * that is not a tidying-up. "Not pending" was true while the only way out of
 * the queue was a decision; a superseded request also leaves the queue, and it
 * would have arrived in this list — under a heading that says a person decided
 * it, next to the ones a person did decide.
 *
 * Listing all four rather than one at a time is deliberate too: a screen that
 * showed only "approved" would quietly hide the rejections, which are the ones
 * somebody is most likely to be looking for.
 */
export async function listDecidedApprovals(
  scope: FirmScope,
  filters: ApprovalFilters = {},
  take = 25,
) {
  const decided: readonly string[] = APPROVAL_DECISIONS;
  return prisma.approvalRequest.findMany({
    where: {
      firmId: scope.firmId,
      status:
        filters.status && isDecisionStatus(filters.status)
          ? filters.status
          : { in: [...decided] },
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.matterId ? { matterId: filters.matterId } : {}),
      ...(filters.riskLevel ? { riskLevel: filters.riskLevel } : {}),
    },
    orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }],
    take,
    include: {
      matter: { select: { id: true, reference: true, title: true } },
      requestedBy: { select: { id: true, name: true } },
      decidedBy: { select: { id: true, name: true } },
    },
  });
}

/**
 * Requests overtaken by events, most recent first.
 *
 * Its own list because it needs its own heading. Folded into either of the
 * other two it would be a false claim — either that somebody must act, or that
 * somebody did.
 */
export async function listSupersededApprovals(
  scope: FirmScope,
  filters: ApprovalFilters = {},
  take = 25,
) {
  return listApprovals(scope, { ...filters, status: SUPERSEDED_STATUS }, take);
}

/**
 * One matter's approvals: a bounded list, and the true total beside it.
 *
 * The matter page used to render a single hundred-row window and print its
 * length as the total. Two things were wrong with that, and the second is the
 * one that bit: the count was the window size rather than the truth, and a
 * request raised a moment ago could be pushed out of the window by older ones —
 * so the screen simply did not show it.
 */
export async function matterApprovals(scope: FirmScope, matterId: string, take = 20) {
  const [pending, decided, superseded, counts] = await Promise.all([
    listPendingApprovals(scope, { matterId }, take),
    listDecidedApprovals(scope, { matterId }, take),
    listSupersededApprovals(scope, { matterId }, take),
    approvalCounts(scope, { matterId }),
  ]);

  return {
    shown: [...pending, ...decided, ...superseded],
    total: counts.pending + counts.decided + counts.superseded,
  };
}

/** Every approval raised about one resource, newest first. */
export async function approvalsForResource(
  scope: FirmScope,
  resourceType: string,
  resourceId: string,
) {
  return prisma.approvalRequest.findMany({
    where: { firmId: scope.firmId, resourceType, resourceId },
    orderBy: { createdAt: "desc" },
    include: { decidedBy: { select: { id: true, name: true } } },
  });
}

export type NewApprovalRequest = {
  action: string;
  resourceType: string;
  resourceId: string;
  matterId: string | null;
  riskLevel: string;
  summary: string;
  requestedById: string;
};

/**
 * Raises a request for a person to decide.
 *
 * The matter, when given, is re-read inside the firm's scope first, so a real
 * identifier belonging to another firm raises nothing.
 */
export async function createApprovalRequest(scope: FirmScope, input: NewApprovalRequest) {
  if (input.matterId) {
    const matter = await prisma.matter.findFirst({
      where: { id: input.matterId, firmId: scope.firmId },
      select: { id: true },
    });
    if (!matter) return null;
  }

  return prisma.approvalRequest.create({
    data: {
      firmId: scope.firmId,
      matterId: input.matterId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      action: input.action,
      riskLevel: input.riskLevel,
      summary: input.summary.slice(0, 2000),
      status: PENDING_STATUS,
      requestedById: input.requestedById,
    },
  });
}

export type DecisionOutcome =
  | { ok: true; applied: boolean; self: boolean }
  | {
      ok: false;
      reason: "not_found" | "already_decided" | "note_required" | "same_person" | "superseded";
    };

/**
 * Records a decision, then applies whatever it permits.
 *
 * In that order, and never the reverse. The decision is written with a
 * conditional update that only matches a request still pending, so two people
 * deciding at the same moment cannot both succeed — the second gets
 * `already_decided` rather than silently overwriting the first, and the effect
 * is applied exactly once.
 */
export async function decideApproval(
  scope: FirmScope,
  input: {
    approvalId: string;
    decision: ApprovalDecision;
    note: string;
    decidedById: string;
    now?: Date;
  },
): Promise<DecisionOutcome> {
  const note = input.note.trim();
  if (requiresNote(input.decision) && note === "") {
    return { ok: false, reason: "note_required" };
  }

  const existing = await prisma.approvalRequest.findFirst({
    where: { id: input.approvalId, firmId: scope.firmId },
  });
  // Missing and not-this-firm's are the same answer, deliberately.
  if (!existing) return { ok: false, reason: "not_found" };
  // Told apart, because "somebody already decided this" would be false of a
  // superseded request and would send the reader looking for a decision that
  // does not exist.
  if (isSupersededStatus(existing.status)) return { ok: false, reason: "superseded" };
  if (!isPendingStatus(existing.status)) return { ok: false, reason: "already_decided" };

  // Separation of duties, read here rather than passed in. A caller that
  // forgot to pass it would silently get the permissive answer, and this is
  // the one function that records a decision — so it is the one place where
  // the rule cannot be skipped.
  const configuration = await prisma.firmConfiguration.findFirst({
    where: { firmId: scope.firmId },
    select: { requireSeparateApprover: true },
  });
  const separation = judgeSeparation({
    requestedById: existing.requestedById,
    decidedById: input.decidedById,
    requireSeparateApprover: configuration?.requireSeparateApprover ?? false,
  });
  if (!separation.allowed) return { ok: false, reason: separation.reason };

  // `status: PENDING_STATUS` in the filter is the lock. A second decision
  // arriving between the read above and this write updates nothing — and so
  // does a supersession, which is why it is safe for that to happen at any
  // moment without a transaction around the pair.
  const claimed = await prisma.approvalRequest.updateMany({
    where: { id: input.approvalId, firmId: scope.firmId, status: PENDING_STATUS },
    data: {
      status: input.decision,
      decisionNote: note === "" ? null : note.slice(0, 4000),
      decidedById: input.decidedById,
      decidedAt: input.now ?? new Date(),
    },
  });
  if (claimed.count === 0) return { ok: false, reason: "already_decided" };

  const applied = decisionApproves(input.decision)
    ? await applySensitiveEffect(scope, existing.action, existing.resourceId, existing.matterId)
    : false;

  // `self` is returned so the caller can write it to the log. A decision
  // somebody took on their own request is exactly the entry an audit is
  // looking for, and it is worth recording even where the firm allows it.
  return { ok: true, applied, self: separation.self };
}

/**
 * Marks a matter's earlier pending requests for one action as superseded.
 *
 * Called from exactly one place — `runAnalysis`, once a newer analysis exists —
 * and deliberately narrow, because supersession is a claim that nobody needs to
 * answer a question any more, and that claim is only obviously true here. A
 * draft communication is not superseded by a later draft: each is a separate
 * set of words somebody may want to approve. Widening this needs the same
 * argument made again for the new case.
 *
 * Returns the rows it changed, so the caller can log one entry each. A request
 * that leaves the queue with no trace is a request somebody will later swear
 * they never saw.
 */
export async function supersedeEarlierApprovals(
  scope: FirmScope,
  input: { matterId: string; action: string; currentResourceId: string; now?: Date },
) {
  const candidates = await prisma.approvalRequest.findMany({
    where: {
      firmId: scope.firmId,
      matterId: input.matterId,
      action: input.action,
      status: PENDING_STATUS,
      // The request raised for the analysis that has just run is the live one.
      resourceId: { not: input.currentResourceId },
    },
    select: { id: true },
  });
  if (candidates.length === 0) return [];

  const ids = candidates.map((request) => request.id);
  const supersededAt = input.now ?? new Date();

  await prisma.approvalRequest.updateMany({
    where: {
      firmId: scope.firmId,
      id: { in: ids },
      // Still pending at the moment of the write: somebody may have decided one
      // of these between the read above and here, and a real decision outranks
      // a supersession.
      status: PENDING_STATUS,
    },
    data: { status: SUPERSEDED_STATUS, supersededAt },
  });

  // Read back rather than returning what was read before the write. The caller
  // writes an audit entry per row, and a row somebody decided in between is one
  // this function did not supersede — claiming otherwise would put an event in
  // the log that never happened.
  return prisma.approvalRequest.findMany({
    where: { firmId: scope.firmId, id: { in: ids }, status: SUPERSEDED_STATUS },
    select: { id: true, resourceId: true, requestedById: true, matterId: true },
  });
}

/**
 * What an approval causes.
 *
 * Exported because a firm that has *not* switched a configurable rule on takes
 * the same action without a decision, and that path must do exactly this and
 * not a second implementation of it. One function, two callers, no drift.
 *
 * Only two actions change anything. For the other two the approval row *is*
 * the state — an analysis that has been approved is one with an approved
 * request against it, and a confirmed date is a date with an approved
 * confirmation against it. No second flag, so there is nothing to fall out of
 * step with the decision.
 */
export async function applySensitiveEffect(
  scope: FirmScope,
  action: string,
  resourceId: string | null,
  matterId: string | null,
): Promise<boolean> {
  if (!resourceId) return false;

  switch (action) {
    case "close_matter": {
      const closed = await prisma.matter.updateMany({
        where: { id: resourceId, firmId: scope.firmId, closedAt: null },
        data: { closedAt: new Date(), status: "closed" },
      });
      return closed.count > 0;
    }

    case "external_transmission": {
      // "approved_for_use" is the last status a draft has. There is no "sent",
      // in this enum or anywhere else in the product.
      const approved = await prisma.draftCommunication.updateMany({
        where: { id: resourceId, firmId: scope.firmId },
        data: { status: "approved_for_use" },
      });
      return approved.count > 0;
    }

    case "legal_analysis":
    case "deadline_confirmation":
      // Nothing to change. The decision itself is the record.
      return false;

    default:
      // An action nobody declared. Recorded as decided, effect not applied —
      // failing closed rather than guessing what it meant.
      console.error(`[orchelio] approval for unknown action "${action}", matter ${matterId}`);
      return false;
  }
}

/**
 * Whether a resource has an approval that permits it to be relied on.
 *
 * Read rather than stored, for the reason above.
 */
export async function approvedRequestFor(
  scope: FirmScope,
  resourceType: string,
  resourceId: string,
) {
  return prisma.approvalRequest.findFirst({
    where: {
      firmId: scope.firmId,
      resourceType,
      resourceId,
      status: { in: ["approved", "approved_with_edits"] },
    },
    orderBy: { decidedAt: "desc" },
    include: { decidedBy: { select: { id: true, name: true } } },
  });
}

/** The distinct actions present in this firm's approvals, for a filter menu. */
export async function approvalActions(scope: FirmScope): Promise<string[]> {
  const rows = await prisma.approvalRequest.groupBy({
    by: ["action"],
    where: { firmId: scope.firmId },
    _count: { _all: true },
  });
  return rows.map((row) => row.action).sort();
}

/** Guards against raising the same request twice for one resource. */
export async function pendingApprovalFor(
  scope: FirmScope,
  resourceType: string,
  resourceId: string,
  action: string,
) {
  return prisma.approvalRequest.findFirst({
    where: { firmId: scope.firmId, resourceType, resourceId, action, status: PENDING_STATUS },
  });
}

/** Used only by the tests and the seed; the action catalogue is the real source. */
export function knownAction(key: string): boolean {
  return approvableAction(key) !== undefined;
}
