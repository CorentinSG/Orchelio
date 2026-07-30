import Link from "next/link";

import { Badge, Callout, Card } from "@/components/ui";
import { ApprovalCard } from "@/components/approval-ui";
import { requireWorkspacePermission } from "@/lib/auth/workspace";
import { can } from "@/lib/auth/permissions";
import { actorFor } from "@/lib/auth/session";
import {
  approvalActions,
  approvalCounts,
  listDecidedApprovals,
  listPendingApprovals,
  listSupersededApprovals,
} from "@/lib/data/approvals";
import {
  SUPERSEDED_EXPLANATION,
  isDecisionStatus,
  isPendingStatus,
  isSupersededStatus,
} from "@/lib/approvals/status";
import { firmConfiguration } from "@/lib/data/firms";
import { firmTimezone, timezoneNotice } from "@/lib/format/dates";
import { parseJsonObject } from "@/lib/json-field";
import {
  APPROVABLE_ACTIONS,
  actionLabel,
  approvalReason,
  rulesWithoutActions,
} from "@/lib/approvals/actions";
import { LOCKED_APPROVAL_OPTIONS } from "@/lib/onboarding/catalogue";

export const metadata = { title: "Approvals" };
export const dynamic = "force-dynamic";

/**
 * How many cards the page renders.
 *
 * The counts beside the headings come from their own queries, so a bound here
 * shortens the page without changing what it claims. Both are stated on screen
 * whenever there is more than fits — a silent truncation reads as "that is all
 * of them".
 */
const PENDING_SHOWN = 50;
const DECIDED_SHOWN = 25;
const SUPERSEDED_SHOWN = 25;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string | undefined {
  const found = Array.isArray(value) ? value[0] : value;
  return found && found.length > 0 ? found : undefined;
}

/**
 * Orchelio — the approval centre.
 *
 * Everything waiting for a person, and everything a person has decided. The
 * screen is deliberately arranged so that the pending queue is what you see
 * and the history is below it: a decided request is a record, a pending one is
 * somebody waiting.
 */
export default async function ApprovalsPage({ searchParams }: PageProps) {
  const { session, firm, scope } = await requireWorkspacePermission("/approvals", "approval.view");
  const query = await searchParams;

  const filters = {
    status: one(query["status"]),
    action: one(query["action"]),
    riskLevel: one(query["risk"]),
  };
  const problem = one(query["problem"]) ?? null;
  const focus = one(query["focus"]) ?? one(query["decided"]) ?? null;

  // Three groups, and each asks for itself. This used to be a pair, with
  // "everything that is not pending" standing in for "decided" — which became
  // false the moment a request could leave the queue without anybody deciding
  // it.
  const showPending = !filters.status || isPendingStatus(filters.status);
  const showDecided = !filters.status || isDecisionStatus(filters.status);
  const showSuperseded = !filters.status || isSupersededStatus(filters.status);

  const [pending, decided, superseded, counts, actionsPresent, configuration] = await Promise.all([
    showPending ? listPendingApprovals(scope, filters, PENDING_SHOWN) : [],
    showDecided ? listDecidedApprovals(scope, filters, DECIDED_SHOWN) : [],
    showSuperseded ? listSupersededApprovals(scope, filters, SUPERSEDED_SHOWN) : [],
    approvalCounts(scope, filters),
    approvalActions(scope),
    firmConfiguration(scope),
  ]);

  const timezone = firmTimezone(configuration?.timezone);
  const firmApprovals = parseJsonObject(configuration?.approvals);
  const canDecide = can(actorFor(session.user, firm.id), "approval.decide");
  const uncovered = rulesWithoutActions();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">{firm.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Approvals</h1>
        <p className="mt-1 text-ink-muted">
          {counts.pending} waiting for a decision. Nothing here has taken effect.
        </p>
        {/* Which zone the dates below are in, said rather than assumed. */}
        <p className="mt-1 text-sm text-ink-subtle">{timezoneNotice(timezone)}</p>
      </header>

      {one(query["decided"]) ? (
        <Callout tone="success" title="Decision recorded">
          It is in this firm&apos;s activity log, with your name, the time and your note.{" "}
          <Link href="/activity" className="font-medium text-brand underline underline-offset-4">
            See the log
          </Link>
        </Callout>
      ) : null}

      <Card title="Filters" description="Applied on the server, within this firm.">
        <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-ink">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={filters.status ?? ""}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Any status</option>
              <option value="pending">Awaiting a decision</option>
              <option value="approved">Approved</option>
              <option value="approved_with_edits">Approved with edits</option>
              <option value="new_analysis_requested">New analysis requested</option>
              <option value="rejected">Rejected</option>
              <option value="superseded">Superseded — nobody decided</option>
            </select>
          </div>

          <div>
            <label htmlFor="action" className="block text-sm font-medium text-ink">
              Action
            </label>
            <select
              id="action"
              name="action"
              defaultValue={filters.action ?? ""}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Any action</option>
              {actionsPresent.map((action) => (
                <option key={action} value={action}>
                  {actionLabel(action)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="risk" className="block text-sm font-medium text-ink">
              Risk
            </label>
            <select
              id="risk"
              name="risk"
              defaultValue={filters.riskLevel ?? ""}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Any risk</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
            >
              Apply
            </button>
            <Link
              href="/approvals"
              className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              Clear
            </Link>
          </div>
        </form>
      </Card>

      <Card
        title={`Waiting for a decision (${counts.pending})`}
        description={
          counts.pending > pending.length
            ? `Showing the ${pending.length} most recent. Narrow the filters above to reach the rest.`
            : undefined
        }
      >
        {pending.length === 0 ? (
          <Callout tone="neutral" title="Nothing is waiting">
            Nothing in this firm currently needs a person&apos;s decision.
          </Callout>
        ) : (
          <ul className="space-y-4">
            {pending.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                viewerId={session.user.id}
                requireSeparateApprover={configuration?.requireSeparateApprover ?? false}
                timezone={timezone}
                canDecide={canDecide}
                returnTo="/approvals"
                problem={focus === approval.id ? problem : null}
                focused={focus === approval.id}
              />
            ))}
          </ul>
        )}
        {problem && !focus ? (
          <Callout tone="danger" title="That decision was not recorded" assertive>
            {problem}
          </Callout>
        ) : null}
      </Card>

      {decided.length > 0 ? (
        <Card
          title={`Decided (${counts.decided})`}
          description={
            counts.decided > decided.length
              ? `Kept, not cleared. Showing the ${decided.length} most recent.`
              : "Kept, not cleared. A decision is a record of who took responsibility."
          }
        >
          <ul className="space-y-4">
            {decided.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                viewerId={session.user.id}
                requireSeparateApprover={configuration?.requireSeparateApprover ?? false}
                timezone={timezone}
                canDecide={false}
                returnTo="/approvals"
              />
            ))}
          </ul>
        </Card>
      ) : null}

      {superseded.length > 0 ? (
        <Card
          title={`Superseded (${counts.superseded})`}
          description={
            counts.superseded > superseded.length
              ? `Nobody decided these. Showing the ${superseded.length} most recent.`
              : "Nobody decided these."
          }
        >
          <p className="mb-4 text-sm text-ink-muted">{SUPERSEDED_EXPLANATION}</p>
          <ul className="space-y-4">
            {superseded.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                viewerId={session.user.id}
                requireSeparateApprover={configuration?.requireSeparateApprover ?? false}
                timezone={timezone}
                canDecide={false}
                returnTo="/approvals"
              />
            ))}
          </ul>
        </Card>
      ) : null}

      <Card
        title="What raises an approval here"
        description="And what this firm has chosen for each."
      >
        <ul className="divide-y divide-line">
          {APPROVABLE_ACTIONS.map((action) => {
            const reason = approvalReason(action, firmApprovals);
            return (
              <li key={action.key} className="flex flex-wrap items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{action.label}</p>
                  <p className="text-xs text-ink-subtle">{action.effect}</p>
                </div>
                <Badge
                  tone={
                    reason === "locked" ? "warning" : reason === "configured" ? "brand" : "neutral"
                  }
                >
                  {reason === "locked"
                    ? "Always — cannot be switched off"
                    : reason === "configured"
                      ? "This firm requires it"
                      : "This firm does not require it"}
                </Badge>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card
        title="Rules this build does not yet raise"
        description="Said plainly, because a rule nobody raises protects nobody."
      >
        <p className="text-sm text-ink-muted">
          The onboarding questionnaire offers more rules than this build has actions for. A firm
          that switched one of these on should know that no screen currently triggers it — not
          assume it is being enforced.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-ink">Locked, and not yet raised</p>
            <ul className="mt-1 space-y-0.5">
              {uncovered.locked.map((rule) => (
                <li key={rule} className="text-sm text-ink-muted">
                  {lockedLabel(rule)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-ink">Configurable, and not yet raised</p>
            <ul className="mt-1 space-y-0.5">
              {uncovered.configurable.map((rule) => (
                <li key={rule} className="text-sm text-ink-muted">
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink-subtle">
          Several are unreachable rather than unimplemented: Orchelio has no transport, so nothing
          can be submitted, shared or sent, and nothing is ever permanently deleted.
        </p>
      </Card>
    </div>
  );
}

function lockedLabel(key: string): string {
  return LOCKED_APPROVAL_OPTIONS.find((option) => option.key === key)?.label ?? key;
}
