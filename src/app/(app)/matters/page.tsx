import Link from "next/link";

import { Badge, Callout, Card } from "@/components/ui";
import {
  MatterLink,
  StatusBadge,
  UnconfirmedDate,
  relativeDays,
} from "@/components/matter-ui";
import { requireMatterAccess } from "@/lib/auth/workspace";
import { requestNow } from "@/lib/clock";
import { can } from "@/lib/auth/permissions";
import { actorFor } from "@/lib/auth/session";
import { matterCountsByStatus, listMatters } from "@/lib/data/matters";
import { matterTypesForPracticeAreas } from "@/lib/data/catalogues";
import { firmConfiguration } from "@/lib/data/firms";
import { parseStringArray } from "@/lib/json-field";
import { statusLabel } from "@/components/matter-ui";

export const metadata = { title: "Matters" };
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string | undefined {
  const found = Array.isArray(value) ? value[0] : value;
  return found && found.length > 0 ? found : undefined;
}

export default async function MattersPage({ searchParams }: PageProps) {
  const { session, firm, scope } = await requireMatterAccess();
  const query = await searchParams;
  const now = requestNow();

  const filters = {
    status: one(query["status"]),
    matterTypeKey: one(query["type"]),
    representationSide: one(query["side"]),
    search: one(query["q"]),
  };

  const [matters, configuration, counts] = await Promise.all([
    listMatters(scope, filters),
    firmConfiguration(scope),
    matterCountsByStatus(scope),
  ]);

  const enabledTypes = parseStringArray(configuration?.matterTypes);
  const allTypes = await matterTypesForPracticeAreas(
    parseStringArray(configuration?.practiceAreas),
  );
  // Only the types this firm actually handles: offering a filter that can never
  // match anything is noise.
  const typeOptions = allTypes.filter((type) => enabledTypes.includes(type.key));

  const isEmployment = firm.primaryPracticeArea === "employment_law";
  const canCreate = can(actorFor(session.user, firm.id), "matter.create");
  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand">{firm.name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Matters</h1>
          <p className="mt-1 text-ink-muted">
            {matters.length} shown{activeFilters > 0 ? " (filtered)" : ""} · every matter here
            belongs to this firm.
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/matters/new"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
          >
            New matter
          </Link>
        ) : null}
      </header>

      <Card title="Filters" description="Applied on the server, within this firm.">
        <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label htmlFor="q" className="block text-sm font-medium text-ink">
              Search
            </label>
            <input
              id="q"
              name="q"
              defaultValue={filters.search ?? ""}
              placeholder="Reference, title or client"
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-ink">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={filters.status ?? ""}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Any status</option>
              {Object.keys(counts)
                .sort()
                .map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)} ({counts[status]})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-ink">
              Matter type
            </label>
            <select
              id="type"
              name="type"
              defaultValue={filters.matterTypeKey ?? ""}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Any type</option>
              {typeOptions.map((type) => (
                <option key={type.key} value={type.key}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {isEmployment ? (
            <div>
              <label htmlFor="side" className="block text-sm font-medium text-ink">
                Representing
              </label>
              <select
                id="side"
                name="side"
                defaultValue={filters.representationSide ?? ""}
                className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              >
                <option value="">Either side</option>
                <option value="employee">The employee</option>
                <option value="employer">The employer</option>
              </select>
            </div>
          ) : null}

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
            >
              Apply
            </button>
            {activeFilters > 0 ? (
              <Link
                href="/matters"
                className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </Card>

      <Card title="Matter list">
        {matters.length === 0 ? (
          <Callout tone="neutral" title="Nothing to show">
            {activeFilters > 0
              ? "No matter in this firm matches those filters."
              : "This firm has no matters yet."}
          </Callout>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted">
                  <th className="py-2 pr-4 font-medium">Matter</th>
                  <th className="py-2 pr-4 font-medium">Client</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Responsible</th>
                  <th className="py-2 pr-4 font-medium">Next date</th>
                  <th className="py-2 pr-4 font-medium">Last activity</th>
                  <th className="py-2 font-medium">AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {matters.map((matter) => (
                  <tr key={matter.id} className="align-top">
                    <td className="py-3 pr-4">
                      <MatterLink id={matter.id} reference={matter.reference} title={matter.title} />
                    </td>
                    <td className="py-3 pr-4 text-ink">
                      {matter.clientProfile?.displayName ?? "Unknown"}
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">{matter.matterType.label}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={matter.status} />
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">
                      {matter.responsibleAttorney?.name ?? "Unassigned"}
                    </td>
                    <td className="py-3 pr-4">
                      <UnconfirmedDate value={matter.nextDeadlineAt} now={now} />
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">
                      {relativeDays(matter.lastActivityAt, now)}
                    </td>
                    <td className="py-3">
                      {matter.aiStatus === "none" ? (
                        <span className="text-ink-subtle">—</span>
                      ) : (
                        <Badge tone="ai">{matter.aiStatus}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Callout tone="ai" title="The AI column is a state, not a verdict">
        A dash means no analysis has been run on that matter — not that none is needed. An
        analysis that has run still requires a person to read it before it is used.
      </Callout>
    </div>
  );
}
