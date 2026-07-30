import "server-only";

import { prisma } from "@/lib/prisma";
import type { FirmScope } from "@/lib/data/scope";
import { firmTimezone } from "@/lib/format/dates";

/**
 * Orchelio — firm-level records.
 *
 * `Firm` itself is not firm-scoped — it *is* the firm — but everything hanging
 * off it is, so those reads go through a scope like every other.
 */

export async function firmConfiguration(scope: FirmScope) {
  return prisma.firmConfiguration.findFirst({ where: { firmId: scope.firmId } });
}

/**
 * The zone this firm's screens name their dates in.
 *
 * For pages that need nothing else from the configuration. A page that already
 * has it should call `firmTimezone(configuration?.timezone)` instead of asking
 * the database a second time for the same row.
 */
export async function firmTimezoneFor(scope: FirmScope): Promise<string> {
  const configuration = await firmConfiguration(scope);
  return firmTimezone(configuration?.timezone);
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
