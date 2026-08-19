import Link from "next/link";

/**
 * Orchelio — moving through a queue.
 *
 * A queue that renders every row was the product's largest reading cost
 * (ADR-0029): the approvals screen reached eleven thousand words and two
 * hundred buttons on a firm with real volume. This is half the answer — the
 * window — and `FoldedCard` is the other.
 *
 * Two properties it must have, and both are about honesty rather than looks:
 *
 *  * It states the window *and* the whole. "21 à 40 sur 132" says both what
 *    you are looking at and what you are looking through. A page that showed
 *    twenty rows and called it the queue would be making the same false claim
 *    `approvalCounts` exists to prevent.
 *  * It carries every other parameter forward. A reader who filtered to one
 *    status and pressed "next" must not silently lose the filter — the second
 *    page would then be of a different queue than the first.
 */

export type PagerProps = {
  /** The page being shown, one-based. */
  page: number;
  /** How many rows a page holds. */
  perPage: number;
  /** How many rows match, in total. */
  total: number;
  /** The current query string, whose other parameters are preserved. */
  params: Record<string, string | string[] | undefined>;
  /** Where the links point. */
  basePath: string;
  /** What is being counted, for the caption. Plural, lower case. */
  noun: string;
};

/** The current parameters with `page` replaced, so no filter is lost. */
function hrefFor(
  basePath: string,
  params: Record<string, string | string[] | undefined>,
  page: number,
): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue;
    const one = Array.isArray(value) ? value[0] : value;
    if (one) next.set(key, one);
  }
  if (page > 1) next.set("page", String(page));
  const query = next.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pager({ page, perPage, total, params, basePath, noun }: PagerProps) {
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const first = total === 0 ? 0 : (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  // One page of results needs no controls, but the count still belongs on the
  // screen: it is the difference between "three matters" and "three shown".
  const single = lastPage <= 1;

  return (
    <nav
      aria-label={`Pages de ${noun}`}
      className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"
    >
      <p className="text-sm text-ink-muted">
        {total === 0 ? `Aucun ${noun.replace(/s$/, "")}` : `${first} à ${last} sur ${total} ${noun}`}
      </p>

      {single ? null : (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link
              href={hrefFor(basePath, params, page - 1)}
              rel="prev"
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              Précédent
            </Link>
          ) : null}
          <span className="text-sm text-ink-subtle">
            Page {page} sur {lastPage}
          </span>
          {page < lastPage ? (
            <Link
              href={hrefFor(basePath, params, page + 1)}
              rel="next"
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              Suivant
            </Link>
          ) : null}
        </div>
      )}
    </nav>
  );
}

/** The page a query string asks for. Anything unreadable is page one. */
export function pageFrom(value: string | string[] | undefined): number {
  const one = Array.isArray(value) ? value[0] : value;
  const parsed = Number(one);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.trunc(parsed) : 1;
}
