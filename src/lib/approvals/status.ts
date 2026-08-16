import {
  APPROVAL_DECISIONS,
  type ApprovalDecision,
  decisionLabel,
} from "@/lib/approvals/actions";

/**
 * Orchelio — what state an approval request is in.
 *
 * There used to be five values and no module: one for waiting and four for the
 * decisions, written as string literals wherever a query needed one. That was
 * survivable while every value that was not `"pending"` meant *a person
 * decided this*, because `{ not: "pending" }` was then a true statement about
 * the world.
 *
 * It stopped being true when requests started being **superseded**. Re-running
 * an analysis leaves the earlier one's request waiting for a decision nobody
 * needs to make any more; the request has not been approved, rejected or
 * looked at, it has simply stopped being the question. A demonstration matter
 * accumulated 113 of them, which buried the request that mattered.
 *
 * So supersession is a sixth state, and the reason it lives here rather than
 * beside the four decisions is that **it must never be counted as one**. A
 * screen that folded it into "decided" would be claiming a person took
 * responsibility for something no person ever saw — the exact failure this
 * product spends most of its effort avoiding.
 *
 * The three predicates below partition every status, and
 * `tests/unit/approval-status.test.ts` fails if a seventh value is added
 * without being placed in exactly one of them. That is the whole point of the
 * module: adding a status is a decision about which bucket it belongs to, and
 * the build refuses to let it be left unmade.
 */

/** Waiting for a person. The only state in which a decision may be recorded. */
export const PENDING_STATUS = "pending";

/**
 * Overtaken by events, and decided by nobody.
 *
 * Not a decision, not a rejection, and — deliberately — not a deletion. The
 * row stays, says what happened to it, and says that no approval was given.
 */
export const SUPERSEDED_STATUS = "superseded";

export const APPROVAL_STATUSES = [
  PENDING_STATUS,
  ...APPROVAL_DECISIONS,
  SUPERSEDED_STATUS,
] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export function isPendingStatus(status: string): boolean {
  return status === PENDING_STATUS;
}

/** Did a person decide this? The question every count and heading turns on. */
export function isDecisionStatus(status: string): status is ApprovalDecision {
  return (APPROVAL_DECISIONS as readonly string[]).includes(status);
}

export function isSupersededStatus(status: string): boolean {
  return status === SUPERSEDED_STATUS;
}

/**
 * Said on screen wherever a superseded request appears.
 *
 * Two sentences because two things need saying, and the second is the one that
 * matters: what happened, and that nothing was approved. A reader who takes
 * only the first sentence away must not be left thinking the request was dealt
 * with.
 */
export const SUPERSEDED_EXPLANATION =
  "Une analyse plus récente a été lancée sur ce dossier : cette demande n’est plus la question. Personne ne l’a décidée et rien n’a été validé.";

/** Returned when somebody tries to decide one anyway. */
export const SUPERSEDED_REFUSAL =
  "Une analyse plus récente a remplacé celle que visait cette demande : il n’y a plus rien à décider ici. Ouvrez le dossier et décidez de l’analyse en cours.";

/**
 * The words on the badge.
 *
 * Delegates to `decisionLabel` for everything else rather than restating the
 * five it already knows: two label functions is how a status comes to read as
 * "Approved" on one screen and "approved" on another.
 */
export function approvalStatusLabel(status: string): string {
  return isSupersededStatus(status) ? "Remplacée" : decisionLabel(status);
}
