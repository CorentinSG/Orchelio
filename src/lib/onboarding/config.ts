/**
 * Orchelio — turning questionnaire answers into a firm configuration.
 *
 * Pure functions, no database and no request. The configuration a firm ends up
 * with is the single thing that makes its Orchelio different from every other
 * firm's, so the rules that produce it are written where they can be tested
 * directly rather than only through a browser.
 */

import {
  AI_FEATURE_OPTIONS,
  CONFIGURABLE_APPROVAL_OPTIONS,
  LOCKED_APPROVAL_OPTIONS,
  WORKFLOW_STEP_OPTIONS,
  resolveKey,
} from "@/lib/onboarding/catalogue";
import { PRACTICE_AREAS, isPracticeAreaAvailable } from "@/lib/practice-areas";

export const ONBOARDING_STEP_COUNT = 7;

export const ONBOARDING_STEPS = [
  { number: 1, slug: "firm", title: "Firm details" },
  { number: 2, slug: "practice-areas", title: "Practice areas" },
  { number: 3, slug: "matter-types", title: "Matter types" },
  { number: 4, slug: "workflow", title: "Workflow" },
  { number: 5, slug: "ai", title: "AI features" },
  { number: 6, slug: "approvals", title: "Approvals" },
  { number: 7, slug: "summary", title: "Summary" },
] as const;

export type OnboardingAnswers = {
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
  /** Checkbox ids from WORKFLOW_STEP_OPTIONS, before vocabulary is applied. */
  workflowStepIds: string[];
  /** Checkbox ids from AI_FEATURE_OPTIONS, before vocabulary is applied. */
  aiFeatureIds: string[];
  /** Configurable approval keys the firm switched on. */
  approvalKeys: string[];
};

export type FirmConfigurationPayload = {
  firmName: string;
  primaryPracticeArea: string;
  practiceAreas: string[];
  matterTypes: string[];
  enabledWorkflows: string[];
  aiFeatures: string[];
  approvals: Record<string, boolean>;
  language: string;
  timezone: string;
  currency: string;
};

/**
 * Applies the practice-area vocabulary to a set of checkbox ids.
 *
 * The user answered one question; two firms in different practice areas get
 * different keys out of it. Order follows the catalogue, not the order boxes
 * were ticked, so the same answers always produce the same configuration.
 */
function mapKeys(
  options: readonly { id: string; key: { default: string; byPracticeArea?: Record<string, string> } }[],
  selectedIds: readonly string[],
  primaryPracticeArea: string,
): string[] {
  const selected = new Set(selectedIds);
  return options
    .filter((option) => selected.has(option.id))
    .map((option) => resolveKey(option.key, primaryPracticeArea));
}

export function workflowKeysFor(selectedIds: readonly string[], primaryPracticeArea: string): string[] {
  return mapKeys(WORKFLOW_STEP_OPTIONS, selectedIds, primaryPracticeArea);
}

export function aiFeatureKeysFor(selectedIds: readonly string[], primaryPracticeArea: string): string[] {
  return mapKeys(AI_FEATURE_OPTIONS, selectedIds, primaryPracticeArea);
}

/**
 * Reverses the vocabulary mapping, so a saved draft can re-tick the right boxes.
 * The mapping is one-to-one within a practice area, which is what makes this
 * possible — a reason to keep it that way.
 */
export function workflowIdsFrom(keys: readonly string[], primaryPracticeArea: string): string[] {
  const stored = new Set(keys);
  return WORKFLOW_STEP_OPTIONS.filter((option) =>
    stored.has(resolveKey(option.key, primaryPracticeArea)),
  ).map((option) => option.id);
}

export function aiFeatureIdsFrom(keys: readonly string[], primaryPracticeArea: string): string[] {
  const stored = new Set(keys);
  return AI_FEATURE_OPTIONS.filter((option) =>
    stored.has(resolveKey(option.key, primaryPracticeArea)),
  ).map((option) => option.id);
}

/**
 * Builds the approvals map.
 *
 * Every locked rule is written in as required, whatever the firm chose — they
 * are not preferences, and storing them makes the guarantee auditable rather
 * than merely asserted in a comment. A firm's own choices are added on top.
 */
export function buildApprovals(selectedKeys: readonly string[]): Record<string, boolean> {
  const approvals: Record<string, boolean> = {};

  for (const locked of LOCKED_APPROVAL_OPTIONS) {
    approvals[locked.key] = true;
  }
  for (const option of CONFIGURABLE_APPROVAL_OPTIONS) {
    if (selectedKeys.includes(option.key)) {
      approvals[option.key] = true;
    }
  }

  return approvals;
}

export function buildConfiguration(answers: OnboardingAnswers): FirmConfigurationPayload {
  return {
    firmName: answers.firmName.trim(),
    primaryPracticeArea: answers.primaryPracticeArea,
    practiceAreas: answers.practiceAreas,
    matterTypes: answers.matterTypes,
    enabledWorkflows: workflowKeysFor(answers.workflowStepIds, answers.primaryPracticeArea),
    aiFeatures: aiFeatureKeysFor(answers.aiFeatureIds, answers.primaryPracticeArea),
    approvals: buildApprovals(answers.approvalKeys),
    language: answers.language,
    timezone: answers.timezone,
    currency: answers.currency,
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type StepValidation = { ok: true } | { ok: false; message: string };

export function validateStep(step: number, answers: Partial<OnboardingAnswers>): StepValidation {
  switch (step) {
    case 1: {
      if (!answers.firmName?.trim()) {
        return { ok: false, message: "Enter a firm name." };
      }
      if (!answers.contactName?.trim()) {
        return { ok: false, message: "Enter the name of the firm administrator." };
      }
      if (!answers.contactEmail?.trim() || !answers.contactEmail.includes("@")) {
        return { ok: false, message: "Enter a fictional email address." };
      }
      return { ok: true };
    }
    case 2: {
      const areas = answers.practiceAreas ?? [];
      if (areas.length === 0) {
        return { ok: false, message: "Select at least one practice area." };
      }
      if (!answers.primaryPracticeArea) {
        return { ok: false, message: "Choose which practice area is the firm's main one." };
      }
      if (!areas.includes(answers.primaryPracticeArea)) {
        return { ok: false, message: "The main practice area must be one you selected." };
      }
      if (!isPracticeAreaAvailable(answers.primaryPracticeArea)) {
        // Only immigration and employment ship a full template in this build.
        // Letting a firm finish onboarding into an empty template would be a
        // promise the product cannot keep.
        const label = PRACTICE_AREAS.find((a) => a.key === answers.primaryPracticeArea)?.label;
        return {
          ok: false,
          message: `${label ?? "Ce domaine de droit"} n’a pas encore de modèle. Choisissez Droit de l’immigration ou Droit du travail comme domaine principal.`,
        };
      }
      return { ok: true };
    }
    case 3: {
      if ((answers.matterTypes ?? []).length === 0) {
        return { ok: false, message: "Select at least one type of matter your firm handles." };
      }
      return { ok: true };
    }
    case 4: {
      if ((answers.workflowStepIds ?? []).length === 0) {
        return { ok: false, message: "Select at least one workflow step." };
      }
      return { ok: true };
    }
    case 5:
      // A firm is entitled to want no AI features at all. Orchelio is still a
      // matter management system without them.
      return { ok: true };
    case 6:
      // Every locked rule is already enforced, so an empty selection is valid.
      return { ok: true };
    default:
      return { ok: true };
  }
}

/** The answers that reproduce a demonstration firm, used by "Use sample data". */
export function sampleAnswersFor(practiceArea: string): Partial<OnboardingAnswers> {
  if (practiceArea === "employment_law") {
    return {
      matterTypes: ["unpaid_wages", "workplace_discrimination", "retaliation", "wrongful_termination"],
      workflowStepIds: ["lead_intake", "conflict_check", "initial_consultation", "document_collection"],
      aiFeatureIds: [
        "document_summary",
        "timeline",
        "missing_documents",
        "inconsistency_detection",
        "interview_questions",
      ],
      approvalKeys: ["sendEmail", "createDeadline", "legalAnalysis"],
    };
  }

  return {
    matterTypes: ["family_based", "employment_based", "naturalisation"],
    workflowStepIds: ["lead_intake", "conflict_check", "initial_consultation", "document_collection"],
    aiFeatureIds: [
      "document_summary",
      "timeline",
      "missing_documents",
      "inconsistency_detection",
      "consultation_questions",
    ],
    approvalKeys: ["sendEmail", "createDeadline", "modifyDeadline", "legalAnalysis"],
  };
}
