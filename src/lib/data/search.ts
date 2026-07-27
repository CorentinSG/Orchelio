import "server-only";

import { prisma } from "@/lib/prisma";
import type { FirmScope } from "@/lib/data/scope";

/**
 * Orchelio — search.
 *
 * Search is the easiest place in any multi-tenant product to leak data: it
 * touches several tables at once, and a single query written without the firm
 * would surface another firm's client names in a dropdown.
 *
 * Every branch below filters on `firmId`, and the scoping guard in
 * `src/lib/data/firm-scope.ts` refuses the query outright if one is ever
 * forgotten.
 */

export type SearchResult = {
  kind: "matter" | "client" | "document";
  id: string;
  title: string;
  subtitle: string;
  /** The firm this result belongs to. Asserted in tests; never rendered. */
  firmId: string;
};

export async function searchFirm(
  scope: FirmScope,
  rawQuery: string,
  take = 20,
): Promise<SearchResult[]> {
  const query = rawQuery.trim();
  if (query.length < 2) {
    // Refuse to run a wildcard search: a one-character query would return
    // most of the firm and tells the user nothing.
    return [];
  }

  const [matters, clients, documents] = await Promise.all([
    prisma.matter.findMany({
      where: {
        firmId: scope.firmId,
        OR: [{ reference: { contains: query } }, { title: { contains: query } }],
      },
      take,
      select: { id: true, reference: true, title: true, firmId: true },
    }),
    prisma.clientProfile.findMany({
      where: { firmId: scope.firmId, displayName: { contains: query } },
      take,
      select: { id: true, displayName: true, firmId: true },
    }),
    prisma.document.findMany({
      where: { firmId: scope.firmId, filename: { contains: query } },
      take,
      select: { id: true, filename: true, category: true, firmId: true },
    }),
  ]);

  return [
    ...matters.map((matter): SearchResult => ({
      kind: "matter",
      id: matter.id,
      title: matter.title,
      subtitle: matter.reference,
      firmId: matter.firmId,
    })),
    ...clients.map((client): SearchResult => ({
      kind: "client",
      id: client.id,
      title: client.displayName,
      subtitle: "Client",
      firmId: client.firmId,
    })),
    ...documents.map((document): SearchResult => ({
      kind: "document",
      id: document.id,
      title: document.filename,
      subtitle: document.category,
      firmId: document.firmId,
    })),
  ];
}
