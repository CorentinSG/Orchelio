import Link from "next/link";

import { Badge, Callout, Card, CommandLine, DataRow } from "@/components/ui";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { listFirmsForAdministration } from "@/lib/data/platform";
import { practiceAreaLabel } from "@/lib/practice-areas";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";
import { GUIDE_STEP_COUNT } from "@/lib/guide";
import { FICTIONAL_DATA_NOTICE } from "@/lib/app-config";

export const metadata = { title: "Demonstration data" };
export const dynamic = "force-dynamic";

/**
 * Platform administration — demonstration data.
 *
 * Read-only, and deliberately so. Everything an operator might want to *do*
 * here is either additive and belongs to the firm that owns the data — adding
 * sample matters lives in that firm's own settings — or destructive, and lives
 * in a command a person types on purpose rather than a button they can press by
 * accident. See ADR-0016.
 *
 * The per-firm figures are the firms' own counts. Nothing on this page names a
 * matter, a client or a document.
 */
export default async function AdminDemoPage() {
  await requirePlatformAdmin();

  const firms = await listFirmsForAdministration();
  const totalMatters = firms.reduce((sum, firm) => sum + firm._count.matters, 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Platform administration
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Demonstration data</h1>
        <p className="mt-1 text-ink-muted">{FICTIONAL_DATA_NOTICE}</p>
      </header>

      <Card title="What each firm holds" description="Counts only.">
        {firms.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No firm exists yet. Run <code className="font-mono">npm run seed</code>.
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
                  </div>
                  <Badge tone={firm._count.matters > 0 ? "success" : "warning"}>
                    {firm._count.matters > 0 ? "has demonstration data" : "empty"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-ink-subtle">
                  {firm._count.matters} matter(s) · {firm._count.documents} document(s) ·{" "}
                  {firm._count.analyses} analysis(es) · {firm._count.approvalRequests} approval(s)
                </p>
                {firm._count.matters === 0 ? (
                  <p className="mt-1 text-sm text-ink-muted">
                    Its own administrator can add sample matters from that firm&apos;s settings. You
                    cannot do it from here — a platform administrator holds no membership of any
                    firm.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Demonstration accounts" description="Every one of them fictional.">
        <p className="mb-3 text-sm text-ink-muted">
          All accounts seeded with the demonstration share the password{" "}
          <span className="font-mono">{DEMO_PASSWORD}</span>. It is printed on the sign-in page as
          well: it is written in a public repository, so hiding it would be theatre rather than
          security.
        </p>
        <dl>
          {DEMO_ACCOUNTS.map((account) => (
            <DataRow
              key={account.email}
              label={<span className="font-mono text-xs">{account.email}</span>}
              value={account.roleLabel}
              hint={account.firmName ?? "no firm"}
            />
          ))}
        </dl>
        <p className="mt-3 text-sm text-ink-subtle">
          An account created through the firm-creation form does not appear here — this list is the
          seed&apos;s, and it does not pretend to be a directory.
        </p>
      </Card>

      <Card title="Erasing demonstration data has no button">
        <p className="text-sm text-ink-muted">
          Deleting everything is irreversible, and one of the nine locked approval rules says
          nothing is ever permanently deleted without a person. A button in a web page is a weaker
          form of consent than a command somebody types deliberately, so the reset lives here:
        </p>
        <div className="mt-3">
          <CommandLine>npm run reset-demo</CommandLine>
        </div>
        <p className="mt-2 text-sm text-ink-subtle">
          It erases every firm on this instance — all {totalMatters} matter(s) above included — and
          re-seeds the demonstration from scratch. It is not scoped to one firm and it cannot be
          undone.
        </p>
      </Card>

      <Callout tone="brand" title={`The guided demonstration is ${GUIDE_STEP_COUNT} steps`}>
        <p>
          It walks through the whole product in order, naming the account to use and what to look
          for on each screen.
        </p>
        <p className="mt-2">
          <Link href="/guide" className="font-medium text-brand underline underline-offset-4">
            Open the guided demonstration
          </Link>
        </p>
      </Callout>

      <p className="text-sm text-ink-muted">
        <Link href="/admin/firms" className="font-medium text-brand underline underline-offset-4">
          Firms
        </Link>{" "}
        ·{" "}
        <Link href="/admin/system" className="font-medium text-brand underline underline-offset-4">
          System overview
        </Link>
      </p>
    </div>
  );
}
