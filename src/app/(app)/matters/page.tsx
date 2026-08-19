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
import {
  MATTERS_PER_PAGE,
  countMattersMatching,
  isMatterSort,
  listMatters,
  matterCountsByStatus,
  type MatterSort,
} from "@/lib/data/matters";
import { Pager, pageFrom } from "@/components/pager";
import { matterTypesForPracticeAreas } from "@/lib/data/catalogues";
import { firmConfiguration } from "@/lib/data/firms";
import { firmTimezone } from "@/lib/format/dates";
import { parseStringArray } from "@/lib/json-field";
import { statusLabel } from "@/components/matter-ui";

export const metadata = { title: "Dossiers" };
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

  const page = pageFrom(query["page"]);
  const requested = one(query["sort"]) ?? "";
  const sort: MatterSort = isMatterSort(requested) ? requested : "activity";

  const [matters, total, configuration, counts] = await Promise.all([
    listMatters(scope, filters, { page, sort }),
    // What matches, not what fits on the page. The header used to report the
    // rendered row count as the size of the list, which was the whole list
    // only because the list had no bound.
    countMattersMatching(scope, filters),
    firmConfiguration(scope),
    matterCountsByStatus(scope),
  ]);

  const timezone = firmTimezone(configuration?.timezone);
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
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Dossiers</h1>
          <p className="mt-1 text-ink-muted">
            {total} dossier{total === 1 ? "" : "s"}
            {activeFilters > 0 ? " correspondant aux filtres" : ""} · chacun appartient à ce cabinet.
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/matters/new"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
          >
            Nouveau dossier
          </Link>
        ) : null}
      </header>

      <Card title="Filtres" description="Appliqués sur le serveur, dans le périmètre de ce cabinet.">
        <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label htmlFor="q" className="block text-sm font-medium text-ink">
              Rechercher
            </label>
            <input
              id="q"
              name="q"
              defaultValue={filters.search ?? ""}
              placeholder="Référence, intitulé ou client"
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-ink">
              Statut
            </label>
            <select
              id="status"
              name="status"
              defaultValue={filters.status ?? ""}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Tous les statuts</option>
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
              Type de dossier
            </label>
            <select
              id="type"
              name="type"
              defaultValue={filters.matterTypeKey ?? ""}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Tous les types</option>
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
                Partie représentée
              </label>
              <select
                id="side"
                name="side"
                defaultValue={filters.representationSide ?? ""}
                className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              >
                <option value="">Les deux</option>
                <option value="employee">Le salarié</option>
                <option value="employer">L’employeur</option>
              </select>
            </div>
          ) : null}

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
            >
              Appliquer
            </button>
            {activeFilters > 0 ? (
              <Link
                href="/matters"
                className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
              >
                Effacer
              </Link>
            ) : null}
          </div>
        </form>
      </Card>

      <Card title="Liste des dossiers">
        {matters.length === 0 ? (
          <Callout tone="neutral" title="Rien à afficher">
            {total > 0
              ? "Cette page ne contient rien. Revenez à la première page de la liste."
              : activeFilters > 0
                ? "Aucun dossier de ce cabinet ne correspond à ces filtres."
                : "Ce cabinet n’a pas encore de dossier."}
          </Callout>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted">
                  <SortableHeader label="Dossier" sort="reference" active={sort} query={query} />
                  <SortableHeader label="Client" sort="client" active={sort} query={query} />
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <SortableHeader label="Statut" sort="status" active={sort} query={query} />
                  <th className="py-2 pr-4 font-medium">Responsable</th>
                  <SortableHeader
                    label="Prochaine date"
                    sort="deadline"
                    active={sort}
                    query={query}
                  />
                  <SortableHeader
                    label="Dernière activité"
                    sort="activity"
                    active={sort}
                    query={query}
                  />
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
                      {matter.clientProfile?.displayName ?? "Inconnu"}
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">{matter.matterType.label}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={matter.status} />
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">
                      {matter.responsibleAttorney?.name ?? "Non attribué"}
                    </td>
                    <td className="py-3 pr-4">
                      <UnconfirmedDate value={matter.nextDeadlineAt} now={now} timezone={timezone} />
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">
                      {relativeDays(matter.lastActivityAt, now, timezone)}
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
        <Pager
          page={page}
          perPage={MATTERS_PER_PAGE}
          total={total}
          params={query}
          basePath="/matters"
          noun="dossiers"
        />
      </Card>

      <Callout tone="ai" title="La colonne IA est un état, pas un verdict">
        Un tiret signifie qu’aucune analyse n’a été lancée sur ce dossier — pas qu’aucune ne
        soit utile. Une analyse effectuée doit toujours être lue par une personne avant d’être
        utilisée.
      </Callout>
    </div>
  );
}

/**
 * A column header that sorts, and says which way it is sorting.
 *
 * A link rather than a button: sorting is a different view of the same list,
 * so it belongs in the address bar where it can be shared, bookmarked and
 * gone back from. Pressing it returns to page one — staying on page seven of
 * a list that has just been reordered would show a reader rows they have no
 * way to place.
 */
function SortableHeader({
  label,
  sort,
  active,
  query,
}: {
  label: string;
  sort: MatterSort;
  active: MatterSort;
  query: Record<string, string | string[] | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "sort" || key === "page") continue;
    const only = Array.isArray(value) ? value[0] : value;
    if (only) params.set(key, only);
  }
  params.set("sort", sort);

  const current = active === sort;
  return (
    <th scope="col" className="py-2 pr-4 font-medium" aria-sort={current ? "ascending" : "none"}>
      <Link
        href={`/matters?${params.toString()}`}
        className={`inline-flex items-center gap-1 hover:text-ink ${current ? "text-ink" : ""}`}
      >
        {label}
        <span aria-hidden className={current ? "text-brand" : "text-ink-subtle/40"}>
          ↓
        </span>
      </Link>
    </th>
  );
}
