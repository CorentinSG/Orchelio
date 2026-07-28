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
};

export async function listActivity(scope: FirmScope, filters: ActivityFilters = {}, take = 50) {
  return prisma.auditEvent.findMany({
    where: {
      firmId: scope.firmId,
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.since ? { createdAt: { gte: filters.since } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { id: true, name: true } } },
  });
}

export async function countActivity(scope: FirmScope): Promise<number> {
  return prisma.auditEvent.count({ where: { firmId: scope.firmId } });
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
