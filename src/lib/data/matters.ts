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

/** How a matter list may be ordered. Anything else is refused, not guessed. */
export const MATTER_SORTS = ["activity", "reference", "client", "status", "deadline"] as const;
export type MatterSort = (typeof MATTER_SORTS)[number];

export function isMatterSort(value: string): value is MatterSort {
  return (MATTER_SORTS as readonly string[]).includes(value);
}

/** How many matters one page of the list holds (ADR-0029). */
export const MATTERS_PER_PAGE = 20;

/**
 * The `where` clause, built once.
 *
 * Shared by the list and its count so the two cannot disagree — a page that
 * says "132 matters" above twenty rows drawn from a different set is worse
 * than either number alone. Every branch names the firm through the caller's
 * scope; the `OR` here is inside an `AND` with `firmId`, which is the shape
 * the scoping guard requires.
 */
function matterWhere(scope: FirmScope, filters: MatterFilters) {
  const search = filters.search?.trim();

  return {
    firmId: scope.firmId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.matterTypeKey ? { matterTypeKey: filters.matterTypeKey } : {}),
    ...(filters.responsibleAttorneyId
      ? { responsibleAttorneyId: filters.responsibleAttorneyId }
      : {}),
    ...(filters.representationSide ? { representationSide: filters.representationSide } : {}),
    ...(search
      ? {
          OR: [
            { reference: { contains: search } },
            { title: { contains: search } },
            { clientProfile: { displayName: { contains: search } } },
          ],
        }
      : {}),
  };
}

/**
 * The ordering for each sort a column header can ask for.
 *
 * A secondary key on every one of them: two matters sharing a status would
 * otherwise come back in whatever order the database felt like, and a list
 * that reshuffles under a reader between page one and page two is a list they
 * stop trusting.
 */
function matterOrder(sort: MatterSort): Record<string, unknown>[] {
  switch (sort) {
    case "reference":
      return [{ reference: "asc" }];
    case "client":
      return [{ clientProfile: { displayName: "asc" } }, { reference: "asc" }];
    case "status":
      return [{ status: "asc" }, { lastActivityAt: "desc" }];
    case "deadline":
      // Nulls last: a matter with no recorded date is not the most urgent one.
      return [{ nextDeadlineAt: { sort: "asc", nulls: "last" } }, { reference: "asc" }];
    case "activity":
      return [{ lastActivityAt: "desc" }];
  }
}

export async function listMatters(
  scope: FirmScope,
  filters: MatterFilters = {},
  options: { page?: number; sort?: MatterSort } = {},
) {
  const page = Math.max(1, Math.trunc(options.page ?? 1));

  return prisma.matter.findMany({
    where: matterWhere(scope, filters),
    orderBy: matterOrder(options.sort ?? "activity"),
    skip: (page - 1) * MATTERS_PER_PAGE,
    take: MATTERS_PER_PAGE,
    include: {
      clientProfile: { select: { displayName: true } },
      matterType: { select: { label: true } },
      responsibleAttorney: { select: { name: true } },
    },
  });
}

/**
 * How many matters match, whatever the page shows.
 *
 * The list is a window; this is the size of what it looks through. Reported on
 * screen beside the window's own bounds, because "20 matters" above twenty
 * rows of a hundred and thirty-two is a false claim of the kind
 * `approvalCounts` was written to stop making.
 */
export async function countMattersMatching(
  scope: FirmScope,
  filters: MatterFilters = {},
): Promise<number> {
  return prisma.matter.count({ where: matterWhere(scope, filters) });
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

/**
 * The next matter reference for a firm, e.g. "IMM-2026-004".
 *
 * Sequential within a firm and a year, which is how a firm actually refers to
 * its files. Derived from the highest existing number rather than a counter, so
 * it survives a reseed and never depends on a row nobody can see.
 */
export async function nextReference(scope: FirmScope, practiceArea: string): Promise<string> {
  const prefix = practiceArea === "employment_law" ? "EMP" : "IMM";
  const year = new Date().getFullYear();
  const stem = `${prefix}-${year}-`;

  const existing = await prisma.matter.findMany({
    where: { firmId: scope.firmId, reference: { startsWith: stem } },
    select: { reference: true },
  });

  const highest = existing.reduce((max, matter) => {
    const suffix = Number(matter.reference.slice(stem.length));
    return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
  }, 0);

  return `${stem}${String(highest + 1).padStart(3, "0")}`;
}

export type NewMatter = {
  title: string;
  clientName: string;
  matterTypeKey: string;
  practiceAreaKey: string;
  status: string;
  representationSide?: string | null;
  responsibleAttorneyId?: string | null;
  createdById: string;
  fields: Record<string, string | number | boolean>;
};

/**
 * Creates a matter, and the client profile it belongs to.
 *
 * Both writes name the firm, so neither can land in another firm's workspace
 * even if the caller passed an identifier from one.
 */
export async function createMatter(scope: FirmScope, input: NewMatter) {
  const existingClient = await prisma.clientProfile.findFirst({
    where: { firmId: scope.firmId, displayName: input.clientName },
  });

  const client =
    existingClient ??
    (await prisma.clientProfile.create({
      data: {
        firmId: scope.firmId,
        displayName: input.clientName,
        isFictional: true,
        createdById: input.createdById,
      },
    }));

  return prisma.matter.create({
    data: {
      firmId: scope.firmId,
      reference: await nextReference(scope, input.practiceAreaKey),
      title: input.title,
      clientProfileId: client.id,
      practiceAreaKey: input.practiceAreaKey,
      matterTypeKey: input.matterTypeKey,
      status: input.status,
      representationSide: input.representationSide ?? null,
      responsibleAttorneyId: input.responsibleAttorneyId ?? null,
      createdById: input.createdById,
      fields: JSON.stringify(input.fields),
    },
  });
}

/** Everything one matter page needs, in one round trip. */
export async function matterDetail({ matterId, firmId }: { matterId: string } & FirmScope) {
  return prisma.matter.findFirst({
    where: { id: matterId, firmId },
    include: {
      clientProfile: true,
      matterType: true,
      responsibleAttorney: { select: { id: true, name: true } },
      documents: { orderBy: { receivedAt: "desc" } },
      tasks: { orderBy: [{ status: "asc" }, { dueAt: "asc" }] },
      intakeResponses: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

/** Records that a matter was touched, so the list orders by real activity. */
export async function touchMatter(scope: FirmScope, matterId: string): Promise<void> {
  await prisma.matter.updateMany({
    where: { id: matterId, firmId: scope.firmId },
    data: { lastActivityAt: new Date() },
  });
}
