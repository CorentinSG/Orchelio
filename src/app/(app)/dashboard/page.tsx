import { redirect } from "next/navigation";

import { Badge, Callout, Card, DataRow } from "@/components/ui";
import { recordViewEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { requireFirmAccess } from "@/lib/auth/guards";
import { activeFirmFor, scopeFor } from "@/lib/auth/firm-context";
import { actorFor, currentSession } from "@/lib/auth/session";
import { permissionsFor, roleLabel } from "@/lib/auth/permissions";
import { listActivity } from "@/lib/data/activity";
import { firmConfiguration } from "@/lib/data/firms";
import { firmStatistics } from "@/lib/data/statistics";
import { formatCost } from "@/lib/data/usage";
import { parseStringArray } from "@/lib/json-field";
import { practiceAreaLabel } from "@/lib/practice-areas";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

/**
 * Firm dashboard.
 *
 * Every figure below is read through `src/lib/data`, whose functions all take
 * the firm as a required argument. Nothing on this page can accidentally count
 * another firm's records.
 *
 * The practice-area widgets (consultations to prepare, missing documents,
 * status dates to review) are generated from the onboarding configuration in
 * Phase 4 and filled by the matters in Phase 5.
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

  const [configuration, statistics, recentActivity] = await Promise.all([
    firmConfiguration(scope),
    firmStatistics(scope),
    listActivity(scope, {}, 5),
  ]);

  const actor = actorFor(session.user, firm.id);
  const permissions = permissionsFor(actor).sort();
  const matterTypes = parseStringArray(configuration?.matterTypes);

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

      <Callout tone="brand" title="Phase 3 of 9">
        Firm isolation is enforced and tested: every figure below is counted within this firm
        alone. The practice-area dashboard widgets are generated from the onboarding
        questionnaire, which arrives in Phase 4; matters and documents arrive in Phase 5.
      </Callout>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Matters" value={statistics.matters} hint="Phase 5" />
        <StatTile label="Documents" value={statistics.documents} hint="Phase 5" />
        <StatTile label="Claude analyses" value={statistics.analyses} hint="Phase 6" />
        <StatTile
          label="Simulated AI usage"
          value={formatCost(statistics.usageCostCents)}
          hint="no charge"
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
            <DataRow label="Clients" value={statistics.clients} hint="Phase 5" />
            <DataRow label="Pending approvals" value={statistics.pendingApprovals} hint="Phase 7" />
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
