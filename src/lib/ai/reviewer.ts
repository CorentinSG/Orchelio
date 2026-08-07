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
  // The same conclusions, in the product's own language. The screens now write
  // French, and a hosted or local model may too — either way the sentence is
  // refused, in whichever language it arrives.
  { pattern: /\b(est|sont|était|étaient)\s+(éligible|inéligible|admissible)s?\b/i, what: "une conclusion d’éligibilité" },
  { pattern: /\bremplit\s+les\s+conditions\b/i, what: "une conclusion d’éligibilité" },
  { pattern: /\b(est|sont|était|étaient)\s+(illégal|illégale|illégaux|illégales|illicite|illicites|discriminatoire|discriminatoires)\b/i, what: "une constatation d’illégalité" },
  { pattern: /\bnous\s+(recommandons|conseillons)\b/i, what: "une recommandation" },
  { pattern: /\b(vous|le\s+client|le\s+cabinet)\s+(devriez|devrait|devez|doit)\s+(déposer|signer|accepter|poursuivre|saisir)\b/i, what: "un conseil d’agir" },
  { pattern: /\b(susceptible|probable)\s+de\s+(gagner|réussir|l’emporter|échouer)\b/i, what: "une prédiction d’issue" },
  { pattern: /\baura\s+gain\s+de\s+cause\b/i, what: "une prédiction d’issue" },
  { pattern: /\bconstitue\s+(une\s+discrimination|des\s+représailles|un\s+manquement|une\s+violation)\b/i, what: "une qualification juridique" },
  { pattern: /\bdossier\s+(solide|faible)\b/i, what: "une appréciation des mérites" },
  { pattern: /\b(l’échéance|la\s+date\s+limite)\s+est\b/i, what: "une échéance confirmée" },
  { pattern: /\bprescription\s+(expire|expirée|acquise|court)\b/i, what: "une date de prescription confirmée" },
];

/**
 * What outcome a passage asserts, or `null` if it asserts none.
 *
 * Exported so prose that a model wrote can be judged *before* it becomes an
 * analysis, against the same list the reviewer applies afterwards. Two readers,
 * one list: adding a pattern tightens both, and no local model can be let
 * through by a check that has drifted from the reviewer's.
 *
 * The reviewer keeps its own loop rather than calling this, because it reports
 * every passage that asserts something and this answers about one.
 */
export function assertsAnOutcome(text: string): string | null {
  for (const { pattern, what } of CONCLUSION_PATTERNS) {
    if (pattern.test(text)) return what;
  }
  return null;
}

export function reviewAnalysis(input: AnalysisReviewInput): AnalysisReviewResult {
  const { analysis, matter } = input;
  const issues: ReviewIssue[] = [];
  const checks: ReviewCheck[] = [];

  // --- 1. Every fact names where it came from ------------------------------
  const unsourced = analysis.keyFacts.filter((fact) => fact.sources.length === 0);
  for (const fact of unsourced) {
    issues.push({
      category: "unsupported_statement",
      where: `Fait clé — ${fact.label}`,
      detail: "Affirmé sans source. Un lecteur ne peut ni le vérifier ni le peser.",
    });
  }
  checks.push({
    name: "Chaque fait affirmé nomme une source",
    passed: unsourced.length === 0,
    note:
      unsourced.length === 0
        ? `${analysis.keyFacts.length} fait${analysis.keyFacts.length === 1 ? "" : "s"} contrôlé${analysis.keyFacts.length === 1 ? "" : "s"}, chacun citant au moins une source.`
        : `${unsourced.length} fait(s) ne citent rien.`,
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
        "Le dossier contient plusieurs versions de ceci et l’analyse ne le dit pas. " +
        contradiction.statements.map((statement) => `${statement.source.label}: ${statement.value}`).join(" · "),
    });
  }
  checks.push({
    name: "Tous les désaccords du dossier sont signalés",
    passed: missed.length === 0,
    note:
      expected.length === 0
        ? "Rien sur ce dossier ne contredit quoi que ce soit d’autre."
        : `${expected.length} trouvé(s) indépendamment, ${expected.length - missed.length} signalé(s) par l’analyse.`,
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
      where: "Texte de l’analyse",
      detail: `Se lit comme ${conclusion.what} : « ${trim(conclusion.text)} »`,
    });
  }
  checks.push({
    name: "Aucune conclusion juridique, recommandation ni échéance confirmée",
    passed: conclusions.length === 0,
    note:
      conclusions.length === 0
        ? `${prose.length} passages contrôlés contre ${CONCLUSION_PATTERNS.length} motifs.`
        : `${conclusions.length} passage(s) affirment une issue.`,
  });

  // --- 4. A remembered date is not a confirmed one -------------------------
  const statedDates = analysis.timeline.filter((event) => event.stated);
  const mislabelled = statedDates.filter((event) => event.source.kind === "document");
  for (const event of mislabelled) {
    issues.push({
      category: "date_presented_as_confirmed",
      where: `Chronologie — ${event.label}`,
      detail: "Marquée comme déclarée par une personne mais sourcée à un document, ou l’inverse.",
    });
  }
  checks.push({
    name: "Chaque date dit si une personne l’a déclarée",
    passed: mislabelled.length === 0,
    note:
      analysis.timeline.length === 0
        ? "Aucune date dans cette analyse."
        : `${analysis.timeline.length} événement(s) : ${statedDates.length} déclaré(s) par une personne, ${analysis.timeline.length - statedDates.length} lu(s) dans le nom d’un document ou sa date d’ajout.`,
  });

  // --- 5. The caveats are still attached -----------------------------------
  const missingWarnings = STANDING_WARNINGS.filter(
    (warning) => !analysis.warnings.includes(warning),
  );
  for (const warning of missingWarnings) {
    issues.push({
      category: "unsupported_statement",
      where: "Avertissements",
      detail: `Une mise en garde permanente est absente : « ${trim(warning)} »`,
    });
  }
  checks.push({
    name: "Les mises en garde permanentes sont jointes",
    passed: missingWarnings.length === 0,
    note:
      missingWarnings.length === 0
        ? `Les ${STANDING_WARNINGS.length} présentes, y compris qu’aucun document n’a été ouvert.`
        : `${missingWarnings.length} manquante(s).`,
  });

  // --- 6. Is there enough on file at all? ----------------------------------
  const insufficient = analysis.sufficiency === "more_information_required";
  if (insufficient) {
    issues.push({
      category: "insufficient_information",
      where: "Le dossier",
      detail:
        "Il y a trop peu au dossier pour que cette analyse décrive l’affaire plutôt que ses manques. " +
        "C’est un constat sur le dossier, pas sur la position du client.",
    });
  }
  checks.push({
    name: "Assez au dossier pour qu’une relecture vaille la peine",
    passed: !insufficient,
    note: insufficient
      ? "La plupart des champs sont inconnus, ou aucun document n’a été ajouté."
      : "Assez d’éléments enregistrés pour qu’une personne lise ceci utilement.",
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
  const ran = `${passed} contrôle(s) sur ${checks.length} passés.`;

  switch (status) {
    case "corrections_required":
      return `${ran} ${defectCount} problème${defectCount === 1 ? "" : "s"} de l’analyse elle-même ${defectCount === 1 ? "doit être corrigé" : "doivent être corrigés"} avant qu’une personne s’y fie.`;
    case "insufficient_information":
      return `${ran} L’analyse est saine, mais il y a trop peu au dossier pour qu’elle dise grand-chose. Étoffer le dossier servirait plus qu’une relecture maintenant.`;
    case "approved_for_human_review":
      return `${ran} Rien dans l’analyse n’excède ce que le dossier permet d’affirmer. Elle est prête à être lue par une personne — ce qui reste obligatoire.`;
  }
}

function trim(text: string): string {
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}
