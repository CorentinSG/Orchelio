import Link from "next/link";

import { Badge, Callout, Card, DataRow } from "@/components/ui";
import { formatDate } from "@/components/matter-ui";
import { requireWorkspacePermission } from "@/lib/auth/workspace";
import { firmConfiguration } from "@/lib/data/firms";
import { firmTimezone } from "@/lib/format/dates";
import {
  formatCost,
  listUsageRecords,
  usageByMatter,
  usageByOperation,
  usageSummary,
} from "@/lib/data/usage";
import { serverEnv } from "@/lib/env";
import { providerNotice, runLabel } from "@/lib/ai/notice";

export const metadata = { title: "Consommation et coûts" };
export const dynamic = "force-dynamic";

const OPERATION_LABELS: Record<string, string> = {
  claude_analyst: "Claude Analyst — matter analysis",
  claude_reviewer: "Claude Reviewer — independent check",
};

function operationLabel(operation: string): string {
  return OPERATION_LABELS[operation] ?? operation;
}

function formatTokens(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Orchelio — what the assistant cost.
 *
 * Whether a figure on this page is simulated is a property of the stored record
 * rather than a label this screen adds: the page reads
 * `UsageRecord.isRealCharge` and `UsageRecord.provider` instead of asserting
 * anything, so a firm that ran ten analyses under the simulation and then
 * installed a model sees each row described as what it was.
 *
 * Every sentence about the configured provider comes from
 * `src/lib/ai/notice.ts` for the same reason. This page asserted them itself
 * until there was a second provider to be wrong about.
 */
export default async function UsagePage() {
  const { firm, scope } = await requireWorkspacePermission("/usage", "firm.costs.view");

  const [summary, byOperation, byMatter, records, configuration] = await Promise.all([
    usageSummary(scope),
    usageByOperation(scope),
    usageByMatter(scope),
    listUsageRecords(scope, 25),
    firmConfiguration(scope),
  ]);

  const env = serverEnv();
  const notice = providerNotice(env);
  const currency = configuration?.currency ?? "USD";
  const timezone = firmTimezone(configuration?.timezone);
  const totalRuns = summary.analyses + summary.reviews;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">{firm.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Consommation et coûts</h1>
        <p className="mt-1 text-ink-muted">
          Assistant usage for this firm, and this firm only.
        </p>
      </header>

      <Callout tone="warning" title={notice.costTitle}>
        <p>
          The AI provider is <code className="font-mono">{env.aiProvider}</code>.{" "}
          {notice.whereItGoes}
        </p>
      </Callout>

      {summary.includesRealCharges ? (
        <Callout tone="danger" title="Some records are marked as real charges" assertive>
          At least one usage record has <code className="font-mono">isRealCharge</code> set. That
          should not happen in this build; treat the totals below as unexplained until it is.
        </Callout>
      ) : null}

      {totalRuns === 0 ? (
        <Card title="Nothing has been run yet">
          <p className="text-sm text-ink-muted">
            No analysis has been run for {firm.name}, so there is nothing to cost. Run one from a
            matter&apos;s Analysis tab and this page fills in.
          </p>
          <p className="mt-2 text-sm">
            <Link href="/matters" className="font-medium text-brand underline underline-offset-4">
              Open the matter list
            </Link>
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Tile label="Analyses" value={summary.analyses} hint="Claude Analyst runs" />
            <Tile label="Reviews" value={summary.reviews} hint="Claude Reviewer runs" />
            <Tile
              label="Tokens"
              value={formatTokens(summary.inputTokens + summary.outputTokens)}
              hint={`${formatTokens(summary.inputTokens)} in / ${formatTokens(summary.outputTokens)} out`}
            />
            <Tile
              label={notice.costLabel}
              value={formatCost(summary.costCents, currency)}
              hint={notice.costHint}
            />
          </div>

          <Card title="By operation" description="What each kind of run accounts for.">
            <dl>
              {byOperation.map((row) => (
                <DataRow
                  key={row.operation}
                  label={operationLabel(row.operation)}
                  value={formatCost(row.costCents, currency)}
                  hint={`${row.runs} run(s), ${formatTokens(row.inputTokens + row.outputTokens)} tokens`}
                />
              ))}
            </dl>
          </Card>

          {byMatter.length > 0 ? (
            <Card
              title="By matter"
              description="The matters that have used the assistant most."
            >
              <dl>
                {byMatter.map((row) => (
                  <DataRow
                    key={row.matterId}
                    label={
                      <Link
                        href={`/matters/${row.matterId}`}
                        className="font-mono text-xs text-brand underline underline-offset-4"
                      >
                        {row.reference}
                      </Link>
                    }
                    value={formatCost(row.costCents, currency)}
                    hint={`${row.runs} run(s)`}
                  />
                ))}
              </dl>
            </Card>
          ) : null}

          <Card
            title="Recent records"
            description="The most recent 25, newest first."
          >
            <ul className="divide-y divide-line">
              {records.map((record) => (
                <li key={record.id} className="flex flex-wrap items-baseline justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-ink">{operationLabel(record.operation)}</p>
                    <p className="text-xs text-ink-subtle">
                      {formatDate(record.occurredAt, timezone)}
                      {record.matter ? ` · ${record.matter.reference}` : ""} · {record.model}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={record.isRealCharge ? "danger" : "neutral"}>
                      {runLabel(record.provider, record.isRealCharge)}
                    </Badge>
                    <span className="text-sm font-medium text-ink">
                      {formatCost(record.costCents, currency)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <Card title="How these figures are produced">
        <p className="text-sm text-ink-muted">{notice.whatTheFiguresAre}</p>
        <p className="mt-2 text-sm text-ink-muted">{notice.whatItCannotTell}</p>
      </Card>
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3">
      <p className="text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="text-sm text-ink-muted">{label}</p>
      {hint ? <p className="text-xs text-ink-subtle">{hint}</p> : null}
    </div>
  );
}
