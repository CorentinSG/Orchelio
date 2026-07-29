import Link from "next/link";

import { Badge, Callout, Card, DataRow } from "@/components/ui";
import { formatDate } from "@/components/matter-ui";
import { requireWorkspacePermission } from "@/lib/auth/workspace";
import { firmConfiguration } from "@/lib/data/firms";
import {
  formatCost,
  listUsageRecords,
  usageByMatter,
  usageByOperation,
  usageSummary,
} from "@/lib/data/usage";
import { serverEnv } from "@/lib/env";
import { APP_NAME } from "@/lib/app-config";

export const metadata = { title: "Usage and costs" };
export const dynamic = "force-dynamic";

/** The exact wording the specification asks for, in one place. */
const SIMULATED_COST_NOTICE = "Simulated cost — No API charge was incurred.";

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
 * Orchelio — what the assistant would have cost.
 *
 * Every figure on this page is simulated, and that is a property of the stored
 * record rather than a label this screen adds: `UsageRecord.isRealCharge` is
 * `false` on every row, and the page reads it instead of asserting it. If a
 * real provider were ever billed, the flag would be true and the page would say
 * something different without anyone editing this file.
 *
 * The cost columns exist so that a real charge can be recorded later without a
 * schema change. They are not a forecast: nothing here estimates what a real
 * deployment would cost, because the simulation's token counts are derived from
 * the matter's own fields rather than from a model's actual consumption.
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

  const provider = serverEnv().aiProvider;
  const currency = configuration?.currency ?? "USD";
  const totalRuns = summary.analyses + summary.reviews;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">{firm.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Usage and costs</h1>
        <p className="mt-1 text-ink-muted">
          Simulated assistant usage for this firm, and this firm only.
        </p>
      </header>

      <Callout tone="warning" title={SIMULATED_COST_NOTICE}>
        <p>
          The AI provider is <code className="font-mono">{provider}</code>. Nothing was sent to
          Anthropic or to any other service, no API key is configured, and no invoice exists. The
          figures below show what {APP_NAME} recorded, not what anybody was charged.
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
              label="Simulated cost"
              value={formatCost(summary.costCents, currency)}
              hint="no charge was incurred"
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
                      {formatDate(record.occurredAt)}
                      {record.matter ? ` · ${record.matter.reference}` : ""} · {record.model}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={record.isRealCharge ? "danger" : "neutral"}>
                      {record.isRealCharge ? "real charge" : "simulated"}
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
        <p className="text-sm text-ink-muted">
          Each run records the tokens a real request of that size would have used and the cost that
          would have followed, at published rates. The token counts are derived from the
          matter&apos;s own fields and document names — the same inputs the simulated analysis
          reads — so they move realistically with the size of a matter without any request being
          made.
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          What this page cannot tell you is what a real deployment would cost. That depends on the
          model, the prompt and the documents actually sent, none of which exist here.
        </p>
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
