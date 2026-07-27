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

export async function usageSummary(scope: FirmScope): Promise<UsageSummary> {
  const [totals, analyses, reviews, realCharges] = await Promise.all([
    prisma.usageRecord.aggregate({
      where: { firmId: scope.firmId },
      _sum: { inputTokens: true, outputTokens: true, costCents: true },
    }),
    prisma.usageRecord.count({
      where: { firmId: scope.firmId, operation: "claude_analyst" },
    }),
    prisma.usageRecord.count({
      where: { firmId: scope.firmId, operation: "claude_reviewer" },
    }),
    prisma.usageRecord.count({ where: { firmId: scope.firmId, isRealCharge: true } }),
  ]);

  return {
    analyses,
    reviews,
    inputTokens: totals._sum.inputTokens ?? 0,
    outputTokens: totals._sum.outputTokens ?? 0,
    costCents: totals._sum.costCents ?? 0,
    includesRealCharges: realCharges > 0,
  };
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
