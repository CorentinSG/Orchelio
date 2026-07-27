import "server-only";

import { prisma } from "@/lib/prisma";
import type { FirmScope } from "@/lib/data/scope";

/**
 * Orchelio — AI analysis and review access.
 *
 * Analyses hold extracted facts about a client's situation, so they are among
 * the most sensitive records in the product. A review is reachable only through
 * the analysis it belongs to, and the analysis only through its firm.
 */

export async function getAnalysis({ analysisId, firmId }: { analysisId: string } & FirmScope) {
  return prisma.aIAnalysis.findFirst({
    where: { id: analysisId, firmId },
    include: {
      reviews: { orderBy: { createdAt: "desc" } },
      matter: { select: { id: true, reference: true, title: true } },
    },
  });
}

export async function listAnalysesForMatter(scope: FirmScope, matterId: string) {
  return prisma.aIAnalysis.findMany({
    where: { firmId: scope.firmId, matterId },
    orderBy: { startedAt: "desc" },
    include: { reviews: { orderBy: { createdAt: "desc" } } },
  });
}

export async function listRecentAnalyses(scope: FirmScope, take = 5) {
  return prisma.aIAnalysis.findMany({
    where: { firmId: scope.firmId },
    orderBy: { startedAt: "desc" },
    take,
    include: { matter: { select: { reference: true, title: true } } },
  });
}

export async function getReview({ reviewId, firmId }: { reviewId: string } & FirmScope) {
  return prisma.aIReview.findFirst({
    where: { id: reviewId, firmId },
  });
}

export async function countAnalyses(scope: FirmScope): Promise<number> {
  return prisma.aIAnalysis.count({ where: { firmId: scope.firmId } });
}
