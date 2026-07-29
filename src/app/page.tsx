import Link from "next/link";

import { DemoBanner } from "@/components/demo-banner";
import { OrchelioWordmark } from "@/components/brand";
import { Badge, Callout, Card, CommandLine, DataRow, StatusDot } from "@/components/ui";
import {
  APP_FULL_NAME,
  APP_NAME,
  APP_TAGLINE,
  FICTIONAL_DATA_NOTICE,
  POWERED_BY,
} from "@/lib/app-config";
import { practiceAreaLabel } from "@/lib/practice-areas";
import { PHASES, currentPhase } from "@/lib/roadmap";
import { getSystemStatus, listFirms } from "@/lib/system-status";

/**
 * Orchelio home page.
 *
 * This is a live server-rendered status page, not a mock-up: on every request
 * it queries the local SQLite database through Prisma and reports what it
 * actually found. If the database is missing or un-migrated, it says so and
 * gives the exact command to run.
 */
export const dynamic = "force-dynamic";

const PHASE_TONE = {
  done: "success",
  in_progress: "brand",
  planned: "neutral",
} as const;

const PHASE_LABEL = {
  done: "Delivered",
  in_progress: "In progress",
  planned: "Planned",
} as const;

/**
 * Written as one string rather than as JSX text interleaved with `{APP_NAME}`:
 * the compiler collapses whitespace around expression containers that span
 * lines, which silently glues words together.
 */
const INTRODUCTION =
  `${APP_NAME} is a configurable platform for law firms. One codebase serves every firm; ` +
  "a short onboarding questionnaire configures each firm’s matter types, workflows, AI " +
  "features and human approval rules — and each firm’s data stays isolated from every " +
  "other firm.";

const NO_LIVE_AI_NOTICE =
  `${APP_NAME} runs on a simulated AI provider. No Anthropic API key is required and no ` +
  "request leaves this machine. Costs shown elsewhere in the product are simulated.";

export default async function HomePage() {
  const [status, firms] = await Promise.all([getSystemStatus(), listFirms()]);
  const phase = currentPhase();
  const databaseOk = status.database.state === "connected";

  return (
    <div className="flex min-h-dvh flex-col">
      <DemoBanner variant="long" />

      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <OrchelioWordmark size="md" />
          <div className="flex items-center gap-3">
            <Badge tone={databaseOk ? "success" : "danger"}>
              <StatusDot tone={databaseOk ? "success" : "danger"} />
              {databaseOk ? "System operational" : "Setup required"}
            </Badge>
            <Link
              href="/login"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">{APP_FULL_NAME}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {APP_TAGLINE}
          </h1>
          <p className="mt-4 text-base text-ink-muted">{INTRODUCTION}</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card
            title="Platform status"
            description="Checked live against the local database on every page load."
          >
            <dl>
              <DataRow
                label="Database (SQLite)"
                value={
                  status.database.state === "connected" ? (
                    <span className="inline-flex items-center gap-2">
                      <StatusDot tone="success" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <StatusDot tone="danger" /> Unavailable
                    </span>
                  )
                }
                hint={
                  status.database.state === "connected"
                    ? `${status.database.latencyMs} ms`
                    : undefined
                }
              />
              <DataRow
                label="Migrations applied"
                value={
                  status.database.state === "connected" ? status.database.migrationsApplied : "—"
                }
              />
              <DataRow
                label="Firms registered"
                value={status.database.state === "connected" ? status.database.firmCount : "—"}
              />
              <DataRow label="AI provider" value={status.aiProvider} hint="simulated" />
              <DataRow label="Environment" value={status.appEnv} />
              <DataRow label="Node.js" value={status.nodeVersion} />
            </dl>

            {status.database.state === "unavailable" ? (
              <div className="mt-4">
                <Callout tone="danger" title="The database is not ready" assertive>
                  <p>{status.database.reason}</p>
                  <p className="mt-2">
                    Open a terminal in the project folder and run{" "}
                    <CommandLine>{status.database.remedy}</CommandLine>, then reload this page.
                  </p>
                </Callout>
              </div>
            ) : (
              <div className="mt-4">
                <Callout tone="brand" title="No live AI calls are made">
                  <p>{NO_LIVE_AI_NOTICE}</p>
                </Callout>
              </div>
            )}
          </Card>

          <Card
            title="Firms on this instance"
            description={FICTIONAL_DATA_NOTICE}
          >
            {firms.length === 0 ? (
              <div className="py-2">
                <p className="text-sm text-ink-muted">No firm has been created yet.</p>
                <p className="mt-2 text-sm text-ink-muted">
                  Run <CommandLine>npm run seed</CommandLine> to load the two demonstration firms.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {firms.map((firm) => (
                  <li key={firm.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{firm.name}</p>
                      <p className="text-sm text-ink-muted">
                        {practiceAreaLabel(firm.primaryPracticeArea)}
                      </p>
                    </div>
                    <Badge tone={firm.status === "active" ? "success" : "neutral"}>
                      {firm.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-sm text-ink-subtle">
              <Link href="/login" className="font-medium text-brand underline underline-offset-4">
                Sign in
              </Link>{" "}
              with a demonstration account to open a firm workspace, or read the{" "}
              <Link href="/guide" className="font-medium text-brand underline underline-offset-4">
                guided demonstration
              </Link>{" "}
              first — twenty-one steps, no account needed to read them.
            </p>
          </Card>
        </div>

        <div className="mt-6">
          <Card
            title="Build progress"
            description={`Current phase: ${phase.number} — ${phase.title}.`}
          >
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PHASES.map((item) => (
                <li
                  key={item.number}
                  className="rounded-card border border-line bg-surface-muted px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">
                      {item.number}. {item.title}
                    </p>
                    <Badge tone={PHASE_TONE[item.status]}>{PHASE_LABEL[item.status]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{item.summary}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-ink-subtle sm:px-6">
          <p>{POWERED_BY}</p>
          <p>Demonstration environment — fictional data only.</p>
        </div>
      </footer>
    </div>
  );
}
