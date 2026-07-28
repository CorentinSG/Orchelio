/**
 * Orchelio — allowed values for the enum-like columns.
 *
 * SQLite has no native enums, so the database stores plain strings and this
 * module is the single source of truth for what those strings may be. Every
 * write path validates against these lists.
 *
 * On PostgreSQL these become real database enums; this file stays as the
 * TypeScript view of them.
 */

// --- Identity -------------------------------------------------------------

export const USER_STATUSES = ["active", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const FIRM_STATUSES = ["onboarding", "active", "suspended"] as const;
export type FirmStatus = (typeof FIRM_STATUSES)[number];

export const MEMBERSHIP_STATUSES = ["active", "suspended"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

// --- Matters --------------------------------------------------------------

/** Statuses every practice area shares. */
export const GENERIC_MATTER_STATUSES = [
  "lead",
  "conflict_review",
  "consultation_scheduled",
  "documents_requested",
  "active",
  "attorney_review",
  "waiting_for_client",
  "negotiation",
  "ready_for_filing",
  "closed",
] as const;

/** Additional statuses used by employment and labor matters. */
export const EMPLOYMENT_MATTER_STATUSES = [
  "internal_investigation",
  "demand_preparation",
  "eeoc_review",
  "agency_charge",
  "settlement_discussions",
  "litigation_assessment",
  "employer_response_pending",
] as const;

export const MATTER_STATUSES = [
  ...GENERIC_MATTER_STATUSES,
  ...EMPLOYMENT_MATTER_STATUSES,
] as const;
export type MatterStatus = (typeof MATTER_STATUSES)[number];

export const REPRESENTATION_SIDES = ["employee", "employer"] as const;
export type RepresentationSide = (typeof REPRESENTATION_SIDES)[number];

export const AI_STATUSES = ["none", "running", "completed", "failed"] as const;
export type AiStatus = (typeof AI_STATUSES)[number];

// --- Documents ------------------------------------------------------------

/** Upload allow-list. Nothing outside this list is accepted. */
export const ALLOWED_DOCUMENT_EXTENSIONS = ["pdf", "docx", "png", "jpg", "jpeg"] as const;

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
] as const;

/** 10 MB. Simulated uploads in the demonstration, but the limit is real. */
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

export const DOCUMENT_ANALYSIS_STATUSES = ["pending", "classified", "analysed"] as const;

// --- Approvals ------------------------------------------------------------

export const APPROVAL_DECISIONS = [
  "approved",
  "approved_with_edits",
  "rejected",
  "new_analysis_requested",
] as const;
export type ApprovalDecision = (typeof APPROVAL_DECISIONS)[number];

/** Decisions that cannot be recorded without a written note. */
export const DECISIONS_REQUIRING_NOTE = [
  "approved_with_edits",
  "rejected",
  "new_analysis_requested",
] as const;

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/**
 * Approval rules a firm may switch on or off during onboarding.
 */
export const CONFIGURABLE_APPROVALS = [
  "createMatter",
  "sendEmail",
  "createDeadline",
  "modifyDeadline",
  "modifyClientRecord",
  "legalAnalysis",
  "shareDocument",
  "prepareFiling",
  "closeMatter",
] as const;

/**
 * Approval rules that are always enforced and cannot be switched off from any
 * screen. These are safety properties of the product, not preferences.
 * The interface shows them with a padlock; the server enforces them regardless
 * of what a firm configuration says.
 */
export const LOCKED_APPROVALS = [
  "fileSubmission",
  "legalAdviceDelivery",
  "permanentDeletion",
  "deadlineConfirmation",
  "externalTransmission",
  "eligibilityConclusion",
  "conflictClearance",
  "settlementCommunication",
  "opposingCounselCommunication",
] as const;
export type LockedApproval = (typeof LOCKED_APPROVALS)[number];

export function isLockedApproval(key: string): key is LockedApproval {
  return (LOCKED_APPROVALS as readonly string[]).includes(key);
}

// --- Audit ----------------------------------------------------------------

export const AUDIT_STATUSES = ["success", "failure", "denied"] as const;
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

/**
 * Action names recorded in the activity log. Dotted and stable: a screen may
 * change, a log entry from two years ago must still be readable.
 */
export const AUDIT_ACTIONS = {
  loginSucceeded: "auth.login.succeeded",
  loginFailed: "auth.login.failed",
  loginThrottled: "auth.login.throttled",
  logout: "auth.logout",
  accessDenied: "access.denied",
  firmCreated: "firm.created",
  firmViewed: "firm.viewed",
  firmSwitched: "firm.switched",
  firmConfigurationUpdated: "firm.configuration.updated",
  matterCreated: "matter.created",
  matterViewed: "matter.viewed",
  documentAdded: "document.added",
  analysisStarted: "ai.analysis.started",
  analysisCompleted: "ai.analysis.completed",
  reviewCompleted: "ai.review.completed",
  approvalRequested: "approval.requested",
  approvalDecided: "approval.decided",
  draftPrepared: "communication.draft.prepared",
  matterClosed: "matter.closed",
  roleChanged: "membership.role.changed",
  deadlineChanged: "matter.deadline.changed",
  communicationPrepared: "communication.prepared",
  demoSeeded: "demo.seeded",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
