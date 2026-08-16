import {
  CONFIGURABLE_APPROVALS,
  LOCKED_APPROVALS,
  type LockedApproval,
  type RiskLevel,
} from "@/lib/constants";

/**
 * Orchelio — the actions a person must decide.
 *
 * This module is the bridge between two lists that until now had nothing
 * joining them: the approval rules a firm switches on during onboarding, and
 * the things the product actually does. Each entry below names one action, the
 * rule that governs it, and — importantly — what approving it will cause.
 *
 * ## Locked beats configured, always
 *
 * An action governed by a locked rule creates an approval request whatever the
 * firm's configuration says. `requiresApproval` reads the lock first and never
 * consults the configuration for those, so there is no ordering of checks and
 * no combination of settings that can produce a different answer. Nine rules
 * cannot be switched off; this is the place that is made true rather than
 * asserted.
 *
 * ## What "approved" means
 *
 * For two of these, approving *does* something: a matter closes, a draft
 * becomes usable. For the other two, the approval record itself is the state —
 * there is no second flag saying "this analysis was approved", because two
 * places holding the same answer is two places that can disagree. The approval
 * row carries who decided, when, and with what note, and that row is the
 * answer.
 */

export type ApprovableAction = {
  /** Stored in `ApprovalRequest.action`. Stable: a log from two years ago must still read. */
  key: string;
  label: string;
  /** The kind of thing being decided, stored in `ApprovalRequest.resourceType`. */
  resourceType: string;
  riskLevel: RiskLevel;
  /**
   * The locked rule that governs this, if any. A locked action always requires
   * a decision.
   */
  lockedBy: LockedApproval | null;
  /**
   * The configurable rule that governs this, if any. Consulted only when the
   * action is not locked.
   */
  configurableBy: string | null;
  /** What the person is being asked. Written as a question, in plain words. */
  question: string;
  /** What approving will cause. Shown before deciding, not after. */
  effect: string;
};

export const APPROVABLE_ACTIONS: readonly ApprovableAction[] = [
  {
    key: "legal_analysis",
    label: "S’appuyer sur une analyse d’IA",
    resourceType: "ai_analysis",
    riskLevel: "high",
    lockedBy: null,
    configurableBy: "legalAnalysis",
    question:
      "Un avocat a-t-il lu cette analyse et s’est-il assuré qu’elle n’affirme pas plus que ce que le dossier permet ?",
    effect:
      "L’analyse est enregistrée comme lue et validée par vous. Rien n’y change — une validation est la déclaration qu’une personne en prend la responsabilité, pas une modification.",
  },
  {
    key: "external_transmission",
    label: "Valider un brouillon pour usage hors du cabinet",
    resourceType: "draft_communication",
    riskLevel: "high",
    lockedBy: "externalTransmission",
    configurableBy: null,
    question: "Avez-vous lu ces mots exacts, et acceptez-vous qu’ils quittent le cabinet ?",
    effect:
      "Le brouillon est marqué validé pour usage : quelqu’un peut le copier. Orchelio n’envoie toujours rien — il n’y a aucun transport dans ce produit, et aucun statut au-delà de celui-ci.",
  },
  {
    key: "deadline_confirmation",
    label: "Confirmer une date enregistrée",
    resourceType: "matter",
    riskLevel: "high",
    lockedBy: "deadlineConfirmation",
    configurableBy: null,
    question:
      "Avez-vous vérifié cette date contre l’avis, la règle ou l’acte d’origine, plutôt que contre ce qui a été saisi ici ?",
    effect:
      "La date est enregistrée comme confirmée par vous, à la date du jour. Orchelio ne calcule ni ne confirme jamais une date lui-même : cet enregistrement est la seule chose qui la rende confirmée.",
  },
  {
    key: "close_matter",
    label: "Clore un dossier",
    resourceType: "matter",
    riskLevel: "medium",
    lockedBy: null,
    configurableBy: "closeMatter",
    question: "Tout est-il terminé sur ce dossier, et le laissez-vous dans l’état où vous voulez qu’il reste ?",
    effect: "Le dossier est marqué clos et cesse d’apparaître dans les comptes de dossiers ouverts.",
  },
] as const;

export function approvableAction(key: string): ApprovableAction | undefined {
  return APPROVABLE_ACTIONS.find((action) => action.key === key);
}

export function actionLabel(key: string): string {
  return approvableAction(key)?.label ?? key.split("_").join(" ");
}

/**
 * Does this action need a human decision at this firm?
 *
 * The lock is checked first and short-circuits. Nothing a firm can configure
 * reaches the second half of this function for a locked action.
 */
export function requiresApproval(
  action: ApprovableAction,
  firmApprovals: Readonly<Record<string, unknown>>,
): boolean {
  if (action.lockedBy) return true;
  if (!action.configurableBy) return false;
  return firmApprovals[action.configurableBy] === true;
}

/** Why this action needs a decision — a lock, a firm's choice, or not at all. */
export function approvalReason(
  action: ApprovableAction,
  firmApprovals: Readonly<Record<string, unknown>>,
): "locked" | "configured" | "not_required" {
  if (action.lockedBy) return "locked";
  if (action.configurableBy && firmApprovals[action.configurableBy] === true) return "configured";
  return "not_required";
}

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

export const APPROVAL_DECISIONS = [
  "approved",
  "approved_with_edits",
  "new_analysis_requested",
  "rejected",
] as const;
export type ApprovalDecision = (typeof APPROVAL_DECISIONS)[number];

/**
 * Decisions that cannot be recorded without the decider saying why.
 *
 * Three of the four. A plain approval needs no note — the decision is the
 * whole message. The other three each leave somebody with work to do, and a
 * bare "rejected" tells them nothing about what to change.
 */
export const DECISIONS_REQUIRING_NOTE: readonly ApprovalDecision[] = [
  "approved_with_edits",
  "new_analysis_requested",
  "rejected",
];

export function requiresNote(decision: ApprovalDecision): boolean {
  return DECISIONS_REQUIRING_NOTE.includes(decision);
}

export function isApprovalDecision(value: string): value is ApprovalDecision {
  return (APPROVAL_DECISIONS as readonly string[]).includes(value);
}

export function decisionLabel(decision: string): string {
  switch (decision) {
    case "approved":
      return "Validée";
    case "approved_with_edits":
      return "Validée avec modifications";
    case "new_analysis_requested":
      return "Nouvelle analyse demandée";
    case "rejected":
      return "Refusée";
    case "pending":
      return "En attente d’une décision";
    default:
      return decision.split("_").join(" ");
  }
}

/** Whether a decision lets the underlying action take effect. */
export function decisionApproves(decision: ApprovalDecision): boolean {
  return decision === "approved" || decision === "approved_with_edits";
}

// ---------------------------------------------------------------------------

/**
 * Every configurable rule that no action yet implements.
 *
 * Kept honest rather than hidden: a firm that switched on "Share a document"
 * during onboarding should be able to find out that nothing in this build
 * raises that approval, instead of assuming it is protecting them.
 */
export function rulesWithoutActions(): { configurable: string[]; locked: string[] } {
  const covered = new Set(
    APPROVABLE_ACTIONS.flatMap((action) =>
      [action.lockedBy, action.configurableBy].filter((rule): rule is string => rule !== null),
    ),
  );

  return {
    configurable: CONFIGURABLE_APPROVALS.filter((rule) => !covered.has(rule)),
    locked: LOCKED_APPROVALS.filter((rule) => !covered.has(rule)),
  };
}
