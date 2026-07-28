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
    include: {
      matter: { select: { reference: true, title: true } },
      // The review's verdict travels with the analysis: a list showing an
      // analysis without saying whether anything checked it invites the reader
      // to assume something did.
      reviews: { orderBy: { createdAt: "desc" }, take: 1 },
    },
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

/** The most recent analysis on a matter, with its reviews. */
export async function latestAnalysisForMatter(scope: FirmScope, matterId: string) {
  return prisma.aIAnalysis.findFirst({
    where: { firmId: scope.firmId, matterId },
    orderBy: { startedAt: "desc" },
    include: { reviews: { orderBy: { createdAt: "desc" } } },
  });
}

/**
 * Opens an analysis in the "running" state.
 *
 * Created before the work begins, not after it succeeds, so a run that dies
 * halfway leaves a record saying so rather than leaving no trace. A matter
 * that shows nothing is indistinguishable from a matter nobody analysed, and
 * those are very different things to a lawyer.
 *
 * The matter is re-read inside the firm's scope first, so an identifier from
 * another firm records nothing at all.
 */
export async function beginAnalysis(
  scope: FirmScope,
  input: { matterId: string; provider: string; model: string; promptVersion: string; startedById: string },
) {
  const matter = await prisma.matter.findFirst({
    where: { id: input.matterId, firmId: scope.firmId },
    select: { id: true },
  });
  if (!matter) return null;

  return prisma.aIAnalysis.create({
    data: {
      firmId: scope.firmId,
      matterId: matter.id,
      provider: input.provider,
      model: input.model,
      promptVersion: input.promptVersion,
      status: "running",
      createdById: input.startedById,
    },
  });
}

export async function completeAnalysis(
  scope: FirmScope,
  analysisId: string,
  result: { result: unknown; warnings: readonly string[]; completedAt: Date },
): Promise<number> {
  const updated = await prisma.aIAnalysis.updateMany({
    where: { id: analysisId, firmId: scope.firmId },
    data: {
      status: "completed",
      result: JSON.stringify(result.result),
      warnings: JSON.stringify(result.warnings),
      errorMessage: null,
      completedAt: result.completedAt,
    },
  });
  return updated.count;
}

/**
 * Records that an analysis did not finish.
 *
 * `result` is cleared rather than left behind: a half-written analysis shown
 * beside a failure notice is the sort of thing a reader takes for a whole one.
 * The message stored is the generic one shown to the user — the underlying
 * error is logged on the server and never sent to a browser.
 */
export async function failAnalysis(
  scope: FirmScope,
  analysisId: string,
  message: string,
): Promise<number> {
  const updated = await prisma.aIAnalysis.updateMany({
    where: { id: analysisId, firmId: scope.firmId },
    data: { status: "failed", errorMessage: message, result: null, completedAt: new Date() },
  });
  return updated.count;
}

export async function recordReview(
  scope: FirmScope,
  input: { analysisId: string; provider: string; model: string; promptVersion: string; status: string; result: unknown },
) {
  // The analysis is re-read in scope, so a review cannot be attached to another
  // firm's analysis even with a real identifier.
  const analysis = await prisma.aIAnalysis.findFirst({
    where: { id: input.analysisId, firmId: scope.firmId },
    select: { id: true },
  });
  if (!analysis) return null;

  return prisma.aIReview.create({
    data: {
      firmId: scope.firmId,
      analysisId: analysis.id,
      provider: input.provider,
      model: input.model,
      promptVersion: input.promptVersion,
      status: input.status,
      result: JSON.stringify(input.result),
      // Never false, and stored rather than assumed. See ADR-0008.
      humanReviewRequired: true,
    },
  });
}

/** Sets the matter's own AI status, so the list can show it without a join. */
export async function setMatterAiStatus(
  scope: FirmScope,
  matterId: string,
  status: string,
): Promise<void> {
  await prisma.matter.updateMany({
    where: { id: matterId, firmId: scope.firmId },
    data: { aiStatus: status },
  });
}
