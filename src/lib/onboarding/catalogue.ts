/**
 * Orchelio — the onboarding questionnaire catalogue.
 *
 * Everything the questionnaire offers is declared here as data. Adding a
 * workflow step, an AI feature or an approval rule is an edit to this file, not
 * a change to any screen.
 *
 * ## Practice-area vocabulary
 *
 * The same question can mean different things to different firms, and the
 * specification asks Orchelio to adapt the *vocabulary* a firm sees and stores.
 * So a step or feature may carry a practice-area-specific key:
 *
 *   "Document collection"      → `document_collection` at an immigration firm
 *                              → `evidence_collection` at an employment firm
 *   "Create a factual timeline"→ `timeline` / `employment_timeline`
 *
 * The question put to the user is identical; the configuration it produces is
 * not. That is what makes the two configurations in the specification
 * reproducible from one questionnaire — see docs/ARCHITECTURE.md §5.
 */

import type { PracticeAreaKey } from "@/lib/practice-areas";

/** A key that varies by practice area, with a fallback used everywhere else. */
export type ScopedKey = {
  default: string;
  byPracticeArea?: Partial<Record<PracticeAreaKey, string>>;
};

export function resolveKey(key: ScopedKey, practiceArea: string): string {
  return key.byPracticeArea?.[practiceArea as PracticeAreaKey] ?? key.default;
}

// ---------------------------------------------------------------------------
// Step 1 — general information
// ---------------------------------------------------------------------------

export const LANGUAGES = [{ value: "en", label: "English" }] as const;

export const CURRENCIES = [
  { value: "USD", label: "US dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "Pound sterling (GBP)" },
] as const;

export const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
] as const;

export const JURISDICTIONS = [
  { value: "NY", label: "New York" },
  { value: "CA", label: "California" },
  { value: "TX", label: "Texas" },
  { value: "IL", label: "Illinois" },
  { value: "FL", label: "Florida" },
  { value: "MA", label: "Massachusetts" },
  { value: "OTHER", label: "Other / multiple" },
] as const;

// ---------------------------------------------------------------------------
// Step 4 — workflow steps
// ---------------------------------------------------------------------------

export type WorkflowStepOption = {
  /** Stable identity of the checkbox, independent of practice area. */
  id: string;
  label: string;
  description: string;
  key: ScopedKey;
};

/**
 * "Which steps are part of your normal workflow?"
 *
 * The fourteen steps from the specification, in the order a matter travels
 * through them, so the preview reads as a path rather than a list.
 */
export const WORKFLOW_STEP_OPTIONS: readonly WorkflowStepOption[] = [
  {
    id: "lead_intake",
    label: "Lead intake",
    description: "Record a prospective client and what they are asking for.",
    key: { default: "lead_intake" },
  },
  {
    id: "conflict_check",
    label: "Conflict check",
    description: "Check for a conflict of interest before taking the matter on.",
    key: { default: "conflict_check" },
  },
  {
    id: "initial_consultation",
    label: "Initial consultation",
    description: "Prepare for and hold the first meeting with the client.",
    key: {
      default: "consultation_preparation",
      byPracticeArea: { employment_law: "employment_case_assessment" },
    },
  },
  {
    id: "retainer_agreement",
    label: "Retainer agreement",
    description: "Agree the engagement and its terms.",
    key: { default: "retainer_agreement" },
  },
  {
    id: "document_collection",
    label: "Document collection",
    description: "Request and gather the documents the matter needs.",
    key: {
      default: "document_collection",
      byPracticeArea: { employment_law: "evidence_collection" },
    },
  },
  {
    id: "fact_investigation",
    label: "Fact investigation",
    description: "Establish what happened, and when.",
    key: { default: "fact_investigation" },
  },
  {
    id: "legal_research",
    label: "Legal research",
    description: "Research the law that applies. Always performed by a person.",
    key: { default: "legal_research" },
  },
  {
    id: "document_drafting",
    label: "Document drafting",
    description: "Prepare drafts for attorney review.",
    key: { default: "document_drafting" },
  },
  {
    id: "attorney_review",
    label: "Attorney review",
    description: "An attorney reviews the work before it goes anywhere.",
    key: { default: "attorney_review" },
  },
  {
    id: "client_approval",
    label: "Client approval",
    description: "The client confirms before the firm acts.",
    key: { default: "client_approval" },
  },
  {
    id: "negotiation",
    label: "Negotiation",
    description: "Discussions with the other side. Never automated.",
    key: { default: "negotiation" },
  },
  {
    id: "filing",
    label: "Filing",
    description: "Prepare a filing. Orchelio never submits one.",
    key: { default: "filing" },
  },
  {
    id: "billing",
    label: "Billing",
    description: "Record time and prepare an invoice.",
    key: { default: "billing" },
  },
  {
    id: "matter_closing",
    label: "Matter closing",
    description: "Close the matter and archive it.",
    key: { default: "matter_closing" },
  },
] as const;

// ---------------------------------------------------------------------------
// Step 5 — AI features
// ---------------------------------------------------------------------------

export type AiFeatureOption = {
  id: string;
  label: string;
  description: string;
  key: ScopedKey;
};

/** "How would you like Claude to assist your team?" */
export const AI_FEATURE_OPTIONS: readonly AiFeatureOption[] = [
  {
    id: "document_summary",
    label: "Résumer les documents",
    description: "Un résumé factuel de ce qu’un document contient.",
    key: { default: "document_summary" },
  },
  {
    id: "entity_extraction",
    label: "Extraire noms et dates",
    description: "Relever les personnes, organisations et dates mentionnées.",
    key: { default: "entity_extraction" },
  },
  {
    id: "timeline",
    label: "Établir une chronologie factuelle",
    description: "Ordonner les événements, avec la source de chaque date.",
    key: {
      default: "timeline",
      byPracticeArea: { employment_law: "employment_timeline" },
    },
  },
  {
    id: "missing_documents",
    label: "Repérer les documents manquants",
    description: "Lister ce qui est absent et pourquoi cela compte.",
    key: { default: "missing_documents" },
  },
  {
    id: "inconsistency_detection",
    label: "Détecter les incohérences",
    description: "Signaler les déclarations qui se contredisent.",
    key: { default: "inconsistency_detection" },
  },
  {
    id: "consultation_questions",
    label: "Préparer les questions de consultation",
    description: "Des questions à poser au client lors du premier rendez-vous.",
    key: { default: "consultation_questions" },
  },
  {
    id: "interview_questions",
    label: "Préparer les questions d’entretien",
    description: "Des questions pour l’entretien avec un client ou un témoin.",
    key: { default: "interview_questions" },
  },
  {
    id: "email_drafts",
    label: "Préparer des brouillons de courriel",
    description: "Des brouillons uniquement. Orchelio n’envoie jamais rien.",
    key: { default: "email_drafts" },
  },
  {
    id: "memo_drafts",
    label: "Préparer des projets de note",
    description: "Des notes internes à relire par un avocat.",
    key: { default: "memo_drafts" },
  },
  {
    id: "task_suggestions",
    label: "Suggérer des listes de tâches",
    description: "Proposer les prochaines étapes d’un dossier.",
    key: { default: "task_suggestions" },
  },
  {
    id: "closing_summaries",
    label: "Préparer des synthèses de clôture",
    description: "Résumer un dossier au moment de sa clôture.",
    key: { default: "closing_summaries" },
  },
  {
    id: "time_entries",
    label: "Suggérer des temps à facturer",
    description: "Proposer des temps depuis l’activité enregistrée.",
    key: { default: "time_entries" },
  },
  {
    id: "document_comparison",
    label: "Comparer deux documents",
    description: "Montrer ce qui diffère entre deux versions.",
    key: { default: "document_comparison" },
  },
  {
    id: "independent_review",
    label: "Relire une autre analyse d’IA",
    description: "Le relecteur vérifie le travail de l’analyste, indépendamment.",
    key: { default: "independent_review" },
  },
] as const;

// ---------------------------------------------------------------------------
// Step 6 — human approvals
// ---------------------------------------------------------------------------

export type ApprovalOption = {
  key: string;
  label: string;
  description: string;
};

/** Rules a firm chooses for itself. */
export const CONFIGURABLE_APPROVAL_OPTIONS: readonly ApprovalOption[] = [
  { key: "createMatter", label: "Create a matter", description: "Opening a new matter needs approval." },
  { key: "sendEmail", label: "Send an email", description: "A prepared draft needs approval before anyone uses it." },
  { key: "createDeadline", label: "Create a deadline", description: "A new deadline must be confirmed by a person." },
  { key: "modifyDeadline", label: "Change a deadline", description: "Moving a deadline must be confirmed by a person." },
  { key: "modifyClientRecord", label: "Modify a client record", description: "Changing client details needs approval." },
  { key: "legalAnalysis", label: "Generate legal analysis", description: "Any AI analysis must be approved before it is relied on." },
  { key: "shareDocument", label: "Share a document", description: "Sharing outside the firm needs approval." },
  { key: "prepareFiling", label: "Prepare a filing", description: "Preparing a filing needs approval." },
  { key: "closeMatter", label: "Close a matter", description: "Closing a matter needs approval." },
] as const;

/**
 * Rules that cannot be switched off, by anyone, from any screen.
 *
 * These are safety properties of the product rather than preferences. They are
 * shown with a padlock, always stored as required, and enforced on the server
 * regardless of what a firm configuration says.
 */
export const LOCKED_APPROVAL_OPTIONS: readonly ApprovalOption[] = [
  { key: "fileSubmission", label: "Submit a filing", description: "Orchelio never submits a filing. A person does." },
  { key: "permanentDeletion", label: "Delete a document", description: "Nothing is ever permanently deleted automatically." },
  { key: "settlementCommunication", label: "Send a settlement proposal", description: "Never sent automatically." },
  { key: "opposingCounselCommunication", label: "Communicate with opposing counsel", description: "Never without explicit human approval." },
  { key: "legalAdviceDelivery", label: "Deliver legal advice", description: "No legal advice is ever sent automatically." },
  { key: "deadlineConfirmation", label: "Confirm a deadline as final", description: "No deadline is final without a person confirming it." },
  { key: "externalTransmission", label: "Send anything outside the firm", description: "Orchelio has no send capability at all." },
  { key: "eligibilityConclusion", label: "Conclude on eligibility or entitlement", description: "Never decided by the AI." },
  { key: "conflictClearance", label: "Clear a conflict of interest", description: "Never cleared automatically." },
] as const;
