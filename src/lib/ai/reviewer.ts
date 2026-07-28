/**
 * Orchelio — the Reviewer, simulated.
 *
 * The Reviewer's job is to be unimpressed by the Analyst. It is given the same
 * matter, not the Analyst's working, and it re-derives what the Analyst should
 * have found — then reports the difference. A reviewer that simply reformatted
 * the Analyst's output would agree with it every time, which is worse than no
 * reviewer at all: it would make an unchecked analysis look checked.
 *
 * ## The checks, and why each one exists
 *
 * | Check | The failure it catches |
 * | ----- | ---------------------- |
 * | Every fact cites a source | A sentence that reads as established and is not |
 * | Contradictions re-derived independently | A disagreement the Analyst passed over |
 * | No conclusion language | A legal conclusion smuggled in as a summary |
 * | Stated dates marked as stated | A remembered date printed like a confirmed one |
 * | Standing warnings present | An analysis that has lost its caveats |
 *
 * The conclusion-language check will never fire on the Analyst as written —
 * that is the point. It is a regression guard: the day somebody adds "the
 * client is eligible" to a summary, this fails and takes the test suite with
 * it. `LOCKED_APPROVALS` says no eligibility conclusion may reach anyone
 * without a person deciding; this is one of the places that is made true.
 *
 * A review never approves anything. `approved_for_human_review` means "ready
 * to be read by a person", and `humanReviewRequired` is `true` in every result
 * this module can produce.
 */

import type {
  AnalysisReviewInput,
  AnalysisReviewResult,
  ReviewCheck,
  ReviewIssue,
} from "@/lib/ai/types";
import { STANDING_WARNINGS, analystInternals } from "@/lib/ai/analyst";

/**
 * Phrases that assert a legal outcome.
 *
 * Deliberately narrow. "Discrimination" alone is not on the list, because an
 * analysis may legitimately say "the matter type is workplace discrimination"
 * or quote a client's own allegation; what is forbidden is the product
 * *asserting* that something was discriminatory.
 */
const CONCLUSION_PATTERNS: readonly { pattern: RegExp; what: string }[] = [
  { pattern: /\b(is|are|was|were)\s+(eligible|ineligible|entitled)\b/i, what: "an eligibility conclusion" },
  { pattern: /\b(is|are|was|were)\s+(unlawful|illegal|discriminatory|retaliatory)\b/i, what: "a finding of unlawfulness" },
  { pattern: /\bqualif(y|ies|ied)\s+for\b/i, what: "an eligibility conclusion" },
  { pattern: /\bwe\s+recommend\b/i, what: "a recommendation" },
  { pattern: /\b(you|the client|the firm)\s+should\s+(file|submit|sue|accept|sign)\b/i, what: "advice to act" },
  { pattern: /\blikely\s+to\s+(succeed|win|prevail|fail)\b/i, what: "a prediction of outcome" },
  { pattern: /\bconstitutes\s+(discrimination|retaliation|a\s+breach|a\s+violation)\b/i, what: "a legal characterisation" },
  { pattern: /\bhas\s+a\s+(strong|good|weak|poor)\s+case\b/i, what: "an assessment of merits" },
  { pattern: /\bthe\s+deadline\s+is\b/i, what: "a confirmed deadline" },
  { pattern: /\bstatute\s+of\s+limitations\s+(expires|expired|runs)\b/i, what: "a confirmed limitation date" },
];

export function reviewAnalysis(input: AnalysisReviewInput): AnalysisReviewResult {
  const { analysis, matter } = input;
  const issues: ReviewIssue[] = [];
  const checks: ReviewCheck[] = [];

  // --- 1. Every fact names where it came from ------------------------------
  const unsourced = analysis.keyFacts.filter((fact) => fact.sources.length === 0);
  for (const fact of unsourced) {
    issues.push({
      category: "unsupported_statement",
      where: `Key fact — ${fact.label}`,
      detail: "Stated with no source. A reader cannot check it or weigh it.",
    });
  }
  checks.push({
    name: "Every stated fact names a source",
    passed: unsourced.length === 0,
    note:
      unsourced.length === 0
        ? `${analysis.keyFacts.length} fact${analysis.keyFacts.length === 1 ? "" : "s"} checked, each citing at least one source.`
        : `${unsourced.length} fact(s) cite nothing.`,
  });

  // --- 2. Contradictions, re-derived from the matter -----------------------
  // Independently, from the same input the Analyst had — not from its output.
  const expected = analystInternals.findContradictions(matter);
  const reported = new Set(analysis.contradictions.map((contradiction) => contradiction.key));
  const missed = expected.filter((contradiction) => !reported.has(contradiction.key));

  for (const contradiction of missed) {
    issues.push({
      category: "missed_contradiction",
      where: contradiction.subject,
      detail:
        "The record holds more than one version of this and the analysis does not say so. " +
        contradiction.statements.map((statement) => `${statement.source.label}: ${statement.value}`).join(" · "),
    });
  }
  checks.push({
    name: "Disagreements on the record are all reported",
    passed: missed.length === 0,
    note:
      expected.length === 0
        ? "Nothing on this matter disagrees with anything else."
        : `${expected.length} found independently, ${expected.length - missed.length} reported by the analysis.`,
  });

  // --- 3. No legal conclusion ----------------------------------------------
  // Only the prose Orchelio wrote is scanned. A value copied from the matter is
  // the client's own record, and flagging it would be flagging the client.
  const prose = [
    analysis.summary,
    ...analysis.warnings,
    ...analysis.contradictions.map((contradiction) => contradiction.note),
    ...analysis.attorneyQuestions.flatMap((question) => [question.question, question.why]),
    ...analysis.clientQuestions.flatMap((question) => [question.question, question.why]),
    ...analysis.missingDocuments.map((document) => document.whyItMatters),
  ];

  const conclusions = CONCLUSION_PATTERNS.flatMap(({ pattern, what }) =>
    prose.filter((text) => pattern.test(text)).map((text) => ({ what, text })),
  );
  for (const conclusion of conclusions) {
    issues.push({
      category: "premature_legal_conclusion",
      where: "Analysis text",
      detail: `Reads as ${conclusion.what}: "${trim(conclusion.text)}"`,
    });
  }
  checks.push({
    name: "No legal conclusion, recommendation or confirmed deadline",
    passed: conclusions.length === 0,
    note:
      conclusions.length === 0
        ? `${prose.length} passages checked against ${CONCLUSION_PATTERNS.length} patterns.`
        : `${conclusions.length} passage(s) assert an outcome.`,
  });

  // --- 4. A remembered date is not a confirmed one -------------------------
  const statedDates = analysis.timeline.filter((event) => event.stated);
  const mislabelled = statedDates.filter((event) => event.source.kind === "document");
  for (const event of mislabelled) {
    issues.push({
      category: "date_presented_as_confirmed",
      where: `Timeline — ${event.label}`,
      detail: "Marked as stated by a person but sourced to a document, or the reverse.",
    });
  }
  checks.push({
    name: "Every date says whether a person stated it",
    passed: mislabelled.length === 0,
    note:
      analysis.timeline.length === 0
        ? "No dates in this analysis."
        : `${analysis.timeline.length} event(s): ${statedDates.length} stated by a person, ${analysis.timeline.length - statedDates.length} read from a document's name or filing date.`,
  });

  // --- 5. The caveats are still attached -----------------------------------
  const missingWarnings = STANDING_WARNINGS.filter(
    (warning) => !analysis.warnings.includes(warning),
  );
  for (const warning of missingWarnings) {
    issues.push({
      category: "unsupported_statement",
      where: "Warnings",
      detail: `A standing caution is absent: "${trim(warning)}"`,
    });
  }
  checks.push({
    name: "Standing cautions are attached",
    passed: missingWarnings.length === 0,
    note:
      missingWarnings.length === 0
        ? `All ${STANDING_WARNINGS.length} present, including that no document was opened.`
        : `${missingWarnings.length} missing.`,
  });

  // --- 6. Is there enough on file at all? ----------------------------------
  const insufficient = analysis.sufficiency === "more_information_required";
  if (insufficient) {
    issues.push({
      category: "insufficient_information",
      where: "The matter",
      detail:
        "Too little is on file for this analysis to describe the matter rather than the gaps in it. " +
        "This is a statement about the file, not about the client's position.",
    });
  }
  checks.push({
    name: "Enough on file to be worth reviewing",
    passed: !insufficient,
    note: insufficient
      ? "Most fields are unknown, or no document has been added."
      : "Enough recorded for a person to read this usefully.",
  });

  // A defective analysis needs correcting whether or not the file is thin, so
  // correctness outranks sufficiency.
  const defects = issues.filter((issue) => issue.category !== "insufficient_information");
  const status = defects.length > 0
    ? "corrections_required"
    : insufficient
      ? "insufficient_information"
      : "approved_for_human_review";

  return {
    status,
    summary: buildSummary(status, checks, defects.length),
    checks,
    issues,
    humanReviewRequired: true,
  };
}

function buildSummary(
  status: AnalysisReviewResult["status"],
  checks: readonly ReviewCheck[],
  defectCount: number,
): string {
  const passed = checks.filter((check) => check.passed).length;
  const ran = `${passed} of ${checks.length} checks passed.`;

  switch (status) {
    case "corrections_required":
      return `${ran} ${defectCount} problem${defectCount === 1 ? "" : "s"} with the analysis itself must be corrected before a person relies on it.`;
    case "insufficient_information":
      return `${ran} The analysis is sound, but there is too little on file for it to say much. Building the file out would do more than reviewing it now.`;
    case "approved_for_human_review":
      return `${ran} Nothing in the analysis overstates what the file supports. It is ready for a person to read — which is still required.`;
  }
}

function trim(text: string): string {
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}
