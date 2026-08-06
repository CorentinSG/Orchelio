/**
 * Orchelio — which model a task deserves, and what it costs.
 *
 * The owner's requirement (docs/PLAN-V1.md, ADR-0027): the lawyer asks for a
 * business action; the system picks the cheapest model capable of it. Nobody
 * outside this module and the provider adapters may name a model.
 *
 * ## Task classes
 *
 * Three, deliberately coarse. A fine-grained taxonomy would drift from the
 * code that uses it; three classes are few enough that every new task lands
 * in one without a meeting.
 *
 *   light        — classing, extraction, filing, deduplication. Wrong answers
 *                  are cheap to correct and the volume is high.
 *   intermediate — summarising, timelines, comparison, drafting. The bulk of
 *                  what a firm reads.
 *   advanced     — whole-matter analysis across many documents. Rare, and
 *                  worth a model that costs fifty times the light one.
 *
 * ## Prices are estimates, and say so
 *
 * The table below is a published price list copied on a date, not an invoice.
 * Every figure derived from it is stored with `costEstimated: true` and the
 * screens that show one label it (V1-7 finishes that surface). Comparing an
 * estimate to Mistral's actual invoice is an owner action before the pilots
 * (docs/PLAN-V1.md).
 *
 * Money is handled in integer micro-euros: 1 € = 1 000 000 µ€, 1 cent =
 * 10 000 µ€. A light-model call costs a fraction of a cent, and an integer
 * cent column would round that to a zero that reads as "free" — the exact
 * kind of claim this codebase refuses to make.
 */

export const TASK_CLASSES = ["light", "intermediate", "advanced"] as const;
export type TaskClass = (typeof TASK_CLASSES)[number];

/** One micro-euro is a millionth of a euro. */
export const MICRO_EUROS_PER_CENT = 10_000;

/**
 * The models the Mistral adapter may use, by class.
 *
 * `-latest` aliases on purpose: Mistral retires dated snapshots, and an
 * analysis record stores the resolved name the API reports, so "which exact
 * model wrote this" is answered by the record, not by this table.
 */
export const MISTRAL_MODEL_BY_CLASS: Record<TaskClass, string> = {
  light: "ministral-8b-latest",
  intermediate: "mistral-small-latest",
  advanced: "mistral-large-latest",
};

/**
 * Euro cents per million tokens, copied from Mistral's published price list.
 *
 * `asOf` is part of the data: a price without its date is a claim that it is
 * current, which nothing here can promise. `npm run ai:smoke` prints this
 * table beside the live model list so a human can spot drift.
 */
export const MISTRAL_PRICES = {
  asOf: "2025-12",
  currency: "EUR",
  perMillionTokens: {
    "ministral-8b-latest": { inputCents: 10, outputCents: 10 },
    "mistral-small-latest": { inputCents: 10, outputCents: 30 },
    "mistral-large-latest": { inputCents: 200, outputCents: 600 },
  } as Record<string, { inputCents: number; outputCents: number }>,
} as const;

/**
 * What a call cost, in integer micro-euros, from the price table.
 *
 * Unknown model → 0 µ€ with `known: false`, never a guess: a figure invented
 * for an unpriced model would be indistinguishable from a measured one, and
 * the caller records the difference.
 */
export function estimateMicroEuros(
  model: string,
  usage: { inputTokens: number; outputTokens: number },
): { microEuros: number; known: boolean } {
  const price = MISTRAL_PRICES.perMillionTokens[model];
  if (!price) return { microEuros: 0, known: false };

  const microEuros = Math.round(
    (usage.inputTokens * price.inputCents + usage.outputTokens * price.outputCents) /
      1_000_000 *
      MICRO_EUROS_PER_CENT,
  );
  return { microEuros, known: true };
}

/** The rounded display figure. The micro-euro column carries the truth. */
export function microEurosToCents(microEuros: number): number {
  return Math.round(microEuros / MICRO_EUROS_PER_CENT);
}
