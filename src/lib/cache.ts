import "server-only";

import { cache } from "react";

/**
 * Orchelio — caching, and the one rule that governs it.
 *
 * ## The rule
 *
 * **Firm-scoped data is never cached across requests. Ever.**
 *
 * A cache is a place where one request's answer is handed to another. In a
 * multi-tenant product that is the same shape as the bug the whole architecture
 * exists to prevent — except a cache leak is worse than a missing `where`
 * clause, because no query is involved and the firm scoping guard never sees
 * it. A stale dashboard is an annoyance; another firm's dashboard is a breach.
 *
 * So Orchelio uses exactly two kinds of cache, and they are different in kind,
 * not merely in duration:
 *
 * 1. **Request-scoped memoisation** (`requestScoped` below). React's `cache()`
 *    lives and dies with a single server request. Two calls inside one page
 *    render share an answer; two different requests never do — not even from
 *    the same user, let alone different firms. This is safe for *anything*,
 *    including firm data, because it cannot outlive the request that produced
 *    it.
 *
 * 2. **Platform catalogue caching** (`platformCatalogue` below). Practice
 *    areas, matter types and workflow templates are the same for every firm on
 *    the instance — they are reference data, not anybody's records. These may
 *    be held across requests, and `tests/unit/cache.test.ts` asserts that only
 *    models classified as platform-wide in `src/lib/data/firm-scope.ts` are
 *    ever registered here.
 *
 * There is deliberately no third kind. If a future screen is slow because it
 * re-reads a firm's matters, the answer is a better query or an index — not a
 * cache.
 */

/**
 * Memoises a function for the lifetime of one server request.
 *
 * The gain is not theoretical. Rendering the dashboard called `currentSession()`
 * from the layout, from the page and from the access guard; each call meant a
 * session lookup plus its user, memberships and firms. Memoising collapsed
 * that to one. See docs/HARNESS.md for the measurement.
 */
export const requestScoped = cache;

// ---------------------------------------------------------------------------
// Platform catalogue cache
// ---------------------------------------------------------------------------

/**
 * How long a catalogue entry is trusted.
 *
 * Short on purpose. These change when a practice area is added — a deployment
 * event, not a user action — so a minute of staleness costs nothing and the
 * cache still absorbs the repeated reads within a browsing session.
 */
const CATALOGUE_TTL_MS = 60_000;

type CatalogueEntry<T> = { value: T; expiresAt: number };

const catalogueCache = new Map<string, CatalogueEntry<unknown>>();

/** Models whose rows belong to no firm, and may therefore be cached. */
const CACHEABLE_MODELS = new Set(["PracticeArea", "MatterType", "WorkflowTemplate"]);

export class UncacheableModelError extends Error {
  constructor(model: string) {
    super(
      `Refused to cache ${model}: only platform-wide catalogues may be cached across ` +
        "requests. Firm-scoped data must be read fresh — see src/lib/cache.ts.",
    );
    this.name = "UncacheableModelError";
  }
}

/**
 * Caches a platform-wide catalogue read across requests.
 *
 * `model` is not decoration: it is checked against the list of models that
 * belong to no firm, so registering a firm-scoped read here fails loudly at the
 * first call rather than leaking quietly for months.
 */
export function platformCatalogue<T>(
  model: string,
  key: string,
  load: () => Promise<T>,
): () => Promise<T> {
  if (!CACHEABLE_MODELS.has(model)) {
    throw new UncacheableModelError(model);
  }

  const cacheKey = `${model}:${key}`;

  return async () => {
    const now = Date.now();
    const entry = catalogueCache.get(cacheKey);

    if (entry && entry.expiresAt > now) {
      return entry.value as T;
    }

    const value = await load();
    catalogueCache.set(cacheKey, { value, expiresAt: now + CATALOGUE_TTL_MS });
    return value;
  };
}

/**
 * Drops every cached catalogue.
 *
 * Called by the seed and by the demonstration reset, so a freshly reseeded
 * instance never serves a catalogue from before it.
 */
export function clearCatalogueCache(): void {
  catalogueCache.clear();
}

/** Test and diagnostic helper. */
export function catalogueCacheSize(): number {
  return catalogueCache.size;
}

export const CACHEABLE_MODEL_NAMES: readonly string[] = [...CACHEABLE_MODELS];
