import "server-only";

import { prisma } from "@/lib/prisma";
import type { FirmScope } from "@/lib/data/scope";

/**
 * Orchelio — matter access.
 *
 * Note the shape of every function here: the firm comes first and is required.
 * `getMatter({ matterId, firmId })`, never `getMatter(matterId)`.
 *
 * `findFirst` is used rather than `findUnique` on purpose. `findUnique` accepts
 * only unique fields, so it cannot take an extra `firmId` condition — which
 * would force the firm check to happen *after* the row is loaded, in a caller
 * that might forget. `findFirst` puts the firm in the query itself, so a matter
 * belonging to another firm is simply not found.
 */

export type MatterFilters = {
  status?: string;
  matterTypeKey?: string;
  responsibleAttorneyId?: string;
  representationSide?: string;
  /** Free text matched against the reference, title and client display name. */
  search?: string;
};

export async function getMatter({ matterId, firmId }: { matterId: string } & FirmScope) {
  return prisma.matter.findFirst({
    where: { id: matterId, firmId },
    include: {
      clientProfile: true,
      matterType: true,
      responsibleAttorney: { select: { id: true, name: true } },
    },
  });
}

export async function listMatters(scope: FirmScope, filters: MatterFilters = {}) {
  const search = filters.search?.trim();

  return prisma.matter.findMany({
    where: {
      firmId: scope.firmId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.matterTypeKey ? { matterTypeKey: filters.matterTypeKey } : {}),
      ...(filters.responsibleAttorneyId
        ? { responsibleAttorneyId: filters.responsibleAttorneyId }
        : {}),
      ...(filters.representationSide
        ? { representationSide: filters.representationSide }
        : {}),
      ...(search
        ? {
            OR: [
              { reference: { contains: search } },
              { title: { contains: search } },
              { clientProfile: { displayName: { contains: search } } },
            ],
          }
        : {}),
    },
    orderBy: { lastActivityAt: "desc" },
    include: {
      clientProfile: { select: { displayName: true } },
      matterType: { select: { label: true } },
      responsibleAttorney: { select: { name: true } },
    },
  });
}

export async function countMatters(scope: FirmScope): Promise<number> {
  return prisma.matter.count({ where: { firmId: scope.firmId } });
}

/** Matter counts by status, for the dashboard. Never spans firms. */
export async function matterCountsByStatus(scope: FirmScope): Promise<Record<string, number>> {
  const rows = await prisma.matter.groupBy({
    by: ["status"],
    where: { firmId: scope.firmId },
    _count: { _all: true },
  });

  return Object.fromEntries(rows.map((row) => [row.status, row._count._all]));
}
