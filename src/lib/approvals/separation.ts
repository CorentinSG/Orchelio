/**
 * Orchelio — separation of duties.
 *
 * Every sensitive action in Orchelio needs a person's decision. Until now,
 * nothing stopped that person being the same one who asked. For a demonstration
 * with five accounts that is tolerable; for a real file it is the difference
 * between a control and a formality — an approval you grant yourself records
 * that somebody looked, and the somebody was you.
 *
 * Two things are separated here on purpose.
 *
 * **Naming the requester is not optional.** Whether or not the firm has the
 * rule switched on, a decider is told when they are about to decide their own
 * request. Information is always given; only the refusal is configurable.
 *
 * **Refusing is optional, and defaults to off.** A sole practitioner is a
 * legitimate firm, and a firm with one person who may decide would be unable to
 * decide anything at all. A safety control that stops the work is a safety
 * control somebody switches off permanently, so this one is offered rather than
 * imposed — and the settings screen says what leaving it off means, and warns
 * when a firm has too few people for it to be switchable on.
 *
 * Pure functions, no database: the rule is decidable from three values, so it
 * is testable without one.
 */

export type SeparationVerdict =
  | { allowed: true; self: boolean }
  | { allowed: false; reason: "same_person" };

/**
 * Is this person about to decide their own request?
 *
 * A request whose requester is unknown — the account was deleted, and
 * `requestedById` is null — is *not* a self-decision. Refusing there would make
 * a request permanently undecidable because of something unrelated to who is
 * deciding it, and an undecidable request is worse than a self-decided one: it
 * cannot even be rejected.
 */
export function isSelfDecision(
  requestedById: string | null | undefined,
  decidedById: string,
): boolean {
  return requestedById !== null && requestedById !== undefined && requestedById === decidedById;
}

/** May this decision be recorded? */
export function judgeSeparation(input: {
  requestedById: string | null | undefined;
  decidedById: string;
  requireSeparateApprover: boolean;
}): SeparationVerdict {
  const self = isSelfDecision(input.requestedById, input.decidedById);

  if (self && input.requireSeparateApprover) {
    return { allowed: false, reason: "same_person" };
  }
  return { allowed: true, self };
}

/**
 * How many people must be able to decide before the rule can be switched on.
 *
 * Two, and not one: with a single eligible decider every request they raise
 * becomes undecidable, which is the trap this constant exists to name.
 */
export const MINIMUM_DECIDERS_FOR_SEPARATION = 2;

export type SeparationReadiness = {
  /** People in the firm who hold `approval.decide`. */
  deciders: number;
  /** True when the firm has enough of them for the rule to be workable. */
  workable: boolean;
  /** Said on the screen, in the firm's own terms. */
  note: string;
};

export function separationReadiness(deciders: number): SeparationReadiness {
  if (deciders >= MINIMUM_DECIDERS_FOR_SEPARATION) {
    return {
      deciders,
      workable: true,
      note: `${deciders} people here may decide, so a request always has somebody other than its requester who can act on it.`,
    };
  }

  return {
    deciders,
    workable: false,
    note:
      deciders === 1
        ? "Only one person here may decide. Switching this on would make every request they raise undecidable — including by them. Give a second person the attorney or administrator role first."
        : "Nobody here may decide yet. Give somebody the attorney or administrator role first.",
  };
}

/** The wording a decider sees when the request is their own. */
export const SELF_DECISION_NOTICE =
  "You raised this request. Deciding it yourself records that a person looked, and that person is you.";

/** The wording the server returns when the firm has refused that. */
export const SELF_DECISION_REFUSAL =
  "This firm requires a different person to decide a request from the one who raised it. Ask a colleague who may decide to look at this one.";
