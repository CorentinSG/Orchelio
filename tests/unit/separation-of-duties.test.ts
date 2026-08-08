import { describe, expect, it } from "vitest";

import {
  MINIMUM_DECIDERS_FOR_SEPARATION,
  SELF_DECISION_NOTICE,
  SELF_DECISION_REFUSAL,
  isSelfDecision,
  judgeSeparation,
  separationReadiness,
} from "@/lib/approvals/separation";

/**
 * Orchelio — separation of duties.
 *
 * The rule is small; the cases that matter are the awkward ones. A request
 * whose requester no longer has an account must stay decidable, and a firm with
 * one person who may decide must be told that switching the rule on would stop
 * its work rather than protect it.
 */

const ALICE = "user-alice";
const BEN = "user-ben";

describe("recognising a self-decision", () => {
  it("recognises the same person", () => {
    expect(isSelfDecision(ALICE, ALICE)).toBe(true);
  });

  it("does not confuse two people", () => {
    expect(isSelfDecision(ALICE, BEN)).toBe(false);
  });

  it("treats an unknown requester as somebody else", () => {
    // The account was deleted and `requestedById` is null. Refusing here would
    // make the request permanently undecidable for a reason unrelated to who
    // is deciding it — and an undecidable request cannot even be rejected.
    expect(isSelfDecision(null, ALICE)).toBe(false);
    expect(isSelfDecision(undefined, ALICE)).toBe(false);
  });
});

describe("judging a decision", () => {
  it("allows a decision by somebody else, rule on or off", () => {
    for (const requireSeparateApprover of [true, false]) {
      expect(
        judgeSeparation({ requestedById: ALICE, decidedById: BEN, requireSeparateApprover }),
      ).toEqual({ allowed: true, self: false });
    }
  });

  it("allows a self-decision when the firm has not switched the rule on", () => {
    // Allowed, and still reported as a self-decision: the caller writes that
    // into the log, and the card says so on screen.
    expect(
      judgeSeparation({ requestedById: ALICE, decidedById: ALICE, requireSeparateApprover: false }),
    ).toEqual({ allowed: true, self: true });
  });

  it("refuses a self-decision when the firm has", () => {
    expect(
      judgeSeparation({ requestedById: ALICE, decidedById: ALICE, requireSeparateApprover: true }),
    ).toEqual({ allowed: false, reason: "same_person" });
  });

  it("still allows an unattributed request when the rule is on", () => {
    expect(
      judgeSeparation({ requestedById: null, decidedById: ALICE, requireSeparateApprover: true }),
    ).toEqual({ allowed: true, self: false });
  });
});

describe("whether a firm can use the rule at all", () => {
  it("needs two people, not one", () => {
    expect(MINIMUM_DECIDERS_FOR_SEPARATION).toBe(2);
  });

  it("says a firm with two or more deciders is ready", () => {
    for (const count of [2, 3, 12]) {
      const readiness = separationReadiness(count);
      expect(readiness.workable, `${count} deciders`).toBe(true);
      expect(readiness.deciders).toBe(count);
    }
  });

  it("warns a firm with one decider that the rule would stop its work", () => {
    const readiness = separationReadiness(1);
    expect(readiness.workable).toBe(false);
    // The trap named outright: not "you need more people" but what would break.
    expect(readiness.note).toMatch(/indécidable/i);
  });

  it("says something different when nobody may decide", () => {
    const readiness = separationReadiness(0);
    expect(readiness.workable).toBe(false);
    expect(readiness.note).not.toBe(separationReadiness(1).note);
  });

  it("always explains itself in the firm's own terms", () => {
    for (const count of [0, 1, 2, 5]) {
      expect(separationReadiness(count).note.length, `${count}`).toBeGreaterThan(40);
    }
  });
});

describe("the two things a person is told", () => {
  it("names the requester without hectoring them", () => {
    expect(SELF_DECISION_NOTICE).toMatch(/vous avez formé cette demande/i);
    expect(SELF_DECISION_NOTICE).toMatch(/cette personne, c’est vous/i);
  });

  it("says what to do instead, not only that it was refused", () => {
    expect(SELF_DECISION_REFUSAL).toMatch(/demandez à un collègue/i);
  });

  it("keeps the two messages distinct", () => {
    // One is information, the other a refusal. A reader who sees the same
    // sentence in both cases learns nothing from either.
    expect(SELF_DECISION_NOTICE).not.toBe(SELF_DECISION_REFUSAL);
  });
});
