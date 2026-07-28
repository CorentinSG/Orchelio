import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge, Callout, Card, DataRow } from "@/components/ui";
import { widgetValue, widgetsFor } from "@/lib/dashboard/widgets";
import { recordViewEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { requireFirmAccess } from "@/lib/auth/guards";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { actorFor, currentSession } from "@/lib/auth/session";
import { permissionsFor, roleLabel } from "@/lib/auth/permissions";
import { listActivity } from "@/lib/data/activity";
import { firmConfiguration } from "@/lib/data/firms";
import { firmStatistics, practiceAreaCounts } from "@/lib/data/statistics";
import { formatCost } from "@/lib/data/usage";
import { requestNow } from "@/lib/clock";
import { parseStringArray } from "@/lib/json-field";
import { practiceAreaLabel } from "@/lib/practice-areas";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

/** Widgets whose data arrives later show a dash rather than a misleading zero. */
const CURRENT_PHASE = 6;

/**
 * Firm dashboard.
 *
 * Every figure below is read through `src/lib/data`, whose functions all take
 * the firm as a required argument. Nothing on this page can accidentally count
 * another firm's records.
 *
 * The practice-area widgets (consultations to prepare, missing documents,
 * status dates to review) are generated from the onboarding configuration in
 * Phase 4 and filled by the matters in Phase 5. Their counts live in
 * `practiceAreaCounts`; a widget whose key that function does not return shows
 * a dash rather than a zero.
 */
export default async function DashboardPage() {
  const session = await currentSession();
  if (!session) {
    redirect("/login?next=%2Fdashboard");
  }

  const active = await activeFirmFor(session);

  // A platform administrator holds no firm membership by design: operating the
  // platform does not grant access to any firm's matters.
  if (!active) {
    if (session.user.isPlatformAdmin) {
      redirect("/admin/firms");
    }
    redirect("/403");
  }

  // Re-checked here rather than trusted from the layout: a page is responsible
  // for its own access, not for assuming a parent did the work.
  const { firm } = await requireFirmAccess(active.id);
  const scope = scopeFor(firm);

  await recordViewEvent({
    action: AUDIT_ACTIONS.firmViewed,
    firmId: firm.id,
    userId: session.user.id,
    resourceType: "firm",
    resourceId: firm.id,
  });

  const [configuration, statistics, areaCounts, recentActivity] = await Promise.all([
    firmConfiguration(scope),
    firmStatistics(scope),
    practiceAreaCounts(scope, firm.primaryPracticeArea, requestNow()),
    listActivity(scope, {}, 5),
  ]);

  const actor = actorFor(session.user, firm.id);
  const permissions = permissionsFor(actor).sort();
  const matterTypes = parseStringArray(configuration?.matterTypes);
  const aiFeatures = parseStringArray(configuration?.aiFeatures);
  const needsOnboarding = configuration?.onboardingStatus !== "complete";
  const widgets = widgetsFor(firm.primaryPracticeArea, aiFeatures);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          {practiceAreaLabel(firm.primaryPracticeArea)}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{firm.name}</h1>
        <p className="mt-1 text-ink-muted">
          Signed in as {session.user.name} — {roleLabel(firm.role, session.user.isPlatformAdmin)}
        </p>
      </header>

      {needsOnboarding ? (
        <Callout tone="warning" title="This firm is not configured yet">
          <p>
            The dashboard below is generic until the onboarding questionnaire has been answered.
          </p>
          <p className="mt-2">
            <Link href="/onboarding" className="font-medium text-brand underline underline-offset-4">
              Set up this firm
            </Link>
          </p>
        </Callout>
      ) : (
        <Callout tone="brand" title="Phase 6 of 9">
          This dashboard is assembled from this firm&apos;s configuration — the cards below are
          the ones an {practiceAreaLabel(firm.primaryPracticeArea).toLowerCase()} firm asks about
          each morning. Matters, documents and the simulated analyses are live; the approvals
          (Phase 7) still show a dash, because a zero would claim there is nothing to do.
        </Callout>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {widgets.map((widget) => (
          <StatTile
            key={widget.key}
            label={widget.label}
            value={widgetValue(widget, statistics, CURRENT_PHASE, areaCounts)}
            hint={
              widget.availableFrom > CURRENT_PHASE
                ? `Phase ${widget.availableFrom}`
                : widget.hint
            }
          />
        ))}
        <StatTile
          label="Simulated AI cost"
          value={formatCost(statistics.usageCostCents)}
          hint="this firm only — no charge"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Firm workspace" description="Read from the database for this firm only.">
          <dl>
            <DataRow label="Firm" value={firm.name} />
            <DataRow
              label="Primary practice area"
              value={practiceAreaLabel(firm.primaryPracticeArea)}
            />
            <DataRow label="Tenant status" value={firm.status} />
            <DataRow
              label="Configuration"
              value={
                configuration
                  ? configuration.onboardingStatus === "complete"
                    ? "Complete"
                    : `Draft — step ${configuration.onboardingStep} of 7`
                  : "Not started"
              }
            />
            <DataRow
              label="Matter types enabled"
              value={matterTypes.length > 0 ? matterTypes.length : "—"}
            />
            <DataRow label="Clients" value={statistics.clients} />
            <DataRow label="Documents" value={statistics.documents} />
            <DataRow label="Open tasks" value={statistics.openTasks} />
          </dl>
        </Card>

        <Card
          title="Your permissions"
          description={`What the ${roleLabel(firm.role, false)} role allows, checked on the server.`}
        >
          {permissions.length === 0 ? (
            <p className="text-sm text-ink-muted">This role grants no permissions.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {permissions.map((permission) => (
                <li key={permission}>
                  <Badge tone="neutral">{permission}</Badge>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm text-ink-subtle">
            Permissions are enforced in the server action or page that performs the work, not in
            the browser. Hiding a button is not access control.
          </p>
        </Card>
      </div>

      <Card
        title="Recent activity"
        description="This firm's own activity log. Other firms' events are never returned here."
      >
        {recentActivity.length === 0 ? (
          <p className="text-sm text-ink-muted">No activity recorded yet for this firm.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recentActivity.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-baseline justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm text-ink">{event.action}</p>
                  <p className="text-xs text-ink-muted">{event.user?.name ?? "System"}</p>
                </div>
                <time dateTime={event.createdAt.toISOString()} className="text-xs text-ink-subtle">
                  {event.createdAt.toISOString().replace("T", " ").slice(0, 19)} UTC
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3">
      <p className="text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="text-sm text-ink-muted">{label}</p>
      {hint ? <p className="text-xs text-ink-subtle">{hint}</p> : null}
    </div>
  );
}
