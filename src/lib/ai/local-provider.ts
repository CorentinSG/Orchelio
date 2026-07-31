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
 * Because the job is arithmetic, the model is told no client's name, no matter
 * title, no field value, no date and no filename. See `factsMessage`.
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
import { assertsAnOutcome, reviewAnalysis } from "@/lib/ai/reviewer";
import type { AIProvider } from "@/lib/ai/provider";
import type {
  AnalysisReviewInput,
  AnalystRun,
  MatterAnalysisInput,
  MatterAnalysisResult,
  ReviewerRun,
  RunUsage,
} from "@/lib/ai/types";

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

/** A summary is a paragraph. Anything much longer is the model doing something else. */
const MAX_SUMMARY_CHARS = 900;
const MIN_SUMMARY_CHARS = 40;

/**
 * The instruction, kept free of digits on purpose.
 *
 * `judgeSummary` refuses any figure the model was not given, and the set of
 * figures it was given is taken from the facts message alone. A "write 2 to 4
 * sentences" here would quietly add 2 and 4 to the numbers a model may use.
 */
const SYSTEM_PROMPT = [
  "You rewrite a summary of a legal matter file for a lawyer to read.",
  "",
  "You are given figures that have already been worked out from the firm's records.",
  "Restate them in plain English, in two to four sentences. Reply with the summary and nothing else.",
  "",
  "You must not:",
  "- say whether anyone is eligible, entitled or likely to succeed;",
  "- recommend anything, or say what anyone should do;",
  "- state a deadline, or say that a date is confirmed;",
  "- use any number that is not in the figures you were given;",
  "- add any fact, name, date or link that is not in the figures you were given.",
  "",
  "You are describing what a file contains. Every judgement about it belongs to the lawyer reading you.",
].join("\n");

/** Nothing was used, because no model was consulted. */
const NOTHING_USED: RunUsage = { inputTokens: 0, outputTokens: 0, costCents: 0 };

/** Said when the model's paragraph is the one on screen. */
export const MODEL_WROTE_THE_SUMMARY =
  "The summary's wording was written by a model running on this machine, from figures Orchelio " +
  "had already worked out. Every fact, date, disagreement and gap below was derived from the " +
  "record — the model was not asked what they are, and did not choose any of them.";

/** Said when it is not, and why. Never quotes what the model wrote. */
export function orchelioWroteTheSummary(because: string): string {
  return (
    `The summary's wording is Orchelio's own, derived from the record: ${because}. ` +
    "Nothing else in this analysis is affected, because no other part of it is written by a model."
  );
}

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
            { role: "system", content: SYSTEM_PROMPT },
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
      return { ...verdict, usage: readUsage(payload) };
    }

    return { ok: true, summary: verdict.summary, usage: readUsage(payload) };
  }
}

// ---------------------------------------------------------------------------
// What the model is sent
// ---------------------------------------------------------------------------

/**
 * The figures, as a message.
 *
 * Also the definition of what the model is allowed to say: `judgeSummary` takes
 * the numbers it may use from this text and nowhere else, so anything added
 * here widens what a model may write.
 *
 * ## What is deliberately not in it
 *
 * No client name, no matter title, no field value, no date and no document
 * filename. The model is rewording arithmetic — how many facts, how many
 * documents, how many disagreements — and arithmetic does not need to know
 * whose file it is. The matter's reference is sent because the summary is
 * anchored to it and `judgeSummary` checks the answer still names it.
 *
 * The material never leaves the machine either way. Sending less is not
 * belt-and-braces about that; it is that the smallest thing that does the job
 * is the right thing to send, and a name here would be in the model server's
 * log for no benefit at all.
 */
export function factsMessage(
  analysis: MatterAnalysisResult,
  input: MatterAnalysisInput,
): string {
  const lines = [
    `Matter ${input.reference}.`,
    "",
    "Figures worked out from the firm's records:",
    // Counted off the derived analysis rather than off the matter, so this
    // message and the summary beneath it can never disagree — a firm that
    // switched a feature off has fewer facts, and both lines say so together.
    `- ${analysis.keyFacts.length} fact(s) are listed in the analysis.`,
    `- ${input.documents.length} document(s) are on file.`,
  ];

  lines.push(
    analysis.contradictions.length === 0
      ? "- Nothing on the record disagrees with anything else on the record."
      : `- ${analysis.contradictions.length} point(s) on the record disagree with another part of the file: ${analysis.contradictions.map((item) => item.subject).join("; ")}.`,
  );

  if (analysis.missingDocuments.length > 0) {
    lines.push(
      `- ${analysis.missingDocuments.length} document(s) usually held on this kind of matter are not on file: ${analysis.missingDocuments.map((item) => item.label).join("; ")}.`,
    );
  }

  lines.push(
    analysis.sufficiency === "more_information_required"
      ? "- There is too little on file for this to be usefully reviewed yet."
      : "- There is enough on file for a person to review it.",
  );

  lines.push("", "Orchelio's own summary of those figures:", analysis.summary);
  lines.push("", "Rewrite that summary in plainer words.");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// What comes back
// ---------------------------------------------------------------------------

/** Anything that looks like a link or an address a model could have invented. */
const LINK_LIKE = /(https?:\/\/|www\.|\S+@\S+\.\w)/i;

/** Runs of digits, which is the only kind of invented figure this can catch. */
const DIGITS = /\d+/g;

export type SummaryVerdict =
  | { ok: true; summary: string }
  | { ok: false; because: string };

/**
 * Whether a model's paragraph may be used.
 *
 * The checks are ordered by how much a reader would be harmed if the paragraph
 * got through: an asserted outcome first, then an invented figure, then the
 * rest. A refusal names its reason in words a lawyer can read, because the
 * reason is shown on the analysis.
 *
 * What it cannot catch, and the analysis does not claim otherwise: a figure
 * written in words ("three documents"), and an invented fact carrying no number
 * at all. The defence against those is that the model is only ever restating a
 * paragraph it was handed, and that the paragraph beside it is the derived one.
 */
export function judgeSummary(raw: string, facts: string, reference: string): SummaryVerdict {
  const summary = tidy(raw);

  if (summary === "") return { ok: false, because: "the model answered with nothing" };
  if (summary.length > MAX_SUMMARY_CHARS) {
    return { ok: false, because: "the model's answer ran far longer than a summary" };
  }
  if (summary.length < MIN_SUMMARY_CHARS) {
    return { ok: false, because: "the model's answer was too short to be a summary" };
  }

  const outcome = assertsAnOutcome(summary);
  if (outcome) {
    return { ok: false, because: `the model's answer read as ${outcome}, which an analysis may not contain` };
  }

  const allowed = new Set(facts.match(DIGITS) ?? []);
  for (const figure of summary.match(DIGITS) ?? []) {
    if (!allowed.has(figure)) {
      return {
        ok: false,
        because: `the model's answer used the figure ${figure}, which is not among the ones it was given`,
      };
    }
  }

  if (LINK_LIKE.test(summary)) {
    return { ok: false, because: "the model's answer contained a link or an address, which the record does not" };
  }

  if (!summary.includes(reference)) {
    return { ok: false, because: `the model's answer did not name ${reference}` };
  }

  return { ok: true, summary };
}

/**
 * Removes the packaging a model puts around an answer, and nothing else.
 *
 * A code fence and a "Here is the summary:" label are the model failing to
 * follow "reply with the summary and nothing else", not the model saying
 * something. Both are removed mechanically. Anything past that is judged as
 * written — this does not rewrite prose, because a check that repaired its
 * input would be checking something the reader never sees.
 */
export function tidy(raw: string): string {
  let text = raw.trim();

  const fenced = /^```[a-z]*\n([\s\S]*?)\n?```$/i.exec(text);
  if (fenced?.[1] !== undefined) text = fenced[1].trim();

  const lines = text.split("\n");
  const first = lines[0]?.trim() ?? "";
  if (lines.length > 1 && first.endsWith(":") && !first.includes(".") && first.length < 60) {
    text = lines.slice(1).join("\n").trim();
  }

  return text.replace(/\s+/g, " ").trim();
}

/** The assistant's text, from a response whose shape is not guaranteed. */
function readContent(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) return "";
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const message = (choices[0] as { message?: unknown }).message;
  if (typeof message !== "object" || message === null) return "";
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" ? content : "";
}

/**
 * What the run used, as the server reported it.
 *
 * A server that reports nothing is recorded as zero rather than guessed at.
 * Both screens that show these figures say they come from the model server, so
 * a zero reads as "it did not say" rather than as a measurement.
 */
function readUsage(payload: unknown): RunUsage {
  const usage =
    typeof payload === "object" && payload !== null
      ? (payload as { usage?: unknown }).usage
      : undefined;
  const counted = (key: string): number => {
    if (typeof usage !== "object" || usage === null) return 0;
    const value = (usage as Record<string, unknown>)[key];
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
  };

  return {
    inputTokens: counted("prompt_tokens"),
    outputTokens: counted("completion_tokens"),
    // Zero, and true. What a local model actually costs is electricity and the
    // machine it runs on, neither of which Orchelio can see or should invent.
    costCents: 0,
  };
}

function withWarning(analysis: MatterAnalysisResult, warning: string): MatterAnalysisResult {
  return { ...analysis, warnings: [...analysis.warnings, warning] };
}
