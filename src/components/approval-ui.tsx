import Link from "next/link";

import { Badge, Callout, type Tone } from "@/components/ui";
import {
  SELF_DECISION_NOTICE,
  SELF_DECISION_REFUSAL,
  isSelfDecision,
} from "@/lib/approvals/separation";
import { formatDate } from "@/components/matter-ui";
import {
  APPROVAL_DECISIONS,
  type ApprovalDecision,
  approvableAction,
  actionLabel,
  decisionLabel,
  requiresNote,
} from "@/lib/approvals/actions";
import {
  SUPERSEDED_EXPLANATION,
  approvalStatusLabel,
  isPendingStatus,
  isSupersededStatus,
} from "@/lib/approvals/status";
import type { RiskLevel } from "@/lib/constants";

/**
 * Orchelio — deciding.
 *
 * The screen a person uses to take responsibility for something. Three things
 * it must not do, each of which is easy to do by accident:
 *
 *  * Make approving the effortless option. Approve is one button among four,
 *    not a primary action with three alternatives hidden behind a menu.
 *  * Hide what approving causes. Every card states the effect *before* the
 *    buttons, not in a confirmation afterwards.
 *  * Let a rejection be a shrug. Three of the four decisions leave somebody
 *    with work to do, and each demands a note saying what.
 */

const RISK_TONE: Record<RiskLevel, Tone> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

const STATUS_TONE: Record<string, Tone> = {
  pending: "warning",
  approved: "success",
  approved_with_edits: "success",
  new_analysis_requested: "brand",
  rejected: "danger",
  // Neutral, and not by omission. Superseded is neither good news nor bad — it
  // is the absence of news, and colouring it either way would suggest an
  // outcome nobody reached.
  superseded: "neutral",
};

export function RiskBadge({ level }: { level: string }) {
  const tone = RISK_TONE[level as RiskLevel] ?? "neutral";
  return <Badge tone={tone}>{level} risk</Badge>;
}

export function ApprovalStatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{approvalStatusLabel(status)}</Badge>;
}

/** Where a link to the thing being decided should point. */
export function resourceHref(
  resourceType: string,
  matterId: string | null,
): string | null {
  if (!matterId) return null;
  switch (resourceType) {
    case "ai_analysis":
      return `/matters/${matterId}?tab=analysis`;
    case "draft_communication":
      return `/matters/${matterId}?tab=communications`;
    case "matter":
      return `/matters/${matterId}`;
    default:
      return `/matters/${matterId}`;
  }
}

export type ApprovalCardData = {
  id: string;
  action: string;
  resourceType: string;
  riskLevel: string;
  summary: string;
  status: string;
  decisionNote: string | null;
  createdAt: Date;
  decidedAt: Date | null;
  supersededAt: Date | null;
  matter: { id: string; reference: string; title: string } | null;
  requestedBy: { id: string; name: string } | null;
  decidedBy: { name: string } | null;
};

export function ApprovalCard({
  approval,
  canDecide,
  returnTo,
  problem,
  focused,
  viewerId,
  timezone,
  requireSeparateApprover = false,
}: {
  approval: ApprovalCardData;
  canDecide: boolean;
  returnTo: string;
  problem?: string | null;
  focused?: boolean;
  /** Who is looking. Used to tell somebody they raised this themselves. */
  viewerId: string;
  /** The firm's chosen zone. A decision recorded on a Tuesday evening in Los
   * Angeles must not be dated Wednesday. */
  timezone: string;
  /** Whether this firm refuses a decision from the person who asked. */
  requireSeparateApprover?: boolean;
}) {
  const action = approvableAction(approval.action);
  const href = resourceHref(approval.resourceType, approval.matter?.id ?? null);
  const pending = isPendingStatus(approval.status);
  const superseded = isSupersededStatus(approval.status);

  // Naming the requester is not conditional; refusing is. Somebody about to
  // decide their own request is told so whether or not the firm blocks it,
  // because the information is what makes the decision considered.
  const self = isSelfDecision(approval.requestedBy?.id, viewerId);
  const blocked = self && requireSeparateApprover;

  return (
    <li
      id={`approval-${approval.id}`}
      className={`rounded-card border px-4 py-4 ${
        focused ? "border-brand bg-brand-soft" : "border-line bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ink">{actionLabel(approval.action)}</p>
          {approval.matter ? (
            <p className="text-sm text-ink-muted">
              <span className="font-mono text-xs">{approval.matter.reference}</span> —{" "}
              {approval.matter.title}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge level={approval.riskLevel} />
          <ApprovalStatusBadge status={approval.status} />
          {action?.lockedBy ? <Badge tone="neutral">Cannot be switched off</Badge> : null}
        </div>
      </div>

      <p className="mt-3 text-sm text-ink">{approval.summary}</p>

      <p className="mt-2 text-xs text-ink-subtle">
        Requested by {approval.requestedBy?.name ?? "Orchelio"} on {formatDate(approval.createdAt, timezone)}
        {href ? (
          <>
            {" · "}
            <Link href={href} className="font-medium text-brand underline underline-offset-4">
              Open what is being decided
            </Link>
          </>
        ) : null}
      </p>

      {pending ? (
        <>
          {action ? (
            <div className="mt-4 rounded-md border border-line bg-surface-muted px-3 py-2.5">
              <p className="text-sm font-medium text-ink">{action.question}</p>
              {/* Before the buttons, not in a dialogue after them. */}
              <p className="mt-1 text-sm text-ink-muted">
                <span className="font-medium">If you approve:</span> {action.effect}
              </p>
            </div>
          ) : null}

          {problem ? (
            <Callout tone="danger" title="That decision was not recorded" assertive>
              {problem}
            </Callout>
          ) : null}

          {self && canDecide ? (
            <div className="mt-3">
              <Callout
                tone={blocked ? "warning" : "neutral"}
                title={blocked ? "Somebody else has to decide this one" : "You raised this request"}
              >
                {blocked ? SELF_DECISION_REFUSAL : SELF_DECISION_NOTICE}
              </Callout>
            </div>
          ) : null}

          {canDecide && !blocked ? (
            <form method="post" action="/api/approvals/decide" className="mt-4 space-y-3">
              <input type="hidden" name="approvalId" value={approval.id} />
              <input type="hidden" name="returnTo" value={returnTo} />

              <div>
                <label
                  htmlFor={`note-${approval.id}`}
                  className="block text-sm font-medium text-ink"
                >
                  Note
                </label>
                <p className="text-xs text-ink-subtle">
                  Required for every decision except a plain approval — the three others leave
                  somebody with work to do, and a bare verdict tells them nothing.
                </p>
                <textarea
                  id={`note-${approval.id}`}
                  name="note"
                  rows={2}
                  className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                />
              </div>

              {/* Four buttons of equal weight. Approving is a decision, not the
                  default that happens when somebody stops reading. */}
              <div className="flex flex-wrap gap-2">
                {APPROVAL_DECISIONS.map((decision) => (
                  <button
                    key={decision}
                    type="submit"
                    name="decision"
                    value={decision}
                    className={`rounded-md border px-3 py-2 text-sm font-medium ${
                      decision === "rejected"
                        ? "border-danger/40 text-danger hover:bg-danger-soft"
                        : "border-line text-ink hover:bg-surface-muted"
                    }`}
                  >
                    {decisionLabel(decision)}
                    {requiresNote(decision as ApprovalDecision) ? (
                      // The leading space is inside the string, not between JSX
                      // children: JSX collapses whitespace around an expression,
                      // and the accessible name would otherwise run the two
                      // together. Paid for three times now.
                      <span className="text-xs font-normal text-ink-subtle">
                        {" — needs a note"}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </form>
          ) : (
            <Callout tone="neutral" title="Your role does not decide these">
              You can see what is waiting, which is what a queue is for. Deciding is held by
              attorneys and firm administrators.
            </Callout>
          )}
        </>
      ) : superseded ? (
        // Never "…by a person on…", which is what this branch used to say for
        // anything that was not pending. Nobody decided a superseded request,
        // and there is no name to put here.
        <div className="mt-3 rounded-md border border-line bg-surface-muted px-3 py-2.5">
          <p className="text-sm text-ink">
            {`Superseded on ${formatDate(approval.supersededAt, timezone)} — nobody decided it`}
          </p>
          <p className="mt-1 text-sm text-ink-muted">{SUPERSEDED_EXPLANATION}</p>
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-line bg-surface-muted px-3 py-2.5">
          <p className="text-sm text-ink">
            {decisionLabel(approval.status)} by {approval.decidedBy?.name ?? "a person"} on{" "}
            {formatDate(approval.decidedAt, timezone)}
          </p>
          {approval.decisionNote ? (
            <p className="mt-1 text-sm text-ink-muted">{approval.decisionNote}</p>
          ) : null}
        </div>
      )}
    </li>
  );
}
