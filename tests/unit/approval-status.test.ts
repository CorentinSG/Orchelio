import { describe, expect, it } from "vitest";

import { APPROVAL_DECISIONS } from "@/lib/approvals/actions";
import {
  APPROVAL_STATUSES,
  PENDING_STATUS,
  SUPERSEDED_EXPLANATION,
  SUPERSEDED_REFUSAL,
  SUPERSEDED_STATUS,
  approvalStatusLabel,
  isDecisionStatus,
  isPendingStatus,
  isSupersededStatus,
} from "@/lib/approvals/status";

/**
 * Orchelio — the approval status vocabulary.
 *
 * One property carries most of this file: the three predicates partition the
 * statuses, so every value is in exactly one bucket. It exists because the bug
 * that produced the module was a status quietly falling into the wrong bucket —
 * `{ not: "pending" }` counted a superseded request as one a person had
 * decided. A seventh status added later without a home would do it again, and
 * this test is what stops that being a silent change.
 */

describe("the vocabulary", () => {
  it("is pending, the four decisions, and superseded", () => {
    expect([...APPROVAL_STATUSES]).toEqual([
      "pending",
      ...APPROVAL_DECISIONS,
      "superseded",
    ]);
  });

  it("keeps the four decisions to four", () => {
    // Named here as well as in the actions module: the count is an invariant
    // several screens rely on, and superseded was deliberately not made a
    // fifth.
    expect(APPROVAL_DECISIONS).toHaveLength(4);
    expect(APPROVAL_DECISIONS).not.toContain(SUPERSEDED_STATUS);
  });
});

describe("the three buckets partition every status", () => {
  for (const status of APPROVAL_STATUSES) {
    it(`puts "${status}" in exactly one`, () => {
      const matches = [
        isPendingStatus(status),
        isDecisionStatus(status),
        isSupersededStatus(status),
      ].filter(Boolean);
      expect(matches, `"${status}" must belong to exactly one bucket`).toHaveLength(1);
    });
  }

  it("puts a status nobody declared in none of them", () => {
    // Failing closed. An unrecognised value must never be counted as a
    // decision, because a decision is a claim that a person took
    // responsibility.
    for (const unknown of ["", "withdrawn", "PENDING", "approved "]) {
      expect(isPendingStatus(unknown), unknown).toBe(false);
      expect(isDecisionStatus(unknown), unknown).toBe(false);
      expect(isSupersededStatus(unknown), unknown).toBe(false);
    }
  });
});

describe("superseded is not a decision", () => {
  it("is not one of the four", () => {
    expect(isDecisionStatus(SUPERSEDED_STATUS)).toBe(false);
  });

  it("is not pending either, so nothing is waiting on it", () => {
    expect(isPendingStatus(SUPERSEDED_STATUS)).toBe(false);
  });

  it("says on screen that nobody decided it", () => {
    // The second half of the sentence is the half that matters. A reader who
    // learns only that a newer analysis exists could still believe this
    // request was dealt with.
    expect(SUPERSEDED_EXPLANATION).toMatch(/nobody decided it/i);
    expect(SUPERSEDED_EXPLANATION).toMatch(/nothing was approved/i);
  });

  it("tells somebody who tries to decide one what to do instead", () => {
    expect(SUPERSEDED_REFUSAL).toMatch(/nothing left to decide/i);
    expect(SUPERSEDED_REFUSAL).toMatch(/current analysis/i);
  });

  it("never borrows the word 'decided' for its own refusal", () => {
    // "Somebody has already decided this one" is the refusal for a genuinely
    // decided request. Reusing it here would send the reader hunting for a
    // decision that does not exist.
    expect(SUPERSEDED_REFUSAL).not.toMatch(/already decided/i);
  });
});

describe("the badge", () => {
  it("labels each status", () => {
    expect(approvalStatusLabel(PENDING_STATUS)).toBe("Awaiting a decision");
    expect(approvalStatusLabel("approved")).toBe("Approved");
    expect(approvalStatusLabel(SUPERSEDED_STATUS)).toBe("Superseded");
  });

  it("has a label for every status in the vocabulary", () => {
    for (const status of APPROVAL_STATUSES) {
      const label = approvalStatusLabel(status);
      expect(label.length, status).toBeGreaterThan(0);
      // Never the raw stored value: a screen showing "new_analysis_requested"
      // is showing the database, not the product.
      expect(label, status).not.toContain("_");
    }
  });
});
