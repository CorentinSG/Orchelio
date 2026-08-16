import { describe, expect, it } from "vitest";

import {
  type OnboardingAnswers,
  aiFeatureIdsFrom,
  aiFeatureKeysFor,
  buildApprovals,
  buildConfiguration,
  sampleAnswersFor,
  validateStep,
  workflowIdsFrom,
  workflowKeysFor,
} from "@/lib/onboarding/config";
import { LOCKED_APPROVAL_OPTIONS } from "@/lib/onboarding/catalogue";

/**
 * The acceptance criterion for this phase: answering the questionnaire must
 * reproduce the two configurations printed in the specification. These tests
 * assert that literally, against the published JSON.
 */

const BASE: Omit<
  OnboardingAnswers,
  "firmName" | "primaryPracticeArea" | "practiceAreas" | "matterTypes" | "aiFeatureIds" | "approvalKeys"
> = {
  contactName: "Demo Administrator",
  contactEmail: "admin@demo.local",
  userCount: 6,
  jurisdiction: "NY",
  language: "en",
  currency: "USD",
  timezone: "America/New_York",
  workflowStepIds: ["lead_intake", "conflict_check", "initial_consultation", "document_collection"],
};

describe("Dupont & Associés — the specification's configuration", () => {
  const configuration = buildConfiguration({
    ...BASE,
    firmName: "Dupont & Associés",
    primaryPracticeArea: "immigration",
    practiceAreas: ["immigration"],
    matterTypes: ["family_based", "employment_based", "naturalisation"],
    aiFeatureIds: [
      "document_summary",
      "timeline",
      "missing_documents",
      "inconsistency_detection",
      "consultation_questions",
    ],
    approvalKeys: ["sendEmail", "createDeadline", "modifyDeadline", "legalAnalysis"],
  });

  it("produces the published firm name, area and matter types", () => {
    expect(configuration.firmName).toBe("Dupont & Associés");
    expect(configuration.primaryPracticeArea).toBe("immigration");
    expect(configuration.practiceAreas).toEqual(["immigration"]);
    expect(configuration.matterTypes).toEqual([
      "family_based",
      "employment_based",
      "naturalisation",
    ]);
  });

  it("produces the published workflows", () => {
    expect(configuration.enabledWorkflows).toEqual([
      "lead_intake",
      "conflict_check",
      "consultation_preparation",
      "document_collection",
    ]);
  });

  it("produces the published AI features", () => {
    expect(configuration.aiFeatures).toEqual([
      "document_summary",
      "timeline",
      "missing_documents",
      "inconsistency_detection",
      "consultation_questions",
    ]);
  });

  it("produces the published approvals", () => {
    // The published example lists a subset; every one of its entries must be
    // present and required. Locked rules are additionally always present.
    for (const key of ["sendEmail", "createDeadline", "modifyDeadline", "legalAnalysis", "fileSubmission"]) {
      expect(configuration.approvals[key]).toBe(true);
    }
  });

  it("produces the published locale settings", () => {
    expect(configuration.language).toBe("en");
    expect(configuration.timezone).toBe("America/New_York");
    expect(configuration.currency).toBe("USD");
  });
});

describe("Cabinet Carter — the specification's configuration", () => {
  const configuration = buildConfiguration({
    ...BASE,
    firmName: "Cabinet Carter",
    primaryPracticeArea: "employment_law",
    practiceAreas: ["employment_law"],
    matterTypes: [
      "unpaid_wages",
      "workplace_discrimination",
      "retaliation",
      "wrongful_termination",
    ],
    aiFeatureIds: [
      "document_summary",
      "timeline",
      "missing_documents",
      "inconsistency_detection",
      "interview_questions",
    ],
    approvalKeys: ["sendEmail", "createDeadline", "legalAnalysis"],
  });

  it("produces the published matter types", () => {
    expect(configuration.matterTypes).toEqual([
      "unpaid_wages",
      "workplace_discrimination",
      "retaliation",
      "wrongful_termination",
    ]);
  });

  it("produces the published workflows, in employment vocabulary", () => {
    expect(configuration.enabledWorkflows).toEqual([
      "lead_intake",
      "conflict_check",
      "employment_case_assessment",
      "evidence_collection",
    ]);
  });

  it("produces the published AI features, in employment vocabulary", () => {
    expect(configuration.aiFeatures).toEqual([
      "document_summary",
      "employment_timeline",
      "missing_documents",
      "inconsistency_detection",
      "interview_questions",
    ]);
  });

  it("produces the published approvals", () => {
    for (const key of [
      "sendEmail",
      "createDeadline",
      "legalAnalysis",
      "settlementCommunication",
      "opposingCounselCommunication",
    ]) {
      expect(configuration.approvals[key]).toBe(true);
    }
  });
});

/**
 * The same answers, two firms, two configurations. This is the product's whole
 * claim, expressed as one assertion.
 */
describe("practice-area vocabulary", () => {
  const answers = ["lead_intake", "conflict_check", "initial_consultation", "document_collection"];

  it("gives identical answers different meanings per practice area", () => {
    expect(workflowKeysFor(answers, "immigration")).toEqual([
      "lead_intake",
      "conflict_check",
      "consultation_preparation",
      "document_collection",
    ]);
    expect(workflowKeysFor(answers, "employment_law")).toEqual([
      "lead_intake",
      "conflict_check",
      "employment_case_assessment",
      "evidence_collection",
    ]);
  });

  it("falls back to the default key for a practice area with no vocabulary of its own", () => {
    expect(workflowKeysFor(["initial_consultation"], "family_law")).toEqual([
      "consultation_preparation",
    ]);
  });

  it("orders keys by the catalogue, not by the order boxes were ticked", () => {
    const shuffled = ["document_collection", "lead_intake", "initial_consultation", "conflict_check"];

    expect(workflowKeysFor(shuffled, "immigration")).toEqual(
      workflowKeysFor(answers, "immigration"),
    );
  });

  it("round-trips, so a saved draft re-ticks the right boxes", () => {
    for (const area of ["immigration", "employment_law"]) {
      expect(workflowIdsFrom(workflowKeysFor(answers, area), area).sort()).toEqual([...answers].sort());
    }

    const features = ["document_summary", "timeline", "interview_questions"];
    for (const area of ["immigration", "employment_law"]) {
      expect(aiFeatureIdsFrom(aiFeatureKeysFor(features, area), area).sort()).toEqual(
        [...features].sort(),
      );
    }
  });
});

describe("locked approvals", () => {
  it("are always required, whatever the firm chose", () => {
    const approvals = buildApprovals([]);

    for (const locked of LOCKED_APPROVAL_OPTIONS) {
      expect(approvals[locked.key]).toBe(true);
    }
  });

  it("cannot be switched off by omitting them", () => {
    const approvals = buildApprovals(["sendEmail"]);

    expect(approvals["fileSubmission"]).toBe(true);
    expect(approvals["opposingCounselCommunication"]).toBe(true);
    expect(approvals["permanentDeletion"]).toBe(true);
  });

  it("ignores an unknown approval key rather than storing it", () => {
    const approvals = buildApprovals(["sendEmail", "deleteEverythingSilently"]);

    expect(approvals["deleteEverythingSilently"]).toBeUndefined();
    expect(approvals["sendEmail"]).toBe(true);
  });
});

describe("step validation", () => {
  it("requires a firm name, an administrator and an email", () => {
    expect(validateStep(1, {}).ok).toBe(false);
    expect(validateStep(1, { firmName: "A Firm" }).ok).toBe(false);
    expect(validateStep(1, { firmName: "A Firm", contactName: "Someone" }).ok).toBe(false);
    expect(
      validateStep(1, { firmName: "A Firm", contactName: "Someone", contactEmail: "a@demo.local" }).ok,
    ).toBe(true);
  });

  it("requires the main practice area to be one that was selected", () => {
    const result = validateStep(2, {
      practiceAreas: ["immigration"],
      primaryPracticeArea: "family_law",
    });

    expect(result.ok).toBe(false);
  });

  it("refuses to finish onboarding into a practice area with no template", () => {
    // Letting a firm complete onboarding into an empty template would be a
    // promise the product cannot keep.
    const result = validateStep(2, {
      practiceAreas: ["family_law"],
      primaryPracticeArea: "family_law",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Droit de la famille");
    }
  });

  it("requires at least one matter type and one workflow step", () => {
    expect(validateStep(3, { matterTypes: [] }).ok).toBe(false);
    expect(validateStep(3, { matterTypes: ["family_based"] }).ok).toBe(true);
    expect(validateStep(4, { workflowStepIds: [] }).ok).toBe(false);
    expect(validateStep(4, { workflowStepIds: ["lead_intake"] }).ok).toBe(true);
  });

  it("allows a firm to enable no AI features at all", () => {
    // Orchelio is still a matter management system without them.
    expect(validateStep(5, { aiFeatureIds: [] }).ok).toBe(true);
    expect(validateStep(6, { approvalKeys: [] }).ok).toBe(true);
  });
});

describe("sample data", () => {
  it("offers answers that reproduce each demonstration firm", () => {
    expect(sampleAnswersFor("immigration").matterTypes).toContain("family_based");
    expect(sampleAnswersFor("employment_law").matterTypes).toContain("unpaid_wages");
    expect(sampleAnswersFor("employment_law").aiFeatureIds).toContain("interview_questions");
  });
});
