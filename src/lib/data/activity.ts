import "server-only";

import { prisma } from "@/lib/prisma";
import type { FirmScope } from "@/lib/data/scope";

/**
 * Orchelio — activity log reading.
 *
 * Writing is in `src/lib/audit.ts`; this module only reads, and only ever for
 * one firm. A firm's log is itself confidential: it records which matters were
 * opened, by whom and when.
 *
 * Platform-level events (a sign-in, before any firm is chosen) carry no firm
 * and therefore never appear in a firm's log.
 */

export type ActivityFilters = {
  action?: string;
  userId?: string;
  status?: string;
  since?: Date;
  /** Events about one matter — its own id, and anything raised against it. */
  resourceId?: string;
  resourceType?: string;
};

export async function listActivity(scope: FirmScope, filters: ActivityFilters = {}, take = 50) {
  return prisma.auditEvent.findMany({
    where: {
      firmId: scope.firmId,
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.since ? { createdAt: { gte: filters.since } } : {}),
      ...(filters.resourceId ? { resourceId: filters.resourceId } : {}),
      ...(filters.resourceType ? { resourceType: filters.resourceType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { id: true, name: true } } },
  });
}

export async function countActivity(
  scope: FirmScope,
  filters: ActivityFilters = {},
): Promise<number> {
  return prisma.auditEvent.count({
    where: {
      firmId: scope.firmId,
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.since ? { createdAt: { gte: filters.since } } : {}),
    },
  });
}

/**
 * Everything recorded about one matter.
 *
 * A matter's own events name it as the resource; an approval or a draft raised
 * against it names *itself*, with the matter in the payload. Both are wanted on
 * a matter's activity tab, so the identifiers of its own records are collected
 * and matched as well.
 */
export async function listMatterActivity(
  scope: FirmScope,
  matterId: string,
  relatedIds: readonly string[],
  take = 100,
) {
  return prisma.auditEvent.findMany({
    where: {
      firmId: scope.firmId,
      resourceId: { in: [matterId, ...relatedIds] },
    },
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { id: true, name: true } } },
  });
}

/** The people who appear in this firm's log, for a filter menu. */
export async function activityUsers(scope: FirmScope) {
  const rows = await prisma.auditEvent.findMany({
    where: { firmId: scope.firmId, userId: { not: null } },
    select: { userId: true, user: { select: { id: true, name: true } } },
    distinct: ["userId"],
  });

  return rows
    .map((row) => row.user)
    .filter((user): user is { id: string; name: string } => user !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The distinct action names present in this firm's log, for a filter menu. */
export async function activityActions(scope: FirmScope): Promise<string[]> {
  const rows = await prisma.auditEvent.groupBy({
    by: ["action"],
    where: { firmId: scope.firmId },
    _count: { _all: true },
  });

  return rows.map((row) => row.action).sort();
}

/** Open tasks for a firm, newest deadline first. */
export async function listTasks(scope: FirmScope, onlyOpen = true) {
  return prisma.task.findMany({
    where: {
      firmId: scope.firmId,
      ...(onlyOpen ? { status: { in: ["open", "in_progress"] } } : {}),
    },
    orderBy: [{ dueAt: "asc" }],
    include: {
      matter: { select: { id: true, reference: true, title: true } },
      assignedTo: { select: { name: true } },
    },
  });
}

/** Matters whose intake has been submitted, for the intake screen. */
export async function listIntakes(scope: FirmScope) {
  return prisma.intakeResponse.findMany({
    where: { firmId: scope.firmId },
    orderBy: { submittedAt: "desc" },
    include: {
      matter: {
        select: {
          id: true,
          reference: true,
          title: true,
          status: true,
          clientProfile: { select: { displayName: true } },
        },
      },
    },
  });
}
