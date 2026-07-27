import { redirect } from "next/navigation";

import { Badge, Callout, Card, DataRow } from "@/components/ui";
import { recordViewEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { defaultFirmFor, requireFirmAccess } from "@/lib/auth/guards";
import { actorFor, currentSession } from "@/lib/auth/session";
import { permissionsFor, roleLabel } from "@/lib/auth/permissions";
import { parseStringArray } from "@/lib/json-field";
import { practiceAreaLabel } from "@/lib/practice-areas";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

/**
 * Firm dashboard.
 *
 * Phase 2 shows what actually exists: which firm is open, what this user's role
 * lets them do, and the firm's own recent activity. The practice-area widgets
 * (active matters, consultations to prepare, missing documents, simulated AI
 * spend) arrive with the onboarding configuration in Phase 4 and the matters in
 * Phase 5.
 */
export default async function DashboardPage() {
  const session = await currentSession();
  if (!session) {
    redirect("/login?next=%2Fdashboard");
  }

  const defaultFirm = defaultFirmFor(session);

  // A platform administrator holds no firm membership by design: operating the
  // platform does not grant access to any firm's matters.
  if (!defaultFirm) {
    if (session.user.isPlatformAdmin) {
      redirect("/admin/firms");
    }
    redirect("/403");
  }

  const { firm } = await requireFirmAccess(defaultFirm.id);

  await recordViewEvent({
    action: AUDIT_ACTIONS.firmViewed,
    firmId: firm.id,
    userId: session.user.id,
    resourceType: "firm",
    resourceId: firm.id,
  });

  const [configuration, recentEvents, matterCount, documentCount] = await Promise.all([
    prisma.firmConfiguration.findUnique({ where: { firmId: firm.id } }),
    // Scoped by firmId — this is the rule the whole product depends on.
    prisma.auditEvent.findMany({
      where: { firmId: firm.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.matter.count({ where: { firmId: firm.id } }),
    prisma.document.count({ where: { firmId: firm.id } }),
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

      <Callout tone="brand" title="Phase 2 of 9">
        Sign-in, roles and server-side access control are live. The practice-area dashboard
        widgets are generated from the onboarding questionnaire, which arrives in Phase 4; matters
        and documents arrive in Phase 5.
      </Callout>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Firm workspace" description="Read from the database for this firm only.">
          <dl>
            <DataRow label="Firm" value={firm.name} />
            <DataRow label="Primary practice area" value={practiceAreaLabel(firm.primaryPracticeArea)} />
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
            <DataRow label="Matters" value={matterCount} hint="Phase 5" />
            <DataRow label="Documents" value={documentCount} hint="Phase 5" />
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
        {recentEvents.length === 0 ? (
          <p className="text-sm text-ink-muted">No activity recorded yet for this firm.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recentEvents.map((event) => (
              <li key={event.id} className="flex flex-wrap items-baseline justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-ink">{event.action}</p>
                  <p className="text-xs text-ink-muted">{event.user?.name ?? "System"}</p>
                </div>
                <time
                  dateTime={event.createdAt.toISOString()}
                  className="text-xs text-ink-subtle"
                >
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
