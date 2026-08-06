/**
 * Orchelio — the one job a language model is given, shared by every provider
 * that gives it.
 *
 * The local provider (ADR-0024) and the hosted Mistral provider (ADR-0027)
 * make the same narrow request: here are figures Orchelio has already worked
 * out — say them in plainer words. This module holds everything about that
 * request which must not be allowed to drift between providers: the
 * instruction, the message, the judgement of what comes back, and the
 * sentences an analysis uses to say who wrote its summary.
 *
 * Two implementations of the same contract already diverged once in this
 * codebase's history (the approval paths, ADR-0014), and the cure is the
 * same here as there: one implementation, several callers.
 *
 * Nothing in this module opens a socket. The providers do that, each under
 * its own entry in the egress allow-list, and this module is what they call
 * before and after.
 */

import type { MatterAnalysisInput, MatterAnalysisResult } from "@/lib/ai/types";
import { assertsAnOutcome } from "@/lib/ai/reviewer";

/** A summary is a paragraph. Anything much longer is the model doing something else. */
export const MAX_SUMMARY_CHARS = 900;
export const MIN_SUMMARY_CHARS = 40;

/**
 * The instruction, kept free of digits on purpose.
 *
 * `judgeSummary` refuses any figure the model was not given, and the set of
 * figures it was given is taken from the facts message alone. A "write 2 to 4
 * sentences" here would quietly add 2 and 4 to the numbers a model may use.
 */
export const REWRITE_SYSTEM_PROMPT = [
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

/** Said when the model's paragraph was refused, and why. Never quotes it. */
export function orchelioWroteTheSummary(because: string): string {
  return (
    `The summary's wording is Orchelio's own, derived from the record: ${because}. ` +
    "Nothing else in this analysis is affected, because no other part of it is written by a model."
  );
}

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
 * For the local provider the material never leaves the machine either way.
 * For the hosted one this list is the whole of what does leave, which is why
 * the register in Settings → Confidentiality quotes it — widening this
 * message widens that register row, in the same commit.
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

/** The assistant's text, from a chat response whose shape is not guaranteed. */
export function readContent(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) return "";
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const message = (choices[0] as { message?: unknown }).message;
  if (typeof message !== "object" || message === null) return "";
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" ? content : "";
}

/**
 * The token counts a chat server reported, and nothing about money.
 *
 * A server that reports nothing is recorded as zero rather than guessed at —
 * a zero reads as "it did not say", and both screens that show these figures
 * say where they come from. What the tokens cost is the caller's question:
 * nothing for a local model, a price-table estimate for a hosted one.
 */
export function readTokenCounts(payload: unknown): { inputTokens: number; outputTokens: number } {
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
  };
}
