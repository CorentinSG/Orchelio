import "server-only";

import { prisma } from "@/lib/prisma";
import type { FirmScope } from "@/lib/data/scope";
import { usageSummary } from "@/lib/data/usage";

/**
 * Orchelio — firm statistics.
 *
 * These are the numbers the dashboard puts in large type, which makes them the
 * numbers a user trusts without checking. Every one is counted within a single
 * firm.
 */

export type FirmStatistics = {
  matters: number;
  openMatters: number;
  documents: number;
  analyses: number;
  pendingApprovals: number;
  openTasks: number;
  clients: number;
  usageCostCents: number;
};

export async function firmStatistics(scope: FirmScope): Promise<FirmStatistics> {
  const where = { firmId: scope.firmId };

  const [matters, openMatters, documents, analyses, pendingApprovals, openTasks, clients, usage] =
    await Promise.all([
      prisma.matter.count({ where }),
      prisma.matter.count({ where: { ...where, closedAt: null } }),
      prisma.document.count({ where }),
      prisma.aIAnalysis.count({ where }),
      prisma.approvalRequest.count({ where: { ...where, status: "pending" } }),
      prisma.task.count({ where: { ...where, status: { in: ["open", "in_progress"] } } }),
      prisma.clientProfile.count({ where }),
      usageSummary(scope),
    ]);

  return {
    matters,
    openMatters,
    documents,
    analyses,
    pendingApprovals,
    openTasks,
    clients,
    usageCostCents: usage.costCents,
  };
}
