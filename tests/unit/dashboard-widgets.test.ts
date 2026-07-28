import { describe, expect, it } from "vitest";

import { widgetValue, widgetsFor } from "@/lib/dashboard/widgets";
import type { FirmStatistics } from "@/lib/data/statistics";

/**
 * Orchelio — what the dashboard is allowed to say.
 *
 * Two product rules meet in this module, and both are easy to break by
 * accident. A widget shows a dash rather than a zero when its number is not
 * known, because a zero is a claim ("there is nothing to do"). And a widget
 * that depends on an AI feature the firm switched off is omitted entirely
 * rather than shown empty, because a card reading "0 missing documents" at a
 * firm that never asked Orchelio to look for missing documents reads like
 * reassurance.
 *
 * See docs/decisions/ADR-0009-a-dash-not-a-zero.md.
 */

const STATISTICS: FirmStatistics = {
  matters: 6,
  openMatters: 4,
  documents: 22,
  analyses: 0,
  pendingApprovals: 0,
  openTasks: 9,
  clients: 6,
  usageCostCents: 0,
};

const ALL_AI_FEATURES = ["missing_documents", "inconsistencies", "timeline"];

describe("which widgets a firm sees", () => {
  it("gives each practice area its own questions", () => {
    const immigration = widgetsFor("immigration", ALL_AI_FEATURES).map((widget) => widget.key);
    const employment = widgetsFor("employment_law", ALL_AI_FEATURES).map((widget) => widget.key);

    expect(immigration).toContain("status_dates_to_review");
    expect(immigration).not.toContain("termination_letters_to_review");
    expect(employment).toContain("termination_letters_to_review");
    expect(employment).not.toContain("status_dates_to_review");
  });

  it("gives both areas the same shared widgets", () => {
    for (const area of ["immigration", "employment_law"]) {
      const keys = widgetsFor(area, ALL_AI_FEATURES).map((widget) => widget.key);
      expect(keys).toContain("active_matters");
      expect(keys).toContain("pending_approvals");
    }
  });

  it("omits a widget whose AI feature the firm switched off", () => {
    const withFeature = widgetsFor("immigration", ALL_AI_FEATURES).map((widget) => widget.key);
    const without = widgetsFor("immigration", ["timeline"]).map((widget) => widget.key);

    expect(withFeature).toContain("missing_identity_documents");
    // Omitted, not shown empty: an empty card would read as "nothing missing".
    expect(without).not.toContain("missing_identity_documents");
    expect(without).not.toContain("missing_immigration_documents");
    // Everything not gated on that feature is untouched.
    expect(without).toContain("new_leads");
  });

  it("returns nothing for a practice area with no template", () => {
    // The shared widgets still apply; the area-specific ones do not exist.
    const keys = widgetsFor("family_law", ALL_AI_FEATURES).map((widget) => widget.key);
    expect(keys).toEqual(["active_matters", "pending_approvals", "recent_analyses", "monthly_usage"]);
  });
});

describe("what a widget shows", () => {
  const widget = (key: string, area = "immigration") =>
    widgetsFor(area, ALL_AI_FEATURES).find((candidate) => candidate.key === key)!;

  it("shows a dash, not a zero, for a phase that has not landed", () => {
    const approvals = widget("pending_approvals");

    expect(approvals.availableFrom).toBeGreaterThan(5);
    expect(widgetValue(approvals, STATISTICS, 5, {})).toBe("—");
    // The same widget shows the real figure once its phase has landed — and
    // zero is then a fact, not a claim about missing data.
    expect(widgetValue(approvals, STATISTICS, 7, {})).toBe(0);
  });

  it("shows a dash when the count for this widget was not supplied", () => {
    expect(widgetValue(widget("new_leads"), STATISTICS, 5, {})).toBe("—");
  });

  it("shows a supplied zero, because a counted zero is a fact", () => {
    expect(widgetValue(widget("new_leads"), STATISTICS, 5, { new_leads: 0 })).toBe(0);
  });

  it("shows the practice-area count when there is one", () => {
    expect(
      widgetValue(widget("consultations_to_prepare"), STATISTICS, 5, {
        consultations_to_prepare: 3,
      }),
    ).toBe(3);
  });

  it("reads open matters from the firm statistics", () => {
    expect(widgetValue(widget("active_matters"), STATISTICS, 5, {})).toBe(
      STATISTICS.openMatters,
    );
  });

  it("never lets a count leak between widgets", () => {
    const counts = { new_leads: 2 };

    expect(widgetValue(widget("new_leads"), STATISTICS, 5, counts)).toBe(2);
    expect(widgetValue(widget("consultations_to_prepare"), STATISTICS, 5, counts)).toBe("—");
  });
});
