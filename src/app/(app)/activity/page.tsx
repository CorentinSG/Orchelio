import Link from "next/link";

import { Callout, Card } from "@/components/ui";
import { ActivityDetail, ActivityStatusBadge, activityLabel } from "@/components/activity-ui";
import { requireWorkspacePermission } from "@/lib/auth/workspace";
import { activityActions, activityUsers, countActivity, listActivity } from "@/lib/data/activity";
import { requestNow } from "@/lib/clock";
import { firmTimezoneFor } from "@/lib/data/firms";
import { formatMoment, timezoneNotice } from "@/lib/format/dates";

export const metadata = { title: "Journal d’activité" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string | undefined {
  const found = Array.isArray(value) ? value[0] : value;
  return found && found.length > 0 ? found : undefined;
}

/**
 * Orchelio — this firm's activity log.
 *
 * Append-only, and only by application discipline: `src/lib/audit.ts` exposes
 * one write function and there is no update or delete path anywhere in the
 * codebase. That is a guarantee about this code, not about the database, and
 * the page says so rather than implying more.
 *
 * A firm's log is itself confidential — it records which matters were opened,
 * by whom and when — so it is read through the scoped data layer like anything
 * else, and platform-level events (a sign-in, before any firm is chosen) carry
 * no firm and never appear here.
 */
export default async function ActivityPage({ searchParams }: PageProps) {
  const { firm, scope } = await requireWorkspacePermission("/activity", "firm.audit.view");
  const query = await searchParams;
  const now = requestNow();

  const days = Number(one(query["days"]) ?? "0");
  const filters = {
    action: one(query["action"]),
    userId: one(query["user"]),
    status: one(query["status"]),
    ...(Number.isFinite(days) && days > 0
      ? { since: new Date(now.getTime() - days * 86_400_000) }
      : {}),
  };

  const [events, actions, users, total, timezone] = await Promise.all([
    listActivity(scope, filters, PAGE_SIZE),
    activityActions(scope),
    activityUsers(scope),
    countActivity(scope, filters),
    firmTimezoneFor(scope),
  ]);

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">{firm.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Journal d’activité</h1>
        <p className="mt-1 text-ink-muted">
          {total} event{total === 1 ? "" : "s"}
          {activeFilters > 0 ? " matching these filters" : ""} for this firm.
        </p>
        {/* The log is the one screen where the time of day is the point, so it
            is the one screen that shows it — and it now shows it in the firm's
            zone rather than the server's. */}
        <p className="mt-1 text-sm text-ink-subtle">{timezoneNotice(timezone)}</p>
      </header>

      <Callout tone="neutral" title="Append-only, by discipline rather than by the database">
        <p>
          Nothing in Orchelio updates or deletes a log entry — there is one write function and no
          other path. That is a property of this codebase, not of the storage underneath it.
        </p>
        <p className="mt-2">
          A production deployment needs write-once storage or an insert-only database role before
          this could be relied on in a dispute. See{" "}
          <Link
            href="https://github.com/CorentinSG/Orchelio/blob/main/docs/PRODUCTION_READINESS.md"
            className="font-medium text-brand underline underline-offset-4"
          >
            production readiness
          </Link>
          .
        </p>
      </Callout>

      <Card title="Filters" description="Applied on the server, within this firm.">
        <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              {actions.map((action) => (
                <option key={action} value={action}>
                  {activityLabel(action)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="user" className="block text-sm font-medium text-ink">
              Who
            </label>
            <select
              id="user"
              name="user"
              defaultValue={filters.userId ?? ""}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Anyone</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-ink">
              Outcome
            </label>
            <select
              id="status"
              name="status"
              defaultValue={filters.status ?? ""}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Any outcome</option>
              <option value="success">Succeeded</option>
              <option value="denied">Refused</option>
              <option value="failure">Failed</option>
            </select>
          </div>

          <div>
            <label htmlFor="days" className="block text-sm font-medium text-ink">
              When
            </label>
            <select
              id="days"
              name="days"
              defaultValue={one(query["days"]) ?? ""}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Any time</option>
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
            >
              Apply
            </button>
            {activeFilters > 0 ? (
              <Link
                href="/activity"
                className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </Card>

      <Card
        title={`Events (${events.length} shown)`}
        description={
          total > events.length
            ? `Most recent ${PAGE_SIZE}. Narrow the filters to see further back.`
            : "Most recent first."
        }
      >
        {events.length === 0 ? (
          <Callout tone="neutral" title="Nothing matches">
            {activeFilters > 0
              ? "No event in this firm's log matches those filters."
              : "This firm has no recorded activity yet."}
          </Callout>
        ) : (
          <ul className="divide-y divide-line">
            {events.map((event) => (
              <li key={event.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{activityLabel(event.action)}</p>
                    <ActivityStatusBadge status={event.status} />
                  </div>
                  <p className="text-sm text-ink-muted">{event.user?.name ?? "Orchelio"}</p>
                  <ActivityDetail oldValue={event.oldValue} newValue={event.newValue} />
                  <p className="mt-1 font-mono text-xs text-ink-subtle">{event.action}</p>
                </div>
                <time
                  dateTime={event.createdAt.toISOString()}
                  className="whitespace-nowrap text-xs text-ink-subtle"
                >
                  {formatMoment(event.createdAt, timezone)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
