import "server-only";

import { prisma } from "@/lib/prisma";
import type { FirmScope } from "@/lib/data/scope";

/**
 * Orchelio — simulated AI usage and cost.
 *
 * Costs are billed per firm, so a leak here would not merely expose data — it
 * would produce a wrong invoice. Every figure on the usage screen comes from
 * one of these functions.
 */

export type UsageSummary = {
  analyses: number;
  reviews: number;
  inputTokens: number;
  outputTokens: number;
  /** Cents, to avoid floating-point money. */
  costCents: number;
  /** False while every recorded charge is simulated. */
  includesRealCharges: boolean;
};

/**
 * One firm's usage.
 *
 * Two queries rather than four: the per-operation counts and the real-charge
 * flag come from a single `groupBy` instead of three separate `count` calls.
 * The dashboard reads this on every load, so the difference is paid on every
 * page view, not once.
 */
export async function usageSummary(scope: FirmScope): Promise<UsageSummary> {
  const [totals, byOperation] = await Promise.all([
    prisma.usageRecord.aggregate({
      where: { firmId: scope.firmId },
      _sum: { inputTokens: true, outputTokens: true, costCents: true },
    }),
    prisma.usageRecord.groupBy({
      by: ["operation", "isRealCharge"],
      where: { firmId: scope.firmId },
      _count: { _all: true },
    }),
  ]);

  let analyses = 0;
  let reviews = 0;
  let realCharges = 0;

  for (const row of byOperation) {
    if (row.operation === "claude_analyst") analyses += row._count._all;
    if (row.operation === "claude_reviewer") reviews += row._count._all;
    if (row.isRealCharge) realCharges += row._count._all;
  }

  return {
    analyses,
    reviews,
    inputTokens: totals._sum.inputTokens ?? 0,
    outputTokens: totals._sum.outputTokens ?? 0,
    costCents: totals._sum.costCents ?? 0,
    includesRealCharges: realCharges > 0,
  };
}

export type UsageByOperation = {
  operation: string;
  runs: number;
  inputTokens: number;
  outputTokens: number;
  costCents: number;
};

/** What each kind of operation has cost this firm. */
export async function usageByOperation(scope: FirmScope): Promise<UsageByOperation[]> {
  const rows = await prisma.usageRecord.groupBy({
    by: ["operation"],
    where: { firmId: scope.firmId },
    _count: { _all: true },
    _sum: { inputTokens: true, outputTokens: true, costCents: true },
  });

  return rows
    .map((row) => ({
      operation: row.operation,
      runs: row._count._all,
      inputTokens: row._sum.inputTokens ?? 0,
      outputTokens: row._sum.outputTokens ?? 0,
      costCents: row._sum.costCents ?? 0,
    }))
    .sort((a, b) => b.costCents - a.costCents || a.operation.localeCompare(b.operation));
}

export type UsageByMatter = {
  matterId: string;
  reference: string;
  runs: number;
  costCents: number;
};

/**
 * What each matter has cost.
 *
 * Two queries rather than a join: `groupBy` cannot include a relation, and
 * fetching the references separately — scoped to the firm again, not trusted
 * from the first query's output — keeps the second read as answerable as the
 * first.
 */
export async function usageByMatter(scope: FirmScope, take = 10): Promise<UsageByMatter[]> {
  const rows = await prisma.usageRecord.groupBy({
    by: ["matterId"],
    where: { firmId: scope.firmId, matterId: { not: null } },
    _count: { _all: true },
    _sum: { costCents: true },
  });

  const ranked = rows
    .filter((row): row is typeof row & { matterId: string } => row.matterId !== null)
    .sort((a, b) => (b._sum.costCents ?? 0) - (a._sum.costCents ?? 0))
    .slice(0, take);

  if (ranked.length === 0) return [];

  const matters = await prisma.matter.findMany({
    where: { firmId: scope.firmId, id: { in: ranked.map((row) => row.matterId) } },
    select: { id: true, reference: true },
  });
  const referenceById = new Map(matters.map((matter) => [matter.id, matter.reference]));

  return ranked.flatMap((row) => {
    const reference = referenceById.get(row.matterId);
    // A matter the firm cannot see is a matter this screen does not name. The
    // usage row is still counted in the totals above; it simply has no label.
    if (!reference) return [];
    return [
      {
        matterId: row.matterId,
        reference,
        runs: row._count._all,
        costCents: row._sum.costCents ?? 0,
      },
    ];
  });
}

export async function listUsageRecords(scope: FirmScope, take = 50) {
  return prisma.usageRecord.findMany({
    where: { firmId: scope.firmId },
    orderBy: { occurredAt: "desc" },
    take,
    include: { matter: { select: { reference: true } } },
  });
}

/** Formats cents as a currency string. Kept here so every screen agrees. */
export function formatCost(costCents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(costCents / 100);
}
