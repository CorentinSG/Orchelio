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
  { key: "active_matters", label: "Active matters", hint: "Open matters", tone: "brand", availableFrom: 5 },
  { key: "pending_approvals", label: "Pending approvals", hint: "Awaiting a human decision", tone: "warning", availableFrom: 7 },
  { key: "recent_analyses", label: "Recent Claude analyses", hint: "Completed analyses", tone: "ai", availableFrom: 6 },
  { key: "monthly_usage", label: "Simulated AI usage", hint: "This firm only — no charge", tone: "neutral", availableFrom: 6 },
];

const IMMIGRATION_WIDGETS: readonly DashboardWidget[] = [
  { key: "new_leads", label: "New leads", hint: "Prospective clients", tone: "brand", availableFrom: 5 },
  { key: "consultations_to_prepare", label: "Consultations to prepare", hint: "Upcoming first meetings", tone: "brand", availableFrom: 5 },
  { key: "status_dates_to_review", label: "Status expiration dates to review", hint: "Immigration status approaching expiry", tone: "warning", availableFrom: 5 },
  { key: "missing_identity_documents", label: "Missing identity documents", hint: "Passport, I-94, visa", tone: "warning", availableFrom: 5, requiresAiFeature: "missing_documents" },
  { key: "missing_immigration_documents", label: "Missing immigration documents", hint: "USCIS notices, prior filings", tone: "warning", availableFrom: 5, requiresAiFeature: "missing_documents" },
  { key: "awaiting_attorney_approval", label: "Matters awaiting attorney approval", hint: "Analyses not yet approved", tone: "warning", availableFrom: 7 },
  { key: "upcoming_deadlines", label: "Upcoming deadlines", hint: "Fictional deadlines", tone: "neutral", availableFrom: 5 },
];

const EMPLOYMENT_WIDGETS: readonly DashboardWidget[] = [
  { key: "new_employee_intakes", label: "New employee intakes", hint: "Recently received intakes", tone: "brand", availableFrom: 5 },
  { key: "employee_side_matters", label: "Employee-side matters", hint: "Representing the employee", tone: "brand", availableFrom: 5 },
  { key: "employer_side_matters", label: "Employer-side matters", hint: "Representing the employer", tone: "brand", availableFrom: 5 },
  { key: "termination_letters_to_review", label: "Termination letters to review", hint: "Received, not yet reviewed", tone: "warning", availableFrom: 5 },
  { key: "wage_records_missing", label: "Wage records missing", hint: "Pay stubs and time records", tone: "warning", availableFrom: 5, requiresAiFeature: "missing_documents" },
  { key: "discrimination_awaiting_assessment", label: "Discrimination matters awaiting assessment", hint: "Not yet assessed", tone: "warning", availableFrom: 5 },
  { key: "settlement_deadlines", label: "Settlement deadlines to review", hint: "Acceptance deadlines to confirm", tone: "warning", availableFrom: 5 },
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
    default:
      return "—";
  }
}
