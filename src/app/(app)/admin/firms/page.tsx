import Link from "next/link";

import { Badge, Callout, Card, DataRow } from "@/components/ui";
import { Field, inputClass } from "@/components/onboarding-ui";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { practiceAreaLabel } from "@/lib/practice-areas";
import { listFirmsForAdministration, platformCounts } from "@/lib/data/platform";
import { creatablePracticeAreas } from "@/lib/platform/new-firm";
import { DEMO_PASSWORD } from "@/lib/demo-accounts";
import { IS_DEMO } from "@/lib/app-config";

export const metadata = { title: "Firms" };
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(query: Record<string, string | string[] | undefined>, key: string): string | null {
  const value = query[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === "string" ? value : null;
}

/**
 * Platform administration — firms.
 *
 * Shows the tenants and their headline counts, and nothing from inside them. A
 * platform administrator operates the platform; that does not include reading a
 * firm's client matters, so no matter title, client name or document appears on
 * this page — and the query behind it does not ask for one.
 *
 * The creation form is the phase's acceptance criterion: a third firm, created
 * entirely through the interface, with no code change.
 */
export default async function AdminFirmsPage({ searchParams }: PageProps) {
  await requirePlatformAdmin();

  const query = await searchParams;
  const error = one(query, "error");
  const created = one(query, "created");
  const createdEmail = one(query, "email");
  const newAccount = one(query, "newAccount") === "1";

  const [firms, counts] = await Promise.all([listFirmsForAdministration(), platformCounts()]);

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

      {error ? (
        <Callout tone="danger" title="The firm was not created" assertive>
          {error}
        </Callout>
      ) : null}

      {created ? (
        <Callout tone="success" title="Firm created">
          <p>
            <span className="font-mono">{created}</span> exists and is waiting to be configured. Its
            first administrator is <span className="font-mono">{createdEmail}</span>.
          </p>
          {newAccount && IS_DEMO ? (
            <p className="mt-2">
              That account was created just now. Sign in with the shared demonstration password,{" "}
              <span className="font-mono">{DEMO_PASSWORD}</span> — the same one printed on the
              sign-in page — then answer the seven setup questions.
            </p>
          ) : null}
          {!newAccount ? (
            <p className="mt-2">
              That account already existed, so it keeps its own password. It is now an
              administrator of this firm as well.
            </p>
          ) : null}
          <p className="mt-2 text-ink-subtle">
            The firm is not a usable workspace until the questionnaire is answered. You cannot do
            that from here: a platform administrator holds no membership of any firm.
          </p>
        </Callout>
      ) : null}

      <Callout tone="neutral" title="Scope of this role">
        A platform administrator can see that a firm exists and how much it uses the platform, but
        holds no membership of any firm and therefore cannot open its matters or documents.
      </Callout>

      <Card title="Instance" description="Summed from each firm's own counts.">
        <dl>
          <DataRow label="Firms" value={counts.firms} />
          <DataRow label="Users" value={counts.users} />
          <DataRow label="Active sessions" value={counts.activeSessions} />
          <DataRow label="Matters" value={counts.matters} />
          <DataRow label="Documents" value={counts.documents} />
          <DataRow label="Analyses" value={counts.analyses} />
        </dl>
      </Card>

      <Card
        title="Create a firm"
        description="Everything a firm needs to exist. What it needs to be useful, its own administrator answers next."
      >
        <form method="post" action="/api/admin/firms" className="space-y-4">
          <Field
            label="Firm name"
            htmlFor="name"
            hint="Fictional. The identifier is derived from it, and made unique if it is taken."
          >
            <input id="name" name="name" required minLength={2} className={inputClass} />
          </Field>

          <Field
            label="Main practice area"
            htmlFor="primaryPracticeArea"
            hint="Only areas with a full template can be chosen — a firm created into an empty one could not finish its questionnaire."
          >
            <select id="primaryPracticeArea" name="primaryPracticeArea" required className={inputClass}>
              <option value="">Choose…</option>
              {creatablePracticeAreas().map((area) => (
                <option key={area.key} value={area.key}>
                  {area.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First administrator" htmlFor="administratorName">
              <input
                id="administratorName"
                name="administratorName"
                required
                className={inputClass}
              />
            </Field>
            <Field
              label="Their email"
              htmlFor="administratorEmail"
              hint="Use a fictional address ending in .local. Orchelio sends nothing to it — it has no way to."
            >
              <input
                id="administratorEmail"
                name="administratorEmail"
                type="email"
                required
                placeholder="admin@newfirm.local"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex items-center gap-3 border-t border-line pt-4">
            <button
              type="submit"
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-strong"
            >
              Create firm
            </button>
            <p className="text-sm text-ink-subtle">
              Creates the firm, its configuration — carrying all nine locked approval rules — and
              its first administrator.
            </p>
          </div>
        </form>
      </Card>

      <Card title="Firm list" description="Counts only. No matter, client or document is named.">
        {firms.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No firm has been created yet. Run <code className="font-mono">npm run seed</code>, or
            create one above.
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
                      tone={
                        firm.configuration?.onboardingStatus === "complete" ? "success" : "warning"
                      }
                    >
                      {firm.configuration
                        ? `onboarding: ${firm.configuration.onboardingStatus}`
                        : "not configured"}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm text-ink-subtle">
                  {firm._count.memberships} member(s) · {firm._count.matters} matter(s) ·{" "}
                  {firm._count.documents} document(s) · {firm._count.analyses} analysis(es)
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-sm text-ink-muted">
        <Link href="/admin/system" className="font-medium text-brand underline underline-offset-4">
          System overview
        </Link>{" "}
        ·{" "}
        <Link href="/admin/demo" className="font-medium text-brand underline underline-offset-4">
          Demonstration data
        </Link>
      </p>
    </div>
  );
}
