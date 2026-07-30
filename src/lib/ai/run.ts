import "server-only";

import { recordAuditEvent } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import type { FirmScope } from "@/lib/data/scope";
import {
  beginAnalysis,
  completeAnalysis,
  failAnalysis,
  recordReview,
  setMatterAiStatus,
} from "@/lib/data/analyses";
import { matterDetail } from "@/lib/data/matters";
import { prisma } from "@/lib/prisma";
import { parseJsonObject } from "@/lib/json-field";
import { aiProvider, type AIProvider } from "@/lib/ai/provider";
import { raiseApproval, supersedeEarlierAnalysisApprovals } from "@/lib/approvals/raise";
import type { MatterAnalysisInput, MatterAnalysisResult } from "@/lib/ai/types";
import { serverEnv } from "@/lib/env";

/**
 * Orchelio — running an analysis.
 *
 * This is the only place an analysis is produced, and it is deliberately dull:
 * gather the matter, open a record, ask the provider, write down what came
 * back. The interesting decisions are in the analyst and the reviewer; the
 * interesting *risks* are here.
 *
 * Three of them, and how each is handled:
 *
 * 1. **A run that dies leaves no trace.** The record is opened as "running"
 *    before the provider is called, so a crash leaves a matter that says an
 *    analysis failed rather than a matter that looks untouched.
 * 2. **An error message leaks the server's internals to a browser.** The real
 *    error is logged to the server console; what is stored and shown is a
 *    fixed sentence.
 * 3. **A run reaches across firms.** Every write below names the firm, and the
 *    matter is re-read in scope before anything is created.
 */

/** What a simulated run "costs". Fixed, so a demonstration is reproducible. */
const SIMULATED_USAGE = {
  analyst: { inputTokens: 8_400, outputTokens: 1_900, costCents: 4 },
  reviewer: { inputTokens: 3_100, outputTokens: 700, costCents: 2 },
} as const;

/** Shown to the user when a run fails. Never the underlying error. */
export const ANALYSIS_FAILURE_MESSAGE =
  "The analysis did not complete. Nothing was saved for this run, and no part of it should be relied on. Running it again is safe.";

export type RunOutcome =
  | { ok: true; analysisId: string; result: MatterAnalysisResult; reviewStatus: string }
  | { ok: false; reason: "matter_not_found" }
  | { ok: false; reason: "no_features"; }
  | { ok: false; reason: "failed"; analysisId: string | null };

/**
 * Analyses a matter, then reviews the analysis.
 *
 * The review runs in the same call rather than on demand: an analysis nobody
 * has checked should never be the thing a user reads first, and making the
 * check optional would make it the thing everyone skips.
 */
export async function runAnalysis(
  scope: FirmScope,
  options: { matterId: string; userId: string; enabledFeatures: readonly string[]; now?: Date },
): Promise<RunOutcome> {
  const matter = await matterDetail({ matterId: options.matterId, firmId: scope.firmId });
  if (!matter) return { ok: false, reason: "matter_not_found" };

  if (options.enabledFeatures.length === 0) {
    // Not a failure: the firm switched everything off, and running anyway would
    // produce a page of empty sections that looks like a broken product.
    return { ok: false, reason: "no_features" };
  }

  const provider = aiProvider(serverEnv().aiProvider);
  const now = options.now ?? new Date();

  const analysis = await beginAnalysis(scope, {
    matterId: matter.id,
    provider: provider.name,
    model: provider.model,
    promptVersion: provider.promptVersion,
    startedById: options.userId,
  });
  if (!analysis) return { ok: false, reason: "matter_not_found" };

  await setMatterAiStatus(scope, matter.id, "running");
  await recordAuditEvent({
    action: AUDIT_ACTIONS.analysisStarted,
    firmId: scope.firmId,
    userId: options.userId,
    resourceType: "ai_analysis",
    resourceId: analysis.id,
    newValue: { matterId: matter.id, provider: provider.name, simulated: provider.simulated },
  });

  const input = buildInput(matter, options.enabledFeatures, now);

  try {
    const result = await provider.analyseMatter(input);
    await completeAnalysis(scope, analysis.id, {
      result,
      warnings: result.warnings,
      completedAt: new Date(),
    });
    await recordUsage(scope, matter.id, provider, "claude_analyst");

    const review = await provider.reviewAnalysis({ analysis: result, matter: input });
    await recordReview(scope, {
      analysisId: analysis.id,
      provider: provider.name,
      model: provider.model,
      promptVersion: provider.promptVersion,
      status: review.status,
      result: review,
    });
    await recordUsage(scope, matter.id, provider, "claude_reviewer");

    await setMatterAiStatus(scope, matter.id, "completed");

    // An analysis is a work product, not a finding. Whether relying on it needs
    // a person's signature is the firm's choice ("Generate legal analysis" in
    // the onboarding questionnaire); raising it here is what connects that
    // choice to anything. The analysis is shown either way — what the approval
    // governs is whether anyone has taken responsibility for it.
    await raiseApproval(scope, {
      actionKey: "legal_analysis",
      resourceId: analysis.id,
      matterId: matter.id,
      summary: summariseForApproval(matter.reference, result, review.status),
      requestedById: options.userId,
    });

    // Whatever was waiting on an earlier analysis of this matter is no longer
    // the question, and leaving it in the queue is not the cautious choice: a
    // demonstration matter accumulated 113 requests this way, which buried the
    // one that mattered under a hundred that nobody could act on. Run after
    // raising, so the new request exists before the old ones stop waiting and
    // there is no instant in which this matter has nothing outstanding.
    await supersedeEarlierAnalysisApprovals(scope, {
      matterId: matter.id,
      currentAnalysisId: analysis.id,
      userId: options.userId,
    });

    await recordAuditEvent({
      action: AUDIT_ACTIONS.analysisCompleted,
      firmId: scope.firmId,
      userId: options.userId,
      resourceType: "ai_analysis",
      resourceId: analysis.id,
      newValue: {
        contradictions: result.contradictions.length,
        missingDocuments: result.missingDocuments.length,
        sufficiency: result.sufficiency,
      },
    });
    await recordAuditEvent({
      action: AUDIT_ACTIONS.reviewCompleted,
      firmId: scope.firmId,
      userId: options.userId,
      resourceType: "ai_analysis",
      resourceId: analysis.id,
      newValue: { status: review.status, issues: review.issues.length, humanReviewRequired: true },
    });

    return { ok: true, analysisId: analysis.id, result, reviewStatus: review.status };
  } catch (error) {
    // The real error goes to the server console and no further. What reaches
    // the browser is the fixed sentence above.
    console.error("[orchelio] analysis failed", error);
    await failAnalysis(scope, analysis.id, ANALYSIS_FAILURE_MESSAGE);
    await setMatterAiStatus(scope, matter.id, "failed");
    await recordAuditEvent({
      action: AUDIT_ACTIONS.analysisCompleted,
      firmId: scope.firmId,
      userId: options.userId,
      resourceType: "ai_analysis",
      resourceId: analysis.id,
      status: "failure",
      newValue: { matterId: matter.id },
    });
    return { ok: false, reason: "failed", analysisId: analysis.id };
  }
}

/** Builds the provider's input from a matter already read within its firm. */
export function buildInput(
  matter: NonNullable<Awaited<ReturnType<typeof matterDetail>>>,
  enabledFeatures: readonly string[],
  now: Date,
): MatterAnalysisInput {
  const intakeRaw = parseJsonObject(matter.intakeResponses[0]?.payload);
  const intake: Record<string, string> = {};
  for (const [key, value] of Object.entries(intakeRaw)) {
    if (typeof value === "string" && value.trim() !== "") intake[key] = value;
  }

  return {
    reference: matter.reference,
    title: matter.title,
    practiceAreaKey: matter.practiceAreaKey,
    matterTypeKey: matter.matterTypeKey,
    status: matter.status,
    representationSide: matter.representationSide,
    fields: parseJsonObject(matter.fields),
    intake,
    documents: matter.documents.map((document) => ({
      filename: document.filename,
      category: document.category,
      receivedAt: document.receivedAt.toISOString(),
      verified: document.verified,
    })),
    enabledFeatures,
    now,
  };
}

/**
 * What the approver sees before opening the analysis.
 *
 * Deliberately the parts that bear on whether to trust it — how much
 * disagrees, how much is absent, and what the reviewer said — rather than the
 * summary, which reads as a finding when quoted out of its warnings.
 */
function summariseForApproval(
  reference: string,
  result: MatterAnalysisResult,
  reviewStatus: string,
): string {
  const parts = [`Analysis of ${reference}.`];

  parts.push(
    result.contradictions.length === 0
      ? "Nothing on the record disagrees with anything else."
      : `${result.contradictions.length} disagreement${result.contradictions.length === 1 ? "" : "s"} on the record, unresolved.`,
  );

  if (result.missingDocuments.length > 0) {
    parts.push(`${result.missingDocuments.length} expected document(s) not on file.`);
  }
  if (result.sufficiency === "more_information_required") {
    parts.push("The reviewer found too little on file for the analysis to say much.");
  }

  parts.push(`Independent review: ${reviewStatus.split("_").join(" ")}.`);
  return parts.join(" ");
}

async function recordUsage(
  scope: FirmScope,
  matterId: string,
  provider: AIProvider,
  operation: "claude_analyst" | "claude_reviewer",
): Promise<void> {
  const usage =
    operation === "claude_analyst" ? SIMULATED_USAGE.analyst : SIMULATED_USAGE.reviewer;

  await prisma.usageRecord.create({
    data: {
      firmId: scope.firmId,
      matterId,
      operation,
      provider: provider.name,
      model: provider.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      costCents: usage.costCents,
      // A simulated run is never a real charge, and that is a property of the
      // stored row rather than a caption on a screen.
      isRealCharge: !provider.simulated,
    },
  });
}
