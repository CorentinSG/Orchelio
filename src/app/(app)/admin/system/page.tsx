import Link from "next/link";

import { Badge, Callout, Card, CommandLine, DataRow } from "@/components/ui";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { getSystemStatus } from "@/lib/system-status";
import { platformCounts } from "@/lib/data/platform";
import { APP_FULL_NAME } from "@/lib/app-config";

export const metadata = { title: "System overview" };
export const dynamic = "force-dynamic";

/**
 * Platform administration — technical status.
 *
 * The same check the public home page runs, with the counts an operator wants
 * next to it. It reports what is true right now rather than what was true when
 * the page was built, which is why it is dynamic: a status panel that can be
 * cached is a status panel that can be wrong.
 *
 * Nothing here reads inside a firm. The counts are the firms' own totals added
 * up, and the database check is a round-trip, not a query for anybody's data.
 */
export default async function AdminSystemPage() {
  await requirePlatformAdmin();

  const [status, counts] = await Promise.all([getSystemStatus(), platformCounts()]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Platform administration
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">System overview</h1>
        <p className="mt-1 text-ink-muted">
          Measured on this request. Nothing on this page is cached.
        </p>
      </header>

      {status.database.state === "unavailable" ? (
        <Callout tone="danger" title="The database could not be reached" assertive>
          <p>{status.database.reason}</p>
          <div className="mt-2">
            <CommandLine>{status.database.remedy}</CommandLine>
          </div>
        </Callout>
      ) : null}

      <Card title="Runtime">
        <dl>
          <DataRow label="Application" value={APP_FULL_NAME} />
          <DataRow label="Environment" value={status.appEnv} />
          <DataRow label="Node.js" value={status.nodeVersion} />
          <DataRow
            label="AI provider"
            value={
              <span className="flex items-center justify-end gap-2">
                <span className="font-mono">{status.aiProvider}</span>
                <Badge tone="ai">{status.aiProviderWord}</Badge>
              </span>
            }
            hint={status.aiProviderHint}
          />
        </dl>
      </Card>

      <Card title="Database">
        {status.database.state === "connected" ? (
          <dl>
            <DataRow
              label="State"
              value={<Badge tone="success">connected</Badge>}
              hint={`${status.database.latencyMs} ms round trip`}
            />
            <DataRow label="Migrations applied" value={status.database.migrationsApplied} />
            <DataRow label="Firms" value={status.database.firmCount} />
          </dl>
        ) : (
          <p className="text-sm text-ink-muted">
            No figures are shown, because none could be read. A zero here would be a claim about
            the data rather than about the connection.
          </p>
        )}
      </Card>

      <Card title="Records" description="Each firm's own counts, added up.">
        <dl>
          <DataRow label="Firms" value={counts.firms} />
          <DataRow label="Users" value={counts.users} />
          <DataRow label="Active sessions" value={counts.activeSessions} />
          <DataRow label="Matters" value={counts.matters} />
          <DataRow label="Documents" value={counts.documents} />
          <DataRow label="Analyses" value={counts.analyses} />
          <DataRow label="Approval requests" value={counts.approvals} />
          <DataRow label="Activity events" value={counts.auditEvents} />
        </dl>
      </Card>

      <Callout tone="neutral" title="What this page is not">
        It is not monitoring. There is no history, no alerting and no retention here — a single
        reading, taken when the page was opened. A deployment that mattered would need all three;
        see <span className="font-mono">docs/PRODUCTION_READINESS.md</span>.
      </Callout>

      <p className="text-sm text-ink-muted">
        <Link href="/admin/firms" className="font-medium text-brand underline underline-offset-4">
          Firms
        </Link>{" "}
        ·{" "}
        <Link href="/admin/demo" className="font-medium text-brand underline underline-offset-4">
          Demonstration data
        </Link>
      </p>
    </div>
  );
}
