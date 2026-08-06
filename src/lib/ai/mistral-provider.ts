/**
 * Orchelio — an analysis whose wording is written by Mistral's hosted models.
 *
 * ## The same one job
 *
 * This provider gives the model exactly the authority the local one does
 * (ADR-0024): it writes the summary's wording, from figures Orchelio has
 * already derived, and decides nothing. The instruction, the figures message
 * and the judgement of what comes back are the shared machinery in
 * `src/lib/ai/summary-rewrite.ts` — one implementation, so the hosted and
 * local paths cannot drift.
 *
 * ## What leaves the machine, exactly
 *
 * The facts message and nothing else: counts, the subjects of disagreements,
 * the kinds of missing document, and the matter's reference. No client name,
 * no matter title, no field value, no date, no filename, no document content
 * — Orchelio holds none to send. The register in Settings → Confidentiality
 * quotes this list to the firm; `factsMessage` is its source of truth, and
 * widening one widens the other in the same commit.
 *
 * This module is the only one in src/ permitted to name api.mistral.ai —
 * enforced by `npm run confidentiality:check` against EGRESS_ALLOWED, with
 * the terms argued in ADR-0025 and ADR-0027. `fetch(` is written out plainly
 * because that check looks for exactly that string; the tests stub the
 * global instead of hiding the call.
 *
 * ## Money
 *
 * Every call is real and billable. The token counts are what the API
 * reported; the cost is an estimate from the price table in
 * `src/lib/ai/routing.ts`, recorded in integer micro-euros with
 * `costEstimated: true` — an estimate is stored as one, and comparing it to
 * the invoice is an owner action before the pilots.
 */

import { analyseMatter as deriveAnalysis } from "@/lib/ai/analyst";
import { reviewAnalysis } from "@/lib/ai/reviewer";
import type { AIProvider } from "@/lib/ai/provider";
import {
  MISTRAL_MODEL_BY_CLASS,
  estimateMicroEuros,
  microEurosToCents,
  type TaskClass,
} from "@/lib/ai/routing";
import {
  REWRITE_SYSTEM_PROMPT,
  factsMessage,
  judgeSummary,
  orchelioWroteTheSummary,
  readContent,
  readTokenCounts,
} from "@/lib/ai/summary-rewrite";
import type {
  AnalysisReviewInput,
  AnalystRun,
  MatterAnalysisInput,
  MatterAnalysisResult,
  ReviewerRun,
  RunUsage,
} from "@/lib/ai/types";

/** Recorded on every analysis, so its wording can be explained years later. */
export const MISTRAL_PROMPT_VERSION = "mistral-summary-v1";

/** The only address in this module, and the only module with this address. */
const CHAT_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

/** Rewording a summary is bulk work, not analysis — the intermediate tier. */
const REWRITE_TASK_CLASS: TaskClass = "intermediate";

/** A hosted API answers in seconds or is having an incident. */
const DEFAULT_TIMEOUT_MS = 60_000;

/** Nothing was used, because no model was consulted. */
const NOTHING_USED: RunUsage = {
  inputTokens: 0,
  outputTokens: 0,
  costCents: 0,
  costMicroEuros: 0,
  costEstimated: false,
};

/** Said when the model's paragraph is the one on screen. */
export const MISTRAL_WROTE_THE_SUMMARY =
  "The summary's wording was written by a Mistral model hosted in the European Union, from " +
  "figures Orchelio had already worked out. Every fact, date, disagreement and gap below was " +
  "derived from the record — the model was not asked what they are, and did not choose any of " +
  "them. What was sent: those figures and the matter's reference. No name, no field value, no " +
  "date, no document.";

export type MistralSettings = {
  /** Server-side only, never rendered, never logged. */
  apiKey: string;
  /** Milliseconds to wait for an answer. */
  timeoutMs?: number;
};

export class MistralAIProvider implements AIProvider {
  readonly name = "mistral" as const;
  readonly model: string = MISTRAL_MODEL_BY_CLASS[REWRITE_TASK_CLASS];
  readonly promptVersion = MISTRAL_PROMPT_VERSION;
  /** A real model runs. What it is allowed to decide is a separate question. */
  readonly simulated = false;
  /** Every call is billed to the firm's Mistral account. */
  readonly billable = true;
  /** Recorded on the usage row, so the ledger says which tier answered. */
  readonly taskClass: TaskClass = REWRITE_TASK_CLASS;

  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(settings: MistralSettings) {
    this.apiKey = settings.apiKey;
    this.timeoutMs = settings.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async analyseMatter(input: MatterAnalysisInput): Promise<AnalystRun> {
    const derived = deriveAnalysis(input);
    const facts = factsMessage(derived, input);
    const attempt = await this.writeSummary(facts, input.reference);

    if (!attempt.ok) {
      // A refused paragraph was still generated and will still be invoiced;
      // recording nothing would make a model that concludes on every matter
      // look free. The usage carries whatever the API reported.
      return {
        analysis: withWarning(derived, orchelioWroteTheSummary(attempt.because)),
        usage: attempt.usage,
      };
    }

    return {
      analysis: withWarning({ ...derived, summary: attempt.summary }, MISTRAL_WROTE_THE_SUMMARY),
      usage: attempt.usage,
    };
  }

  /**
   * The independent check, and deliberately not a model — least of all the
   * same one. A reviewer that shares the analyst's model agrees with itself,
   * which makes an unchecked analysis look checked. Deterministic, free, and
   * it re-scans the model's paragraph for the outcomes `judgeSummary` already
   * refused: two passes over one list.
   */
  async reviewAnalysis(input: AnalysisReviewInput): Promise<ReviewerRun> {
    return { review: reviewAnalysis(input), usage: NOTHING_USED };
  }

  private async writeSummary(
    facts: string,
    reference: string,
  ): Promise<
    | { ok: true; summary: string; usage: RunUsage }
    | { ok: false; because: string; usage: RunUsage }
  > {
    // Held rather than passed inline, so the failure below can ask the signal
    // whether time ran out instead of guessing from the error's shape — the
    // lesson the local provider paid for on Node 22.
    const deadline = AbortSignal.timeout(this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        signal: deadline,
        body: JSON.stringify({
          model: this.model,
          stream: false,
          // The least inventive setting, for a model restating figures it was
          // handed. Not determinism — no setting makes a model deterministic.
          temperature: 0,
          max_tokens: 400,
          messages: [
            { role: "system", content: REWRITE_SYSTEM_PROMPT },
            { role: "user", content: facts },
          ],
        }),
      });
    } catch {
      return {
        ok: false,
        because: deadline.aborted
          ? `Mistral did not answer within ${Math.round(this.timeoutMs / 1000)} seconds`
          : "Mistral could not be reached from this machine",
        usage: NOTHING_USED,
      };
    }

    if (!response.ok) {
      // 401 means the key; anything else means the service. Said in words a
      // firm can act on, never quoting the response body — an API error body
      // is not under Orchelio's control and does not belong in an analysis.
      return {
        ok: false,
        because:
          response.status === 401
            ? "Mistral refused the API key this instance is configured with"
            : `Mistral answered with an error (${response.status})`,
        usage: NOTHING_USED,
      };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { ok: false, because: "Mistral's answer was not readable", usage: NOTHING_USED };
    }

    const verdict = judgeSummary(readContent(payload), facts, reference);
    if (!verdict.ok) {
      // The words go to the server console and no further — never into the
      // analysis, where the reviewer would find the very sentence this check
      // removed.
      console.warn("[orchelio] mistral summary set aside:", verdict.because, {
        text: readContent(payload),
      });
      return { ...verdict, usage: this.usageFrom(payload) };
    }

    return { ok: true, summary: verdict.summary, usage: this.usageFrom(payload) };
  }

  /**
   * What the call used and what it cost. Tokens as the API reported them; the
   * cost estimated from the price table, in micro-euros, and marked as an
   * estimate. An unpriced model is recorded at zero with the estimate flag
   * still true — a gap in the table must not print as "free".
   */
  private usageFrom(payload: unknown): RunUsage {
    const tokens = readTokenCounts(payload);
    const { microEuros } = estimateMicroEuros(this.model, tokens);
    return {
      ...tokens,
      costMicroEuros: microEuros,
      costCents: microEurosToCents(microEuros),
      costEstimated: true,
    };
  }
}

function withWarning(analysis: MatterAnalysisResult, warning: string): MatterAnalysisResult {
  return { ...analysis, warnings: [...analysis.warnings, warning] };
}
