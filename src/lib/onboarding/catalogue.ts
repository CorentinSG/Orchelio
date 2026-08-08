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

export const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
] as const;

export const CURRENCIES = [
  { value: "EUR", label: "Euro (EUR)" },
  { value: "USD", label: "Dollar américain (USD)" },
  { value: "GBP", label: "Livre sterling (GBP)" },
] as const;

export const TIMEZONES = [
  { value: "Europe/Paris", label: "Paris (France)" },
  { value: "America/New_York", label: "Est (New York)" },
  { value: "America/Chicago", label: "Centre (Chicago)" },
  { value: "America/Denver", label: "Montagnes (Denver)" },
  { value: "America/Los_Angeles", label: "Pacifique (Los Angeles)" },
] as const;

export const JURISDICTIONS = [
  { value: "NY", label: "New York" },
  { value: "CA", label: "Californie" },
  { value: "TX", label: "Texas" },
  { value: "IL", label: "Illinois" },
  { value: "FL", label: "Floride" },
  { value: "MA", label: "Massachusetts" },
  { value: "OTHER", label: "Autre / plusieurs" },
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
    label: "Premier contact",
    description: "Enregistrer un client potentiel et sa demande.",
    key: { default: "lead_intake" },
  },
  {
    id: "conflict_check",
    label: "Vérification des conflits",
    description: "Vérifier l’absence de conflit d’intérêts avant d’accepter le dossier.",
    key: { default: "conflict_check" },
  },
  {
    id: "initial_consultation",
    label: "Première consultation",
    description: "Préparer et tenir le premier rendez-vous avec le client.",
    key: {
      default: "consultation_preparation",
      byPracticeArea: { employment_law: "employment_case_assessment" },
    },
  },
  {
    id: "retainer_agreement",
    label: "Convention d’honoraires",
    description: "Convenir de la mission et de ses conditions.",
    key: { default: "retainer_agreement" },
  },
  {
    id: "document_collection",
    label: "Collecte des documents",
    description: "Demander et rassembler les documents nécessaires au dossier.",
    key: {
      default: "document_collection",
      byPracticeArea: { employment_law: "evidence_collection" },
    },
  },
  {
    id: "fact_investigation",
    label: "Établissement des faits",
    description: "Établir ce qui s’est passé, et quand.",
    key: { default: "fact_investigation" },
  },
  {
    id: "legal_research",
    label: "Recherche juridique",
    description: "Rechercher le droit applicable. Toujours effectuée par une personne.",
    key: { default: "legal_research" },
  },
  {
    id: "document_drafting",
    label: "Rédaction d’actes",
    description: "Préparer des projets à relire par un avocat.",
    key: { default: "document_drafting" },
  },
  {
    id: "attorney_review",
    label: "Relecture par un avocat",
    description: "Un avocat relit le travail avant qu’il n’aille où que ce soit.",
    key: { default: "attorney_review" },
  },
  {
    id: "client_approval",
    label: "Accord du client",
    description: "Le client confirme avant que le cabinet agisse.",
    key: { default: "client_approval" },
  },
  {
    id: "negotiation",
    label: "Négociation",
    description: "Les échanges avec la partie adverse. Jamais automatisés.",
    key: { default: "negotiation" },
  },
  {
    id: "filing",
    label: "Dépôt",
    description: "Préparer un dépôt. Orchelio n’en soumet jamais un.",
    key: { default: "filing" },
  },
  {
    id: "billing",
    label: "Facturation",
    description: "Enregistrer les temps et préparer une facture.",
    key: { default: "billing" },
  },
  {
    id: "matter_closing",
    label: "Clôture du dossier",
    description: "Clore le dossier et l’archiver.",
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
  { key: "createMatter", label: "Créer un dossier", description: "L’ouverture d’un nouveau dossier requiert une validation." },
  { key: "sendEmail", label: "Envoyer un courriel", description: "Un brouillon préparé doit être validé avant que quiconque l’utilise." },
  { key: "createDeadline", label: "Créer une échéance", description: "Une nouvelle échéance doit être confirmée par une personne." },
  { key: "modifyDeadline", label: "Modifier une échéance", description: "Déplacer une échéance doit être confirmé par une personne." },
  { key: "modifyClientRecord", label: "Modifier une fiche client", description: "Changer les informations d’un client requiert une validation." },
  { key: "legalAnalysis", label: "Produire une analyse juridique", description: "Toute analyse d’IA doit être validée avant qu’on s’y fie." },
  { key: "shareDocument", label: "Partager un document", description: "Partager hors du cabinet requiert une validation." },
  { key: "prepareFiling", label: "Préparer un dépôt", description: "Préparer un dépôt requiert une validation." },
  { key: "closeMatter", label: "Clore un dossier", description: "Clore un dossier requiert une validation." },
] as const;

/**
 * Rules that cannot be switched off, by anyone, from any screen.
 *
 * These are safety properties of the product rather than preferences. They are
 * shown with a padlock, always stored as required, and enforced on the server
 * regardless of what a firm configuration says.
 */
export const LOCKED_APPROVAL_OPTIONS: readonly ApprovalOption[] = [
  { key: "fileSubmission", label: "Soumettre un dépôt", description: "Orchelio ne soumet jamais un dépôt. Une personne le fait." },
  { key: "permanentDeletion", label: "Supprimer un document", description: "Rien n’est jamais supprimé définitivement de façon automatique." },
  { key: "settlementCommunication", label: "Envoyer une proposition transactionnelle", description: "Jamais envoyée automatiquement." },
  { key: "opposingCounselCommunication", label: "Communiquer avec l’avocat adverse", description: "Jamais sans validation humaine explicite." },
  { key: "legalAdviceDelivery", label: "Délivrer un conseil juridique", description: "Aucun conseil juridique n’est jamais envoyé automatiquement." },
  { key: "deadlineConfirmation", label: "Confirmer une échéance comme définitive", description: "Aucune échéance n’est définitive sans qu’une personne la confirme." },
  { key: "externalTransmission", label: "Envoyer quoi que ce soit hors du cabinet", description: "Orchelio n’a aucune capacité d’envoi." },
  { key: "eligibilityConclusion", label: "Conclure sur une éligibilité ou un droit", description: "Jamais décidé par l’IA." },
  { key: "conflictClearance", label: "Lever un conflit d’intérêts", description: "Jamais levé automatiquement." },
] as const;
