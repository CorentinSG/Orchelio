/**
 * Orchelio — an analysis produced with a model running on the firm's own
 * machine.
 *
 * ## What the model is, and is not, allowed to do
 *
 * It writes one paragraph. That is the whole of its authority.
 *
 * Every fact, date, disagreement, gap and question in the analysis is derived
 * from the record by `analyseMatter` — the same deterministic code the
 * simulation uses — before the model is contacted at all. The model is then
 * handed those derived figures and asked to say the same thing in plainer
 * words. It is not asked what the facts are, because a comparison between two
 * dates cannot confabulate and a small model can.
 *
 * This is not a limitation to be lifted later. The parts of an analysis a firm
 * would be harmed by getting wrong — what disagrees, what is missing, what is
 * on file — are exactly the parts that need no model, and handing them to one
 * would trade something that cannot be wrong for something that can.
 *
 * The request itself — the instruction, the figures message, the judgement of
 * what comes back — lives in `src/lib/ai/summary-rewrite.ts`, shared with the
 * hosted provider so the two cannot drift (ADR-0024, ADR-0027). What is
 * particular to this module is the address discipline and the wording that
 * says where the model ran.
 *
 * ## What comes back is checked before it is stored
 *
 * A small open-weight model will, sooner or later, conclude. `judgeSummary`
 * refuses prose that asserts an outcome (against the reviewer's own list),
 * that uses a figure which was not in what it was sent, that includes a link,
 * or that does not name the matter it was asked about. A refused paragraph is
 * dropped and Orchelio's derived summary is used instead — and the analysis
 * says which one the reader is looking at, because "the model wrote this" and
 * "Orchelio wrote this" are different claims.
 *
 * The rejected text is never quoted into the analysis. A model that wrote "the
 * client is eligible" would otherwise have that sentence copied into a warning,
 * where the reviewer would find it and fail the analysis for containing the
 * very thing this check removed. The reason is named; the words are logged to
 * the server console and go no further.
 *
 * ## Two things about the shape of this module
 *
 * `fetch(` is written out plainly rather than hidden behind an injected alias,
 * because `npm run confidentiality:check` looks for exactly that string. A
 * module that concealed its own socket from the check would pass a check it
 * ought to fail, and the tests stub the global instead.
 *
 * There is no address in this file. `assertLoopback` is the only source of one,
 * which is what the same check enforces for a module allowed to open a socket
 * at all — see ADR-0023. The request is re-checked after the path is joined, so
 * the guarantee does not rest on how a URL was assembled.
 */

import { analyseMatter as deriveAnalysis } from "@/lib/ai/analyst";
import { assertLoopback } from "@/lib/ai/loopback";
import { reviewAnalysis } from "@/lib/ai/reviewer";
import type { AIProvider } from "@/lib/ai/provider";
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

// Re-exported so the module's public surface — and every test written against
// it — survives the machinery moving to summary-rewrite.ts.
export { factsMessage, judgeSummary, tidy, orchelioWroteTheSummary } from "@/lib/ai/summary-rewrite";

/** Recorded on every analysis, so its wording can be explained years later. */
export const LOCAL_PROMPT_VERSION = "local-summary-v1";

/**
 * The OpenAI-compatible chat endpoint.
 *
 * Ollama, llama.cpp's server, LM Studio and vLLM all serve this path, so one
 * implementation reaches every local runner a small firm is likely to install.
 */
const CHAT_PATH = "v1/chat/completions";

/** How long to wait for a model on a laptop before giving up. */
const DEFAULT_TIMEOUT_MS = 30_000;

/** Nothing was used, because no model was consulted. */
const NOTHING_USED: RunUsage = {
  inputTokens: 0,
  outputTokens: 0,
  costCents: 0,
  costMicroEuros: 0,
  costEstimated: false,
};

/** Said when the model's paragraph is the one on screen. */
export const MODEL_WROTE_THE_SUMMARY =
  "The summary's wording was written by a model running on this machine, from figures Orchelio " +
  "had already worked out. Every fact, date, disagreement and gap below was derived from the " +
  "record — the model was not asked what they are, and did not choose any of them.";

export type LocalModelSettings = {
  /** Checked before use, and the only place an address enters this module. */
  url: string;
  /** Which model the server should load. Recorded against every analysis. */
  model: string;
  /** Milliseconds to wait for an answer. */
  timeoutMs?: number;
};

export class LocalAIProvider implements AIProvider {
  readonly name = "local" as const;
  readonly model: string;
  readonly promptVersion = LOCAL_PROMPT_VERSION;
  /** A real model runs. What it is allowed to decide is a separate question. */
  readonly simulated = false;
  /** Nobody invoices for a model on your own machine. */
  readonly billable = false;

  private readonly endpoint: URL;
  private readonly timeoutMs: number;

  constructor(settings: LocalModelSettings) {
    const base = assertLoopback(settings.url);
    // A base with a path is joined to, not replaced: "…/api" and "…/api/" must
    // mean the same server.
    if (!base.pathname.endsWith("/")) base.pathname = `${base.pathname}/`;

    // Checked again after joining. The guarantee is meant to hold whatever a
    // future edit does to the path, not because this particular join is unsafe.
    this.endpoint = assertLoopback(new URL(CHAT_PATH, base).toString());
    this.model = settings.model;
    this.timeoutMs = settings.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async analyseMatter(input: MatterAnalysisInput): Promise<AnalystRun> {
    const derived = deriveAnalysis(input);
    const facts = factsMessage(derived, input);
    const attempt = await this.writeSummary(facts, input.reference);

    if (!attempt.ok) {
      // The usage is the model's, not the answer's. A paragraph that was
      // refused still cost the machine the work of writing it, and recording
      // nothing would make a model that concludes on every matter look free of
      // effort as well as free of charge.
      return {
        analysis: withWarning(derived, orchelioWroteTheSummary(attempt.because)),
        usage: attempt.usage,
      };
    }

    return {
      analysis: withWarning({ ...derived, summary: attempt.summary }, MODEL_WROTE_THE_SUMMARY),
      usage: attempt.usage,
    };
  }

  /**
   * The independent check, and deliberately not the model.
   *
   * A reviewer that is the same model as the analyst agrees with itself, which
   * makes an unchecked analysis look checked — the failure the reviewer exists
   * to prevent. It re-derives what the analysis should have found from the same
   * matter, including scanning the model's paragraph for the outcomes
   * `judgeSummary` already refused. Two passes over one list: if the first ever
   * misses, the analysis comes back needing corrections rather than looking fine.
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
    // whether time ran out instead of reading it off the error. What `fetch`
    // throws on a timeout is a fact about the runtime — measured here as a bare
    // TimeoutError on Node 22, and wrapped in other shapes elsewhere — and the
    // signal knows the answer without anybody having to guess which.
    const deadline = AbortSignal.timeout(this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: deadline,
        body: JSON.stringify({
          model: this.model,
          stream: false,
          // Not determinism — a model is not made deterministic by a setting.
          // It is the least inventive this dial goes, which is what is wanted
          // from something restating figures it was handed.
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
          ? `the model on this machine did not answer within ${Math.round(this.timeoutMs / 1000)} seconds`
          : "the model on this machine could not be reached",
        // Nothing came back, so there is nothing to record.
        usage: NOTHING_USED,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        because: `the model server answered with an error (${response.status})`,
        usage: NOTHING_USED,
      };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { ok: false, because: "the model server's answer was not readable", usage: NOTHING_USED };
    }

    const verdict = judgeSummary(readContent(payload), facts, reference);
    if (!verdict.ok) {
      // The words go to the server console and no further; see the note at the
      // top about why they are never quoted into the analysis.
      console.warn("[orchelio] local model summary set aside:", verdict.because, {
        text: readContent(payload),
      });
      return { ...verdict, usage: localUsage(payload) };
    }

    return { ok: true, summary: verdict.summary, usage: localUsage(payload) };
  }
}

/**
 * What a local run used. The token counts are whatever the server reported;
 * the cost is zero, and true — the electricity and the machine are real costs
 * and are not Orchelio's to estimate.
 */
function localUsage(payload: unknown): RunUsage {
  return { ...readTokenCounts(payload), costCents: 0, costMicroEuros: 0, costEstimated: false };
}

function withWarning(analysis: MatterAnalysisResult, warning: string): MatterAnalysisResult {
  return { ...analysis, warnings: [...analysis.warnings, warning] };
}
