import { Badge, Callout, Card, DataRow } from "@/components/ui";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { practiceAreaLabel } from "@/lib/practice-areas";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Firms" };
export const dynamic = "force-dynamic";

/**
 * Platform administration — firms.
 *
 * Shows the tenants and their headline counts, and nothing from inside them.
 * A platform administrator operates the platform; that does not include reading
 * a firm's client matters, so no matter title, client name or document appears
 * on this page.
 */
export default async function AdminFirmsPage() {
  await requirePlatformAdmin();

  const firms = await prisma.firm.findMany({
    orderBy: { name: "asc" },
    include: {
      configuration: { select: { onboardingStatus: true } },
      _count: { select: { memberships: true, matters: true, documents: true } },
    },
  });

  const [userCount, sessionCount] = await Promise.all([
    prisma.user.count(),
    prisma.session.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Platform administration
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Firms</h1>
        <p className="mt-1 text-ink-muted">
          Every firm on this instance. Matter content is deliberately not shown here.
        </p>
      </header>

      <Callout tone="neutral" title="Scope of this role">
        A platform administrator can see that a firm exists and how much it uses the platform, but
        holds no membership of any firm and therefore cannot open its matters or documents.
      </Callout>

      <Card title="Instance" description="Counts across every firm.">
        <dl>
          <DataRow label="Firms" value={firms.length} />
          <DataRow label="Users" value={userCount} />
          <DataRow label="Active sessions" value={sessionCount} />
        </dl>
      </Card>

      <Card
        title="Firm list"
        description="Creating a firm through the interface arrives in Phase 8."
      >
        {firms.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No firm has been created yet. Run <code className="font-mono">npm run seed</code>.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {firms.map((firm) => (
              <li key={firm.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{firm.name}</p>
                    <p className="text-sm text-ink-muted">
                      {practiceAreaLabel(firm.primaryPracticeArea)}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-ink-subtle">{firm.slug}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={firm.status === "active" ? "success" : "neutral"}>
                      {firm.status}
                    </Badge>
                    <Badge
                      tone={firm.configuration?.onboardingStatus === "complete" ? "success" : "warning"}
                    >
                      {firm.configuration
                        ? `onboarding: ${firm.configuration.onboardingStatus}`
                        : "not configured"}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm text-ink-subtle">
                  {firm._count.memberships} member(s) · {firm._count.matters} matter(s) ·{" "}
                  {firm._count.documents} document(s)
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
