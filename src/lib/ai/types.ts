/**
 * Orchelio — the vocabulary of an analysis.
 *
 * These types are the contract between whatever produces an analysis and every
 * screen that shows one. `MockAIProvider` fills them today; an Anthropic
 * provider would fill the same shapes tomorrow, and no page would change.
 *
 * ## What is deliberately absent
 *
 * There is no `conclusion` field, and no `recommendation`, `eligibility` or
 * `advice`. That is not an omission to be corrected later: Orchelio's locked
 * approval rules forbid an eligibility conclusion or a legal analysis reaching
 * a client without a person deciding, and the surest way to keep a conclusion
 * out of the product is to give it nowhere to live.
 *
 * What an analysis may say is: here is what the file contains, here is where
 * each piece came from, here is what disagrees, here is what is absent, and
 * here is what somebody should ask. Everything past that is a lawyer's work.
 */

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

/** Where a piece of information came from. Every fact carries at least one. */
export const SOURCE_KINDS = ["intake", "document", "matter_field"] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

export type FactSource = {
  kind: SourceKind;
  /** What to show: a filename, a field label, "Client intake". */
  label: string;
  /** Whether a person has confirmed this source is what it claims to be. */
  verified?: boolean;
};

/**
 * How well supported a fact is.
 *
 * A band rather than a bare number, because "0.62" tells a lawyer nothing they
 * can act on and reads as precision the product does not have. The band says
 * what actually matters: how many independent places this came from, and
 * whether anybody has checked them.
 */
export const SUPPORT_LEVELS = [
  /**
   * A document's own name carries this value, and it matches the record.
   *
   * The strongest support available, and still not strong: the *name* agrees.
   * Nothing here has opened a document.
   */
  "document_agrees",
  /** A checked document of the kind this is normally read from is on file. */
  "document_on_file_checked",
  /** The same, but nobody has confirmed the document is what it claims to be. */
  "document_on_file",
  /**
   * The record and the intake say the same thing.
   *
   * Consistency, not corroboration: both came from the client, so saying it
   * twice does not make it twice as likely.
   */
  "stated_twice",
  /** Somebody said it once. Nothing on file bears on it either way. */
  "stated_only",
  /** The sources disagree. The disagreement is reported, never resolved. */
  "disputed",
] as const;
export type SupportLevel = (typeof SUPPORT_LEVELS)[number];

export type KeyFact = {
  key: string;
  label: string;
  value: string;
  support: SupportLevel;
  sources: FactSource[];
  /**
   * A simulated score, 0–1.
   *
   * Derived from `support` by a fixed table — it is a restatement of the band,
   * not an independent measurement, and it exists because the specification
   * asks for a confidence figure. Every screen that shows it labels it
   * "simulated". Do not let it grow into anything a decision rests on.
   */
  simulatedConfidence: number;
};

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export type TimelineEvent = {
  /** ISO date. */
  date: string;
  label: string;
  source: FactSource;
  /**
   * True when the date was stated by a person rather than read off a document.
   * The timeline shows both, and says which is which — a date somebody
   * remembers and a date printed on a notice are not the same evidence.
   */
  stated: boolean;
};

// ---------------------------------------------------------------------------
// Gaps and disagreements
// ---------------------------------------------------------------------------

export type MissingDocument = {
  key: string;
  label: string;
  /** Why this document is usually needed. Never why its absence is fatal. */
  whyItMatters: string;
};

export type Contradiction = {
  key: string;
  /** What the disagreement is about, e.g. "Date of last entry". */
  subject: string;
  /** Every version on the record, each with where it came from. */
  statements: { value: string; source: FactSource }[];
  /**
   * What to do about it — always "ask", never "the correct answer is".
   * Resolving a contradiction means deciding which account to believe, which
   * is a judgement about a client's credibility and not Orchelio's to make.
   */
  note: string;
};

export type Question = {
  question: string;
  /** Why it is worth asking. Gives the reader a reason to keep or drop it. */
  why: string;
};

// ---------------------------------------------------------------------------
// The analysis
// ---------------------------------------------------------------------------

/**
 * Whether there is enough on file to be worth an attorney's time yet.
 *
 * Not a judgement about the matter — a judgement about the file. "More
 * information required" means Orchelio could not say much, not that the client
 * has a weak case.
 */
export const SUFFICIENCY = ["sufficient_for_review", "more_information_required"] as const;
export type Sufficiency = (typeof SUFFICIENCY)[number];

export type MatterAnalysisResult = {
  /** Factual, in plain words. Contains no conclusion and no recommendation. */
  summary: string;
  sufficiency: Sufficiency;
  keyFacts: KeyFact[];
  timeline: TimelineEvent[];
  missingDocuments: MissingDocument[];
  contradictions: Contradiction[];
  attorneyQuestions: Question[];
  clientQuestions: Question[];
  /** Standing cautions plus anything specific to this matter. */
  warnings: string[];
  /** AI features the firm enabled that produced something here. */
  featuresApplied: string[];
  /**
   * Features the firm enabled that produced nothing, and why.
   *
   * Shown rather than hidden: a firm that switched on inconsistency detection
   * should be told "nothing disagreed", not left to wonder whether it ran.
   */
  featuresQuiet: { feature: string; because: string }[];
};

export type AnalysisDocument = {
  filename: string;
  category: string;
  receivedAt: string;
  verified: boolean;
};

export type MatterAnalysisInput = {
  reference: string;
  title: string;
  practiceAreaKey: string;
  matterTypeKey: string;
  status: string;
  representationSide: string | null;
  /** The practice-area fields recorded on the matter. */
  fields: Record<string, unknown>;
  /** The client's own answers, in their own words. */
  intake: Record<string, string>;
  documents: readonly AnalysisDocument[];
  /** AI feature keys this firm switched on during onboarding. */
  enabledFeatures: readonly string[];
  /** The instant the analysis is run from, so a run is reproducible. */
  now: Date;
};

// ---------------------------------------------------------------------------
// The review
// ---------------------------------------------------------------------------

/**
 * What a reviewer looks for.
 *
 * Every category is a way an analysis can be wrong that a reader would not
 * notice: a sentence that sounds sourced but is not, a disagreement nobody
 * flagged, a conclusion smuggled in as a summary, a remembered date printed
 * like a confirmed one.
 */
export const REVIEW_ISSUE_CATEGORIES = [
  "unsupported_statement",
  "missed_contradiction",
  "premature_legal_conclusion",
  "insufficient_information",
  "date_presented_as_confirmed",
] as const;
export type ReviewIssueCategory = (typeof REVIEW_ISSUE_CATEGORIES)[number];

export type ReviewIssue = {
  category: ReviewIssueCategory;
  /** Which part of the analysis, in words the reader can locate. */
  where: string;
  detail: string;
};

export const REVIEW_STATUSES = [
  "approved_for_human_review",
  "corrections_required",
  "insufficient_information",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export type ReviewCheck = {
  name: string;
  passed: boolean;
  note: string;
};

export type AnalysisReviewResult = {
  status: ReviewStatus;
  /** Factual summary of what the review found. */
  summary: string;
  /** Every check that was run, passed or not — so a clean review is evidence. */
  checks: ReviewCheck[];
  issues: ReviewIssue[];
  /**
   * Always true, and stored rather than assumed.
   *
   * "Approved for human review" is the reviewer saying an analysis is ready to
   * be read by a person. It is not an approval of anything, and no value of
   * this field other than `true` exists.
   */
  humanReviewRequired: true;
};

export type AnalysisReviewInput = {
  analysis: MatterAnalysisResult;
  /** The same input the analyst saw, so the review is independent, not a copy. */
  matter: MatterAnalysisInput;
};

// ---------------------------------------------------------------------------
// What a run used
// ---------------------------------------------------------------------------

/**
 * What one run consumed, reported by whatever produced it.
 *
 * Returned from the run rather than declared once per provider, because the
 * providers know different things: the simulation invents plausible figures,
 * a local model reports whatever its server counted, and the hosted one
 * reports what it is about to bill for. A single set of numbers on the
 * provider would have to be a guess for at least one of them.
 *
 * `costCents` is money, rounded for display; `costMicroEuros` carries the
 * precision (1 cent = 10 000 µ€), because a hosted call costs a fraction of a
 * cent and an integer-cent zero would read as "free". A local model's cost is
 * zero and that is a fact, not a placeholder — the electricity and the
 * machine are real costs and are not Orchelio's to estimate. `costEstimated`
 * is true when the figure came from a price table rather than an invoice.
 */
export type RunUsage = {
  inputTokens: number;
  outputTokens: number;
  costCents: number;
  costMicroEuros: number;
  costEstimated: boolean;
};

export type AnalystRun = { analysis: MatterAnalysisResult; usage: RunUsage };
export type ReviewerRun = { review: AnalysisReviewResult; usage: RunUsage };

// ---------------------------------------------------------------------------

/** The score shown beside a support band. Simulated; see `KeyFact`. */
export const CONFIDENCE_BY_SUPPORT: Record<SupportLevel, number> = {
  document_agrees: 0.85,
  document_on_file_checked: 0.6,
  document_on_file: 0.45,
  stated_twice: 0.4,
  stated_only: 0.3,
  disputed: 0.15,
};

export function supportLabel(level: SupportLevel): string {
  switch (level) {
    case "document_agrees":
      return "Le nom d’un document concorde";
    case "document_on_file_checked":
      return "Document vérifié de ce type au dossier";
    case "document_on_file":
      return "Document non vérifié de ce type au dossier";
    case "stated_twice":
      return "Déclaré deux fois, les deux par le client";
    case "stated_only":
      return "Déclaré une fois, rien au dossier";
    case "disputed":
      return "Les sources se contredisent";
  }
}

/**
 * One sentence explaining what a support level does *not* mean.
 *
 * Shown beside the label, because "a document of that kind is on file" is easy
 * to read as "the document says so" — and nothing in this build has opened a
 * document.
 */
export function supportCaveat(level: SupportLevel): string {
  switch (level) {
    case "document_agrees":
      return "Le nom du fichier porte cette valeur. Son contenu n’a pas été lu.";
    case "document_on_file_checked":
    case "document_on_file":
      return "Un document du type dont cela se lit d’habitude est joint. Son contenu n’a pas été lu.";
    case "stated_twice":
      return "La fiche et le questionnaire le disent tous deux. Les deux viennent du client.";
    case "stated_only":
      return "Rien au dossier ne l’appuie ni ne le contredit.";
    case "disputed":
      return "Plusieurs versions sont au dossier. Orchelio ne choisit pas entre elles.";
  }
}

export function reviewIssueLabel(category: ReviewIssueCategory): string {
  switch (category) {
    case "unsupported_statement":
      return "Affirmation sans source";
    case "missed_contradiction":
      return "Désaccord non signalé";
    case "premature_legal_conclusion":
      return "Se lit comme une conclusion juridique";
    case "insufficient_information":
      return "Pas assez au dossier";
    case "date_presented_as_confirmed":
      return "Date non confirmée présentée comme confirmée";
  }
}

export function reviewStatusLabel(status: ReviewStatus): string {
  switch (status) {
    case "approved_for_human_review":
      return "Prêt à être lu par une personne";
    case "corrections_required":
      return "Corrections requises";
    case "insufficient_information":
      return "Informations supplémentaires requises";
  }
}
