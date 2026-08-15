/**
 * Orchelio — dashboard composition.
 *
 * The dashboard is assembled from the firm's configuration, not chosen by the
 * code. An immigration firm sees status expiry dates and missing identity
 * documents; an employment firm sees termination letters and missing wage
 * records. Same product, same screen, different questions — because those are
 * the questions each firm actually asks every morning.
 *
 * A widget declares which practice area it belongs to and, where relevant,
 * which AI feature or matter type must be enabled for it to make sense. A firm
 * that switched off inconsistency detection should not be shown a card counting
 * inconsistencies.
 */

import type { FirmStatistics } from "@/lib/data/statistics";

export type WidgetTone = "neutral" | "brand" | "warning" | "success" | "ai";

export type DashboardWidget = {
  key: string;
  label: string;
  /** Where the figure comes from, once the data exists. */
  hint: string;
  tone: WidgetTone;
  /** The phase that fills this widget with real numbers. */
  availableFrom: number;
  /** Required AI feature key, if the widget depends on one. */
  requiresAiFeature?: string;
};

const SHARED_WIDGETS: readonly DashboardWidget[] = [
  { key: "active_matters", label: "Dossiers actifs", hint: "Dossiers ouverts", tone: "brand", availableFrom: 5 },
  { key: "pending_approvals", label: "Validations en attente", hint: "En attente d’une décision humaine", tone: "warning", availableFrom: 7 },
  { key: "recent_analyses", label: "Analyses de l’assistant", hint: "Chacune attend encore une personne", tone: "ai", availableFrom: 6 },
  { key: "monthly_usage", label: "Jetons simulés consommés", hint: "Ce cabinet uniquement — aucun frais", tone: "neutral", availableFrom: 6 },
];

const IMMIGRATION_WIDGETS: readonly DashboardWidget[] = [
  { key: "new_leads", label: "Premiers contacts", hint: "Dossiers encore au stade du premier contact", tone: "brand", availableFrom: 5 },
  { key: "consultations_to_prepare", label: "Consultations à préparer", hint: "Dossiers avec une consultation programmée", tone: "brand", availableFrom: 5 },
  { key: "status_dates_to_review", label: "Titres arrivant à expiration", hint: "Expiration enregistrée sous 90 jours — non confirmée", tone: "warning", availableFrom: 5 },
  { key: "missing_identity_documents", label: "Documents d’identité manquants", hint: "Dossiers sans passeport, titre de séjour ou acte de naissance", tone: "warning", availableFrom: 5, requiresAiFeature: "missing_documents" },
  { key: "missing_immigration_documents", label: "Pièces de séjour manquantes", hint: "Dossiers auxquels manque une autre pièce attendue", tone: "warning", availableFrom: 5, requiresAiFeature: "missing_documents" },
  { key: "awaiting_attorney_approval", label: "Dossiers en attente de validation", hint: "Analyses pas encore validées", tone: "warning", availableFrom: 7 },
  { key: "upcoming_deadlines", label: "Dates à revoir", hint: "Sous 30 jours — enregistrées, jamais confirmées", tone: "neutral", availableFrom: 5 },
];

const EMPLOYMENT_WIDGETS: readonly DashboardWidget[] = [
  { key: "new_employee_intakes", label: "Nouveaux questionnaires salariés", hint: "Questionnaires enregistrés pour ce cabinet", tone: "brand", availableFrom: 5 },
  { key: "employee_side_matters", label: "Dossiers côté salarié", hint: "Ouverts, représentant le salarié", tone: "brand", availableFrom: 5 },
  { key: "employer_side_matters", label: "Dossiers côté employeur", hint: "Ouverts, représentant l’employeur", tone: "brand", availableFrom: 5 },
  { key: "termination_letters_to_review", label: "Lettres de licenciement à examiner", hint: "Au dossier, pas encore vérifiées par une personne", tone: "warning", availableFrom: 5 },
  { key: "wage_records_missing", label: "Justificatifs de salaire manquants", hint: "Dossiers sans bulletin de paie ni relevé d’heures", tone: "warning", availableFrom: 5, requiresAiFeature: "missing_documents" },
  // "Assessed" is something the analysis decides, so this one waits for it.
  { key: "discrimination_awaiting_assessment", label: "Dossiers discrimination non analysés", hint: "Aucune analyse n’a été lancée", tone: "warning", availableFrom: 6 },
  { key: "settlement_deadlines", label: "Dates de transaction à revoir", hint: "En négociation, avec une date enregistrée", tone: "warning", availableFrom: 5 },
];

const BY_PRACTICE_AREA: Record<string, readonly DashboardWidget[]> = {
  immigration: IMMIGRATION_WIDGETS,
  employment_law: EMPLOYMENT_WIDGETS,
};

/**
 * The widgets this firm should see.
 *
 * A widget that depends on an AI feature the firm switched off is omitted
 * entirely rather than shown empty: a card reading "0 missing documents" at a
 * firm that never asked Orchelio to look for missing documents is not
 * information, it is noise that reads like reassurance.
 */
export function widgetsFor(
  primaryPracticeArea: string,
  enabledAiFeatures: readonly string[],
): DashboardWidget[] {
  const areaWidgets = BY_PRACTICE_AREA[primaryPracticeArea] ?? [];
  const enabled = new Set(enabledAiFeatures);

  return [...areaWidgets, ...SHARED_WIDGETS].filter(
    (widget) => !widget.requiresAiFeature || enabled.has(widget.requiresAiFeature),
  );
}

/**
 * The value a widget currently shows.
 *
 * Until the phase that fills it, a widget shows a dash rather than a zero. A
 * zero is a claim — "there is nothing to do" — and Orchelio should not make a
 * claim it cannot yet support.
 */
export function widgetValue(
  widget: DashboardWidget,
  statistics: FirmStatistics,
  currentPhase: number,
  practiceAreaCounts: Readonly<Record<string, number>> = {},
): string | number {
  if (widget.availableFrom > currentPhase) {
    return "—";
  }

  switch (widget.key) {
    case "active_matters":
      return statistics.openMatters;
    case "pending_approvals":
      return statistics.pendingApprovals;
    case "recent_analyses":
      return statistics.analyses;
    default: {
      // A practice-area widget knows its own number, or it does not exist yet.
      // An absent key is a dash rather than a zero — see ADR-0009.
      const counted = practiceAreaCounts[widget.key];
      return counted === undefined ? "—" : counted;
    }
  }
}
