import "server-only";

import { prisma } from "@/lib/prisma";
import type { FirmScope } from "@/lib/data/scope";

/**
 * Orchelio — firm-level records.
 *
 * `Firm` itself is not firm-scoped — it *is* the firm — but everything hanging
 * off it is, so those reads go through a scope like every other.
 */

export async function firmConfiguration(scope: FirmScope) {
  return prisma.firmConfiguration.findFirst({ where: { firmId: scope.firmId } });
}

export async function firmMembers(scope: FirmScope) {
  return prisma.firmMembership.findMany({
    where: { firmId: scope.firmId, status: "active" },
    include: { user: { select: { id: true, name: true, email: true, lastLoginAt: true } } },
    orderBy: { role: "asc" },
  });
}

export async function enabledWorkflows(scope: FirmScope) {
  return prisma.firmWorkflow.findMany({
    where: { firmId: scope.firmId, enabled: true },
    include: { template: true },
    orderBy: { template: { sortOrder: "asc" } },
  });
}

/**
 * The firm record itself, by identifier.
 *
 * Callers must already have verified membership through
 * `requireFirmAccess` — this function answers "what is this firm called?", not
 * "may I see it?".
 */
export async function getFirm(firmId: string) {
  return prisma.firm.findUnique({ where: { id: firmId } });
}
