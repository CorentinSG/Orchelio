import "server-only";

import { prisma } from "@/lib/prisma";
import type { FirmScope } from "@/lib/data/scope";
import { usageSummary } from "@/lib/data/usage";
import {
  IDENTITY_CATEGORIES,
  WAGE_CATEGORIES,
  expectedButMissing,
} from "@/lib/matters/documents";
import { parseJsonObject } from "@/lib/json-field";

/** Matter types whose subject is discrimination or retaliation. */
const DISCRIMINATION_TYPES: readonly string[] = [
  "workplace_discrimination",
  "retaliation",
  "workplace_harassment",
];

/**
 * Orchelio — firm statistics.
 *
 * These are the numbers the dashboard puts in large type, which makes them the
 * numbers a user trusts without checking. Every one is counted within a single
 * firm.
 */

export type FirmStatistics = {
  matters: number;
  openMatters: number;
  documents: number;
  analyses: number;
  pendingApprovals: number;
  openTasks: number;
  clients: number;
  usageCostCents: number;
};

export async function firmStatistics(scope: FirmScope): Promise<FirmStatistics> {
  const where = { firmId: scope.firmId };

  const [matters, openMatters, documents, analyses, pendingApprovals, openTasks, clients, usage] =
    await Promise.all([
      prisma.matter.count({ where }),
      prisma.matter.count({ where: { ...where, closedAt: null } }),
      prisma.document.count({ where }),
      prisma.aIAnalysis.count({ where }),
      prisma.approvalRequest.count({ where: { ...where, status: "pending" } }),
      prisma.task.count({ where: { ...where, status: { in: ["open", "in_progress"] } } }),
      prisma.clientProfile.count({ where }),
      usageSummary(scope),
    ]);

  return {
    matters,
    openMatters,
    documents,
    analyses,
    pendingApprovals,
    openTasks,
    clients,
    usageCostCents: usage.costCents,
  };
}

/**
 * The counts behind the practice-area widgets.
 *
 * Returned as a map keyed by widget so the dashboard reads one number per card
 * without knowing how any of them is derived. A key that is absent means the
 * figure is not known — the widget then shows a dash, which is the honest
 * answer, and never a zero.
 *
 * Everything here comes from matters and documents. Nothing is inferred and
 * nothing is scored: "missing" is a set difference against the checklist in
 * `src/lib/matters/documents.ts`, not an opinion about the matter.
 */
export async function practiceAreaCounts(
  scope: FirmScope,
  primaryPracticeArea: string,
  now: Date,
): Promise<Record<string, number>> {
  const where = { firmId: scope.firmId };

  // One read of the matters with just their documents' categories: the
  // checklist needs the categories present, not the documents themselves.
  const [matters, intakes, unreviewedTerminationLetters, tokens, pendingApprovals] =
    await Promise.all([
    prisma.matter.findMany({
      where,
      select: {
        status: true,
        matterTypeKey: true,
        practiceAreaKey: true,
        representationSide: true,
        nextDeadlineAt: true,
        closedAt: true,
        aiStatus: true,
        fields: true,
        documents: { select: { category: true } },
      },
    }),
    prisma.intakeResponse.count({ where }),
    prisma.document.count({
      where: { ...where, category: "termination_letter", verified: false },
    }),
    prisma.usageRecord.aggregate({ where, _sum: { inputTokens: true, outputTokens: true } }),
    prisma.approvalRequest.findMany({
      where: { ...where, status: "pending" },
      select: { action: true, matterId: true },
    }),
  ]);

  const open = matters.filter((matter) => matter.closedAt === null);
  const withStatus = (status: string) => open.filter((matter) => matter.status === status).length;

  const missingFrom = (categories: readonly string[]) =>
    open.filter((matter) => {
      const present = matter.documents.map((document) => document.category);
      const missing = expectedButMissing(matter.practiceAreaKey, matter.matterTypeKey, present);
      return missing.some((category) => categories.includes(category.key));
    }).length;

  const missingOutside = (categories: readonly string[]) =>
    open.filter((matter) => {
      const present = matter.documents.map((document) => document.category);
      const missing = expectedButMissing(matter.practiceAreaKey, matter.matterTypeKey, present);
      return missing.some((category) => !categories.includes(category.key));
    }).length;

  const withinDays = (days: number) =>
    open.filter((matter) => {
      if (!matter.nextDeadlineAt) return false;
      const difference = matter.nextDeadlineAt.getTime() - now.getTime();
      return difference >= 0 && difference <= days * 86_400_000;
    }).length;

  // Counts every practice area shows. Tokens rather than cost, because the
  // cost tile beside it already shows money and two money figures invite the
  // reader to add them up.
  const shared = {
    monthly_usage: (tokens._sum.inputTokens ?? 0) + (tokens._sum.outputTokens ?? 0),
  };

  // Matters whose latest analysis nobody has decided on yet. Counted from the
  // approval rows rather than a flag on the analysis, because the approval is
  // the record of who took responsibility. See src/lib/data/approvals.ts.
  const awaitingApproval = new Set(
    pendingApprovals
      .filter((approval) => approval.action === "legal_analysis" && approval.matterId !== null)
      .map((approval) => approval.matterId as string),
  ).size;

  if (primaryPracticeArea === "immigration") {
    // A status expiring soon is read from what the firm recorded at intake. It
    // is a date somebody typed, not a date Orchelio has confirmed — which is
    // why the widget says "to review" rather than naming a deadline.
    const expiringWithin = (days: number) =>
      open.filter((matter) => {
        const recorded = parseJsonObject(matter.fields)["status_expiration_date"];
        if (typeof recorded !== "string") return false;
        const date = new Date(recorded);
        if (Number.isNaN(date.getTime())) return false;
        const difference = date.getTime() - now.getTime();
        return difference >= 0 && difference <= days * 86_400_000;
      }).length;

    return {
      new_leads: withStatus("lead"),
      consultations_to_prepare: withStatus("consultation_scheduled"),
      status_dates_to_review: expiringWithin(90),
      missing_identity_documents: missingFrom(IDENTITY_CATEGORIES),
      missing_immigration_documents: missingOutside(IDENTITY_CATEGORIES),
      upcoming_deadlines: withinDays(30),
      awaiting_attorney_approval: awaitingApproval,
      ...shared,
    };
  }

  if (primaryPracticeArea === "employment_law") {
    return {
      new_employee_intakes: intakes,
      employee_side_matters: open.filter((matter) => matter.representationSide === "employee")
        .length,
      employer_side_matters: open.filter((matter) => matter.representationSide === "employer")
        .length,
      termination_letters_to_review: unreviewedTerminationLetters,
      wage_records_missing: missingFrom(WAGE_CATEGORIES),
      settlement_deadlines: open.filter(
        (matter) => matter.status === "settlement_discussions" && matter.nextDeadlineAt !== null,
      ).length,
      // "Not yet analysed" is a fact about the matter's own aiStatus, not a
      // judgement about the claim.
      discrimination_awaiting_assessment: open.filter(
        (matter) =>
          DISCRIMINATION_TYPES.includes(matter.matterTypeKey) && matter.aiStatus === "none",
      ).length,
      ...shared,
    };
  }

  return shared;
}
