import Link from "next/link";

import { Badge, Callout, Card } from "@/components/ui";
import { fileSize, formatDate } from "@/components/matter-ui";
import { requireMatterAccess } from "@/lib/auth/workspace";
import { listDocuments } from "@/lib/data/documents";
import { listMatters } from "@/lib/data/matters";
import { firmTimezoneFor } from "@/lib/data/firms";
import { categoriesFor, categoryLabel } from "@/lib/matters/documents";

export const metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string | undefined {
  const found = Array.isArray(value) ? value[0] : value;
  return found && found.length > 0 ? found : undefined;
}

/**
 * Every document in the firm, in one place.
 *
 * Documents are added on a matter, not here — a document that belongs to no
 * matter is a document nobody can act on. This screen is for finding one when
 * you remember the file but not the file it is in.
 */
export default async function DocumentsPage({ searchParams }: PageProps) {
  const { firm, scope } = await requireMatterAccess();
  const query = await searchParams;
  const category = one(query["category"]);

  const [documents, matters, timezone] = await Promise.all([
    listDocuments(scope, category ? { category } : {}),
    listMatters(scope),
    firmTimezoneFor(scope),
  ]);

  const matterById = new Map(matters.map((matter) => [matter.id, matter]));
  const categories = categoriesFor(firm.primaryPracticeArea);
  const unverified = documents.filter((document) => !document.verified).length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">{firm.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Documents</h1>
        <p className="mt-1 text-ink-muted">
          {documents.length} document(s) sur les dossiers de ce cabinet.
          {unverified > 0 ? ` ${unverified} pas encore vérifié(s) par une personne.` : ""}
        </p>
      </header>

      <Card title="Filtrer par type">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="min-w-56">
            <label htmlFor="category" className="block text-sm font-medium text-ink">
              Type de document
            </label>
            <select
              id="category"
              name="category"
              defaultValue={category ?? ""}
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="">Tous les types</option>
              {categories.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong"
          >
            Appliquer
          </button>
          {category ? (
            <Link
              href="/documents"
              className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              Effacer
            </Link>
          ) : null}
        </form>
      </Card>

      <Card title="Tous les documents">
        {documents.length === 0 ? (
          <Callout tone="neutral" title="Rien à afficher">
            {category
              ? "Aucun document de ce type n’est au dossier pour ce cabinet."
              : "Ce cabinet n’a pas encore de document. Ajoutez-en un depuis un dossier."}
          </Callout>
        ) : (
          <ul className="divide-y divide-line">
            {documents.map((document) => {
              const matter = matterById.get(document.matterId);
              return (
                <li key={document.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{document.filename}</p>
                    <p className="text-sm text-ink-muted">
                      {categoryLabel(firm.primaryPracticeArea, document.category)} ·{" "}
                      {fileSize(document.sizeBytes)} · ajouté le {formatDate(document.receivedAt, timezone)}
                    </p>
                    {matter ? (
                      <Link
                        href={`/matters/${matter.id}?tab=documents`}
                        className="text-sm text-brand hover:underline"
                      >
                        {matter.reference} — {matter.title}
                      </Link>
                    ) : null}
                  </div>
                  {document.verified ? (
                    <Badge tone="success">Vérifié par une personne</Badge>
                  ) : (
                    <Badge tone="warning">Non vérifié</Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-sm text-ink-subtle">
          Les dépôts sont simulés : nom, type et taille uniquement. Aucun contenu n’est stocké,
          rien n’est lu — il n’y a pas d’OCR dans cette version.
        </p>
      </Card>
    </div>
  );
}
