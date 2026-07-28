import "server-only";

import { prisma } from "@/lib/prisma";
import { matterTypesForPracticeAreas, workflowTemplatesFor } from "@/lib/data/catalogues";
import type { FirmScope } from "@/lib/data/scope";
import { parseJsonObject, parseStringArray } from "@/lib/json-field";
import {
  type OnboardingAnswers,
  aiFeatureIdsFrom,
  aiFeatureKeysFor,
  workflowIdsFrom,
  workflowKeysFor,
} from "@/lib/onboarding/config";

/**
 * Orchelio — reading and writing the onboarding draft.
 *
 * Each step is saved as it is answered, so "Save as draft" is not a separate
 * feature: leaving halfway through and coming back is simply what the
 * questionnaire does. The firm's configuration only becomes `complete` when the
 * summary is confirmed.
 */

export type OnboardingDraft = {
  answers: OnboardingAnswers;
  onboardingStatus: string;
  onboardingStep: number;
};

const EMPTY_ANSWERS: OnboardingAnswers = {
  firmName: "",
  contactName: "",
  contactEmail: "",
  userCount: 5,
  jurisdiction: "NY",
  language: "en",
  currency: "USD",
  timezone: "America/New_York",
  primaryPracticeArea: "",
  practiceAreas: [],
  matterTypes: [],
  workflowStepIds: [],
  aiFeatureIds: [],
  approvalKeys: [],
};

/** Loads the firm's draft, filling in what has not been answered yet. */
export async function loadDraft(scope: FirmScope): Promise<OnboardingDraft> {
  const [firm, configuration] = await Promise.all([
    prisma.firm.findUnique({ where: { id: scope.firmId } }),
    prisma.firmConfiguration.findFirst({ where: { firmId: scope.firmId } }),
  ]);

  if (!firm) {
    return { answers: EMPTY_ANSWERS, onboardingStatus: "draft", onboardingStep: 1 };
  }

  const primaryPracticeArea = configuration?.primaryPracticeArea || firm.primaryPracticeArea || "";
  const approvals = parseJsonObject(configuration?.approvals);

  return {
    onboardingStatus: configuration?.onboardingStatus ?? "draft",
    onboardingStep: configuration?.onboardingStep ?? 1,
    answers: {
      firmName: firm.name,
      contactName: configuration?.contactName ?? "",
      contactEmail: configuration?.contactEmail ?? "",
      userCount: configuration?.userCount ?? EMPTY_ANSWERS.userCount,
      jurisdiction: configuration?.jurisdiction ?? EMPTY_ANSWERS.jurisdiction,
      language: configuration?.language ?? EMPTY_ANSWERS.language,
      currency: configuration?.currency ?? EMPTY_ANSWERS.currency,
      timezone: configuration?.timezone ?? EMPTY_ANSWERS.timezone,
      primaryPracticeArea,
      practiceAreas: parseStringArray(configuration?.practiceAreas),
      matterTypes: parseStringArray(configuration?.matterTypes),
      // Stored in practice-area vocabulary; the questionnaire needs checkbox ids.
      workflowStepIds: workflowIdsFrom(
        parseStringArray(configuration?.enabledWorkflows),
        primaryPracticeArea,
      ),
      aiFeatureIds: aiFeatureIdsFrom(
        parseStringArray(configuration?.aiFeatures),
        primaryPracticeArea,
      ),
      approvalKeys: Object.entries(approvals)
        .filter(([, required]) => required === true)
        .map(([key]) => key),
    },
  };
}

/** Ensures a configuration row exists, so later steps can update it. */
async function ensureConfiguration(scope: FirmScope, primaryPracticeArea: string) {
  const existing = await prisma.firmConfiguration.findFirst({ where: { firmId: scope.firmId } });
  if (existing) return existing;

  return prisma.firmConfiguration.create({
    data: { firmId: scope.firmId, primaryPracticeArea },
  });
}

type StepUpdate = Partial<{
  firmName: string;
  contactName: string;
  contactEmail: string;
  userCount: number;
  jurisdiction: string;
  language: string;
  currency: string;
  timezone: string;
  primaryPracticeArea: string;
  practiceAreas: string[];
  matterTypes: string[];
  workflowStepIds: string[];
  aiFeatureIds: string[];
  approvalKeys: string[];
}>;

/**
 * Saves one step and records how far the firm has reached.
 *
 * Changing the main practice area in step 2 re-translates any answers already
 * given in steps 4 and 5 into the new area's vocabulary. Without that, a firm
 * that changed its mind would keep immigration keys in an employment
 * configuration — answers that silently stopped meaning anything.
 */
export async function saveStep(
  scope: FirmScope,
  step: number,
  update: StepUpdate,
  approvalsBuilder: (keys: readonly string[]) => Record<string, boolean>,
): Promise<void> {
  const draft = await loadDraft(scope);
  const previousArea = draft.answers.primaryPracticeArea;
  const nextArea = update.primaryPracticeArea ?? previousArea;

  await ensureConfiguration(scope, nextArea || "");

  if (update.firmName !== undefined || update.primaryPracticeArea !== undefined) {
    await prisma.firm.update({
      where: { id: scope.firmId },
      data: {
        ...(update.firmName !== undefined ? { name: update.firmName.trim() } : {}),
        ...(update.primaryPracticeArea !== undefined
          ? { primaryPracticeArea: update.primaryPracticeArea }
          : {}),
      },
    });
  }

  const workflowIds = update.workflowStepIds ?? draft.answers.workflowStepIds;
  const aiIds = update.aiFeatureIds ?? draft.answers.aiFeatureIds;
  const areaChanged = nextArea !== previousArea;

  await prisma.firmConfiguration.updateMany({
    where: { firmId: scope.firmId },
    data: {
      ...(update.contactName !== undefined ? { contactName: update.contactName.trim() } : {}),
      ...(update.contactEmail !== undefined ? { contactEmail: update.contactEmail.trim() } : {}),
      ...(update.userCount !== undefined ? { userCount: update.userCount } : {}),
      ...(update.jurisdiction !== undefined ? { jurisdiction: update.jurisdiction } : {}),
      ...(update.language !== undefined ? { language: update.language } : {}),
      ...(update.currency !== undefined ? { currency: update.currency } : {}),
      ...(update.timezone !== undefined ? { timezone: update.timezone } : {}),
      ...(update.primaryPracticeArea !== undefined
        ? { primaryPracticeArea: update.primaryPracticeArea }
        : {}),
      ...(update.practiceAreas !== undefined
        ? { practiceAreas: JSON.stringify(update.practiceAreas) }
        : {}),
      ...(update.matterTypes !== undefined
        ? { matterTypes: JSON.stringify(update.matterTypes) }
        : {}),
      ...(update.workflowStepIds !== undefined || areaChanged
        ? { enabledWorkflows: JSON.stringify(workflowKeysFor(workflowIds, nextArea)) }
        : {}),
      ...(update.aiFeatureIds !== undefined || areaChanged
        ? { aiFeatures: JSON.stringify(aiFeatureKeysFor(aiIds, nextArea)) }
        : {}),
      ...(update.approvalKeys !== undefined
        ? { approvals: JSON.stringify(approvalsBuilder(update.approvalKeys)) }
        : {}),
      onboardingStep: Math.max(draft.onboardingStep, step),
    },
  });
}

/**
 * Confirms the configuration.
 *
 * Enabling the workflow templates is derived, not asked: a firm should not have
 * to know that "Immigration — consultation preparation" exists. Templates that
 * apply to any practice area, plus those for the firm's own, are switched on.
 */
export async function completeOnboarding(scope: FirmScope): Promise<void> {
  const configuration = await prisma.firmConfiguration.findFirst({
    where: { firmId: scope.firmId },
  });
  if (!configuration) return;

  const templates = await workflowTemplatesFor(configuration.primaryPracticeArea);

  for (const template of templates) {
    await prisma.firmWorkflow.upsert({
      where: { firmId_templateKey: { firmId: scope.firmId, templateKey: template.key } },
      update: { enabled: true },
      create: { firmId: scope.firmId, templateKey: template.key, enabled: true },
    });
  }

  await prisma.firmConfiguration.updateMany({
    where: { firmId: scope.firmId },
    data: { onboardingStatus: "complete", onboardingStep: 7 },
  });

  await prisma.firm.update({ where: { id: scope.firmId }, data: { status: "active" } });
}

/** Reopens the questionnaire without discarding a single answer. */
export async function restartOnboarding(scope: FirmScope): Promise<void> {
  await prisma.firmConfiguration.updateMany({
    where: { firmId: scope.firmId },
    data: { onboardingStatus: "draft", onboardingStep: 1 },
  });
}

/**
 * The matter types on offer, for the practice areas the firm selected.
 *
 * Read from the platform catalogue cache rather than the database: the answer
 * is the same for every firm, and the questionnaire asks for it on every step-3
 * render.
 */
export async function matterTypeOptions(practiceAreas: readonly string[]) {
  return matterTypesForPracticeAreas(practiceAreas);
}
