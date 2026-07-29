import Link from "next/link";

import { Badge, Callout, Card, DataRow } from "@/components/ui";
import { formatDate } from "@/components/matter-ui";
import { requireWorkspacePermission } from "@/lib/auth/workspace";
import { listRecentAnalyses } from "@/lib/data/analyses";
import { firmConfiguration } from "@/lib/data/firms";
import { formatCost, usageSummary } from "@/lib/data/usage";
import { parseStringArray } from "@/lib/json-field";
import { AI_FEATURE_OPTIONS } from "@/lib/onboarding/catalogue";
import { LOCKED_APPROVALS } from "@/lib/constants";
import { reviewStatusLabel, type ReviewStatus } from "@/lib/ai/types";
import { serverEnv } from "@/lib/env";

export const metadata = { title: "AI Workspace" };
export const dynamic = "force-dynamic";

const LOCKED_RULES_NOTE =
  `All ${LOCKED_APPROVALS.length} locked rules are stored against every firm's configuration, ` +
  "so the guarantee is auditable in the data rather than asserted in a comment. " +
  "The approval centre acts on them.";

/**
 * Orchelio — the AI workspace.
 *
 * Deliberately as much about what Claude does *not* do as about what it does.
 * A page listing analyses with no statement of their limits invites a reader to
 * treat them as findings, which is the failure this whole design is arranged
 * to prevent.
 */
export default async function AiWorkspacePage() {
  const { firm, scope } = await requireWorkspacePermission("/ai", "ai.result.view");

  const [analyses, configuration, usage] = await Promise.all([
    listRecentAnalyses(scope, 20),
    firmConfiguration(scope),
    usageSummary(scope),
  ]);

  const enabled = parseStringArray(configuration?.aiFeatures);
  const provider = serverEnv().aiProvider;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">{firm.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">AI Workspace</h1>
        <p className="mt-1 text-ink-muted">
          Every analysis this firm has run, and the limits every one of them carries.
        </p>
      </header>

      <Callout tone="ai" title="Simulated, and structurally so">
        <p>
          The provider is <code className="font-mono">{provider}</code>. No request leaves this
          machine, no API key is present, and no charge is incurred. The figures below are
          recorded so the usage screens have real data to show — they are marked as simulated in
          the database, not merely on this page.
        </p>
        <p className="mt-2">
          The analyses are produced by deterministic rules over each matter&apos;s recorded fields,
          intake answers and document <em>names</em>. No document is ever opened: Orchelio stores a
          filename, a type and a size, and there is no OCR in this build.
        </p>
      </Callout>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="What this firm asked for" description="Chosen during onboarding, step 5.">
          {enabled.length === 0 ? (
            <Callout tone="warning" title="Nothing is switched on">
              <p>
                This firm has enabled no Claude features, so an analysis has nothing to produce.
              </p>
              <p className="mt-2">
                <Link
                  href="/onboarding/5"
                  className="font-medium text-brand underline underline-offset-4"
                >
                  Choose them in the firm setup
                </Link>
              </p>
            </Callout>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {enabled.map((feature) => (
                <li key={feature}>
                  <Badge tone="ai">{featureLabel(feature)}</Badge>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm text-ink-subtle">
            An analysis produces output only for the features on this list. One that is enabled
            and finds nothing says so; one that is switched off is not mentioned at all.
          </p>
        </Card>

        <Card title="Simulated usage" description="This firm only. No charge was incurred.">
          <dl>
            <DataRow label="Analyses run" value={usage.analyses} />
            <DataRow label="Reviews run" value={usage.reviews} />
            <DataRow label="Input tokens" value={usage.inputTokens.toLocaleString("en-GB")} />
            <DataRow label="Output tokens" value={usage.outputTokens.toLocaleString("en-GB")} />
            <DataRow label="Simulated cost" value={formatCost(usage.costCents)} />
            <DataRow
              label="Real charges included"
              value={usage.includesRealCharges ? "Yes" : "None — every record is simulated"}
            />
          </dl>
        </Card>
      </div>

      <Card
        title={`Analyses (${analyses.length})`}
        description="Most recent first. Every one requires a person to read it."
      >
        {analyses.length === 0 ? (
          <Callout tone="neutral" title="Nothing has been run yet">
            Open a matter and use its AI Analysis tab.
          </Callout>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted">
                  <th className="py-2 pr-4 font-medium">Matter</th>
                  <th className="py-2 pr-4 font-medium">Run</th>
                  <th className="py-2 pr-4 font-medium">State</th>
                  <th className="py-2 pr-4 font-medium">Review</th>
                  <th className="py-2 font-medium">Human review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {analyses.map((analysis) => (
                  <tr key={analysis.id} className="align-top">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/matters/${analysis.matterId}?tab=analysis`}
                        className="group block"
                      >
                        <span className="font-mono text-xs text-ink-subtle">
                          {analysis.matter.reference}
                        </span>
                        <span className="block font-medium text-ink group-hover:text-brand">
                          {analysis.matter.title}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">{formatDate(analysis.startedAt)}</td>
                    <td className="py-3 pr-4">
                      <Badge
                        tone={
                          analysis.status === "completed"
                            ? "success"
                            : analysis.status === "failed"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {analysis.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      {analysis.reviews[0] ? (
                        <Badge
                          tone={
                            analysis.reviews[0].status === "approved_for_human_review"
                              ? "success"
                              : "warning"
                          }
                        >
                          {reviewStatusLabel(analysis.reviews[0].status as ReviewStatus)}
                        </Badge>
                      ) : (
                        <span className="text-ink-subtle">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      {/* Read from the row, never asserted by this page. */}
                      <Badge tone="warning">
                        {analysis.reviews[0]?.humanReviewRequired === false ? "Not required" : "Required"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="What Claude may never do here"
        description="Nine rules that cannot be switched off, in this firm or any other."
      >
        <ul className="ml-4 list-disc space-y-1 text-sm text-ink-muted">
          <li>Reach an eligibility conclusion, or give legal advice, without a person deciding.</li>
          <li>Confirm a deadline. Every date shown is one somebody recorded, not one Orchelio checked.</li>
          <li>File anything, send anything, or communicate with a client or an opposing party.</li>
          <li>Delete anything permanently, or clear a conflict.</li>
        </ul>
        {/* One template string, not interpolation between JSX children: JSX
            collapses the whitespace around an expression and renders
            "9locked rules". Paid for twice already — see docs/ROADMAP.md. */}
        <p className="mt-4 text-sm text-ink-subtle">{LOCKED_RULES_NOTE}</p>
      </Card>
    </div>
  );
}

function featureLabel(key: string): string {
  const direct = AI_FEATURE_OPTIONS.find(
    (option) => option.key.default === key || option.id === key,
  );
  if (direct) return direct.label;
  const variant = AI_FEATURE_OPTIONS.find((option) =>
    Object.values(option.key.byPracticeArea ?? {}).includes(key),
  );
  return variant?.label ?? key.split("_").join(" ");
}
