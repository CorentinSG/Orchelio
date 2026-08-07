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
  "Tu réécris le résumé d'un dossier juridique pour qu'un avocat le lise.",
  "",
  "On te donne des chiffres déjà établis depuis les enregistrements du cabinet.",
  "Redis-les en français simple, en deux à quatre phrases. Réponds avec le résumé et rien d'autre.",
  "",
  "Tu ne dois pas :",
  "- dire si quelqu'un est éligible, a un droit ou a des chances de succès ;",
  "- recommander quoi que ce soit, ni dire ce que quiconque devrait faire ;",
  "- énoncer une échéance, ni dire qu'une date est confirmée ;",
  "- utiliser un nombre qui n'est pas dans les chiffres fournis ;",
  "- ajouter un fait, un nom, une date ou un lien qui n'est pas dans les chiffres fournis.",
  "",
  "Tu décris ce qu'un dossier contient. Tout jugement sur ce dossier appartient à l'avocat qui te lit.",
].join("\n");

/** Said when the model's paragraph was refused, and why. Never quotes it. */
export function orchelioWroteTheSummary(because: string): string {
  return (
    `La formulation du résumé est celle d'Orchelio, dérivée du dossier : ${because}. ` +
    "Rien d'autre dans cette analyse n'est concerné, car aucune autre partie n'est rédigée par un modèle."
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
    `Dossier ${input.reference}.`,
    "",
    "Chiffres établis depuis les enregistrements du cabinet :",
    // Counted off the derived analysis rather than off the matter, so this
    // message and the summary beneath it can never disagree — a firm that
    // switched a feature off has fewer facts, and both lines say so together.
    `- ${analysis.keyFacts.length} fait(s) sont listés dans l’analyse.`,
    `- ${input.documents.length} document(s) sont au dossier.`,
  ];

  lines.push(
    analysis.contradictions.length === 0
      ? "- Rien au dossier ne contredit quoi que ce soit d’autre au dossier."
      : `- ${analysis.contradictions.length} point(s) du dossier contredisent une autre partie du dossier : ${analysis.contradictions.map((item) => item.subject).join(" ; ")}.`,
  );

  if (analysis.missingDocuments.length > 0) {
    lines.push(
      `- ${analysis.missingDocuments.length} document(s) habituellement présents sur ce type de dossier ne sont pas au dossier : ${analysis.missingDocuments.map((item) => item.label).join(" ; ")}.`,
    );
  }

  lines.push(
    analysis.sufficiency === "more_information_required"
      ? "- Il y a trop peu au dossier pour qu’une relecture soit encore utile."
      : "- Il y a assez au dossier pour qu’une personne le relise.",
  );

  lines.push("", "Le résumé de ces chiffres par Orchelio :", analysis.summary);
  lines.push("", "Réécris ce résumé en mots plus simples.");

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

  if (summary === "") return { ok: false, because: "le modèle a répondu par du vide" };
  if (summary.length > MAX_SUMMARY_CHARS) {
    return { ok: false, because: "la réponse du modèle dépassait de loin la longueur d’un résumé" };
  }
  if (summary.length < MIN_SUMMARY_CHARS) {
    return { ok: false, because: "la réponse du modèle était trop courte pour être un résumé" };
  }

  const outcome = assertsAnOutcome(summary);
  if (outcome) {
    return { ok: false, because: `la réponse du modèle se lisait comme ${outcome}, ce qu’une analyse ne peut pas contenir` };
  }

  const allowed = new Set(facts.match(DIGITS) ?? []);
  for (const figure of summary.match(DIGITS) ?? []) {
    if (!allowed.has(figure)) {
      return {
        ok: false,
        because: `la réponse du modèle utilisait le nombre ${figure}, qui n’est pas parmi ceux fournis`,
      };
    }
  }

  if (LINK_LIKE.test(summary)) {
    return { ok: false, because: "la réponse du modèle contenait un lien ou une adresse, que le dossier ne contient pas" };
  }

  if (!summary.includes(reference)) {
    return { ok: false, because: `la réponse du modèle ne nommait pas ${reference}` };
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
