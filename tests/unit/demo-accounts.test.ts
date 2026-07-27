import { describe, expect, it } from "vitest";

import { DEMO_ACCOUNTS, visibleDemoAccounts } from "@/lib/demo-accounts";
import {
  CONFIGURABLE_APPROVALS,
  DECISIONS_REQUIRING_NOTE,
  LOCKED_APPROVALS,
  isLockedApproval,
} from "@/lib/constants";

describe("demonstration accounts", () => {
  it("uses only the reserved .local domain, which cannot exist on the internet", () => {
    for (const account of DEMO_ACCOUNTS) {
      expect(account.email.endsWith("@demo.local")).toBe(true);
    }
  });

  it("provides exactly the five accounts named in the specification", () => {
    expect(DEMO_ACCOUNTS.map((account) => account.email).sort()).toEqual([
      "employment.attorney@demo.local",
      "employment.paralegal@demo.local",
      "immigration.attorney@demo.local",
      "immigration.paralegal@demo.local",
      "platform.admin@demo.local",
    ]);
  });

  it("advertises the accounts in the demonstration build", () => {
    expect(visibleDemoAccounts()).toHaveLength(DEMO_ACCOUNTS.length);
  });
});

describe("approval rules", () => {
  it("locks the safety rules that must never be switched off", () => {
    for (const key of [
      "fileSubmission",
      "legalAdviceDelivery",
      "permanentDeletion",
      "deadlineConfirmation",
      "externalTransmission",
      "eligibilityConclusion",
      "conflictClearance",
      "settlementCommunication",
      "opposingCounselCommunication",
    ]) {
      expect(isLockedApproval(key)).toBe(true);
    }
  });

  it("never lets a locked rule also appear as configurable", () => {
    const configurable = new Set<string>(CONFIGURABLE_APPROVALS);

    for (const locked of LOCKED_APPROVALS) {
      expect(configurable.has(locked)).toBe(false);
    }
  });

  it("requires a written note for every decision other than a plain approval", () => {
    expect([...DECISIONS_REQUIRING_NOTE].sort()).toEqual([
      "approved_with_edits",
      "new_analysis_requested",
      "rejected",
    ]);
    expect((DECISIONS_REQUIRING_NOTE as readonly string[]).includes("approved")).toBe(false);
  });
});
