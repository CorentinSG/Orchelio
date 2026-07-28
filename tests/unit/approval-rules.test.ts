import { describe, expect, it } from "vitest";

import {
  APPROVABLE_ACTIONS,
  APPROVAL_DECISIONS,
  DECISIONS_REQUIRING_NOTE,
  approvableAction,
  approvalReason,
  decisionApproves,
  isApprovalDecision,
  requiresApproval,
  requiresNote,
  rulesWithoutActions,
} from "@/lib/approvals/actions";
import { CONFIGURABLE_APPROVALS, LOCKED_APPROVALS, isLockedApproval } from "@/lib/constants";

/**
 * Orchelio — which actions need a person, and when.
 *
 * The single most important property in this phase is that a locked rule
 * cannot be switched off. It is easy to write code that honours that today and
 * stops honouring it after a plausible refactor — "check the configuration
 * first, then fall back to the lock" reads fine and is wrong. These tests
 * assert it from every direction they can reach.
 */

/** A configuration with every configurable approval switched off. */
const NOTHING_ENABLED: Record<string, boolean> = Object.fromEntries(
  CONFIGURABLE_APPROVALS.map((rule) => [rule, false]),
);

/** Every configurable approval switched on. */
const EVERYTHING_ENABLED: Record<string, boolean> = Object.fromEntries(
  CONFIGURABLE_APPROVALS.map((rule) => [rule, true]),
);

describe("a locked rule cannot be switched off", () => {
  const locked = APPROVABLE_ACTIONS.filter((action) => action.lockedBy !== null);

  it("covers at least one locked rule, or these tests prove nothing", () => {
    expect(locked.length).toBeGreaterThan(0);
  });

  for (const action of locked) {
    describe(action.key, () => {
      it("requires a decision when the firm has switched everything off", () => {
        expect(requiresApproval(action, NOTHING_ENABLED)).toBe(true);
      });

      it("requires a decision when the configuration is empty", () => {
        expect(requiresApproval(action, {})).toBe(true);
      });

      it("requires a decision even when its own rule is set to false", () => {
        // The obvious attack on this design: name the locked rule in the
        // configuration and set it off. It is not consulted at all.
        expect(requiresApproval(action, { [action.lockedBy!]: false })).toBe(true);
      });

      it("requires a decision whatever nonsense the configuration holds", () => {
        for (const configuration of [
          { [action.lockedBy!]: 0 },
          { [action.lockedBy!]: null },
          { [action.lockedBy!]: "no" },
          { [action.lockedBy!]: undefined },
        ]) {
          expect(requiresApproval(action, configuration)).toBe(true);
        }
      });

      it("says it is locked, so a screen can show why", () => {
        expect(approvalReason(action, NOTHING_ENABLED)).toBe("locked");
        expect(isLockedApproval(action.lockedBy!)).toBe(true);
      });
    });
  }
});

describe("a configurable rule is the firm's choice", () => {
  const configurable = APPROVABLE_ACTIONS.filter((action) => action.configurableBy !== null);

  it("covers at least one configurable rule", () => {
    expect(configurable.length).toBeGreaterThan(0);
  });

  for (const action of configurable) {
    describe(action.key, () => {
      it("needs a decision when the firm asked for one", () => {
        expect(requiresApproval(action, EVERYTHING_ENABLED)).toBe(true);
        expect(approvalReason(action, EVERYTHING_ENABLED)).toBe("configured");
      });

      it("does not when the firm did not", () => {
        expect(requiresApproval(action, NOTHING_ENABLED)).toBe(false);
        expect(approvalReason(action, NOTHING_ENABLED)).toBe("not_required");
      });

      it("treats anything other than true as off", () => {
        // A configuration is JSON a form wrote. "true", 1 and "yes" are not
        // true, and guessing what somebody meant is how a rule gets switched
        // on by accident — or off.
        for (const value of ["true", 1, "yes", {}, []]) {
          expect(
            requiresApproval(action, { [action.configurableBy!]: value }),
            String(value),
          ).toBe(false);
        }
      });

      it("names a rule the questionnaire actually offers", () => {
        expect(CONFIGURABLE_APPROVALS).toContain(action.configurableBy);
      });
    });
  }
});

describe("the action catalogue", () => {
  it("gives every action exactly one governing rule", () => {
    for (const action of APPROVABLE_ACTIONS) {
      const rules = [action.lockedBy, action.configurableBy].filter(Boolean);
      expect(rules, action.key).toHaveLength(1);
    }
  });

  it("uses distinct keys", () => {
    const keys = APPROVABLE_ACTIONS.map((action) => action.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("tells the reader what approving will cause, before they decide", () => {
    for (const action of APPROVABLE_ACTIONS) {
      expect(action.question.length, action.key).toBeGreaterThan(20);
      expect(action.effect.length, action.key).toBeGreaterThan(20);
      expect(action.question, action.key).toContain("?");
    }
  });

  it("resolves a known key and refuses an unknown one", () => {
    expect(approvableAction("legal_analysis")?.label).toBeTruthy();
    expect(approvableAction("definitely_not_an_action")).toBeUndefined();
  });

  it("is honest about the rules it does not yet raise", () => {
    const uncovered = rulesWithoutActions();
    const covered = APPROVABLE_ACTIONS.flatMap((action) =>
      [action.lockedBy, action.configurableBy].filter(Boolean),
    );

    // Every rule is either implemented or listed as not implemented. A rule
    // that is in neither list is one a firm could believe protects them.
    for (const rule of [...LOCKED_APPROVALS, ...CONFIGURABLE_APPROVALS]) {
      const known =
        covered.includes(rule) ||
        uncovered.locked.includes(rule) ||
        uncovered.configurable.includes(rule);
      expect(known, rule).toBe(true);
    }
  });
});

describe("decisions", () => {
  it("offers exactly the four the specification names", () => {
    expect([...APPROVAL_DECISIONS]).toEqual([
      "approved",
      "approved_with_edits",
      "new_analysis_requested",
      "rejected",
    ]);
  });

  it("demands a note for the three that leave somebody with work", () => {
    expect(requiresNote("approved")).toBe(false);
    expect(requiresNote("approved_with_edits")).toBe(true);
    expect(requiresNote("new_analysis_requested")).toBe(true);
    expect(requiresNote("rejected")).toBe(true);
    expect([...DECISIONS_REQUIRING_NOTE]).toHaveLength(3);
  });

  it("lets only the two approvals take effect", () => {
    expect(decisionApproves("approved")).toBe(true);
    expect(decisionApproves("approved_with_edits")).toBe(true);
    expect(decisionApproves("rejected")).toBe(false);
    expect(decisionApproves("new_analysis_requested")).toBe(false);
  });

  it("refuses a decision that is not one of the four", () => {
    for (const value of ["approve", "APPROVED", "", "yes", "pending", "deleted"]) {
      expect(isApprovalDecision(value), value).toBe(false);
    }
    expect(isApprovalDecision("approved")).toBe(true);
  });
});

describe("what the nine locked rules cover", () => {
  it("still numbers nine", () => {
    expect(LOCKED_APPROVALS).toHaveLength(9);
  });

  it("includes the four this build raises or refuses outright", () => {
    // Two are raised as approvals; the rest are unreachable because Orchelio
    // has no transport and never deletes anything. Either way none of them can
    // happen quietly.
    for (const rule of ["externalTransmission", "deadlineConfirmation"]) {
      expect(LOCKED_APPROVALS).toContain(rule);
      expect(APPROVABLE_ACTIONS.some((action) => action.lockedBy === rule)).toBe(true);
    }
  });
});
