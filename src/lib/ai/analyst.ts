/**
 * Orchelio — the Analyst, simulated.
 *
 * ## What this is, honestly
 *
 * This is not a language model and it does not pretend to be one. It is a set
 * of deterministic rules that read a matter's recorded fields, its intake
 * answers and its document *names*, and report what they say, where each thing
 * came from, and where they disagree.
 *
 * The alternative was a lookup table of hand-written results for the six
 * fictional matters. That would have demonstrated nothing: the contradiction
 * on the Moreau file would have been found because somebody typed it in, and a
 * firm creating its own matter would have got an empty page. Deriving the
 * output means the same rule that flags Moreau leaves the Vasquez file alone —
 * which is the interesting part, because on Vasquez the document names and the
 * recorded dates agree.
 *
 * ## What it cannot do
 *
 * **It never reads a document.** Orchelio stores a filename, a type and a size
 * and nothing else — there is no upload and no OCR (see Phase 5). So every
 * fact here sourced to a document comes from that document's *name and kind*,
 * not from anything inside it. Every analysis says so in its own warnings,
 * because an analysis that cited "the I-94" without that caveat would imply a
 * capability the product does not have.
 *
 * When a real provider replaces this one, the interface does not change: see
 * `prompts/analyst.v1.md` for the instructions it would be given.
 */

import type {
  AnalysisDocument,
  Contradiction,
  FactSource,
  KeyFact,
  MatterAnalysisInput,
  MatterAnalysisResult,
  MissingDocument,
  Question,
  SupportLevel,
  TimelineEvent,
} from "@/lib/ai/types";
import { CONFIDENCE_BY_SUPPORT } from "@/lib/ai/types";
import { formatWritten, isoDateWithin, parseIsoDate, readDate } from "@/lib/ai/dates";
import { categoriesFor, expectedButMissing } from "@/lib/matters/documents";
import { displayValue, fieldsFor, type MatterField } from "@/lib/matters/fields";

// ---------------------------------------------------------------------------
// Which documents would evidence which field
// ---------------------------------------------------------------------------

/**
 * The document kinds that would ordinarily support a given field.
 *
 * Used only to describe how well supported a fact is — "the file contains an
 * I-94, which is the kind of document this date is normally read from". It is
 * never used to assert that the document *says* so, because nothing here can
 * open a document.
 */
const EVIDENCED_BY: Record<string, readonly string[]> = {
  // Immigration
  nationality: ["passport"],
  country_of_birth: ["passport", "birth_certificate"],
  date_of_birth: ["passport", "birth_certificate"],
  last_entry_date: ["i94"],
  last_entry_classification: ["i94"],
  current_status: ["i94", "uscis_notice", "visa"],
  status_expiration_date: ["i94", "uscis_notice"],
  petitioner: ["uscis_notice", "marriage_certificate"],
  beneficiary: ["uscis_notice"],
  employer: ["employment_letter"],
  prior_applications: ["prior_filing", "uscis_notice"],
  // Employment
  employer_name: ["employment_agreement", "offer_letter", "pay_stub"],
  employee_name: ["employment_agreement", "offer_letter", "pay_stub"],
  position: ["employment_agreement", "offer_letter"],
  employment_start_date: ["employment_agreement", "offer_letter"],
  employment_end_date: ["termination_letter"],
  current_employment_status: ["termination_letter"],
  salary_or_rate: ["pay_stub", "employment_agreement"],
  regular_hours: ["time_record", "employment_agreement"],
  alleged_unpaid_hours: ["time_record", "pay_stub"],
  complaint_date: ["internal_complaint"],
  adverse_action: ["disciplinary_notice", "termination_letter"],
  termination_date: ["termination_letter"],
  termination_reason_stated: ["termination_letter"],
  severance_offered: ["severance_agreement"],
  // A claim that a document exists is supported by that document being on file.
  i94_available: ["i94"],
  employment_agreement_available: ["employment_agreement"],
  handbook_available: ["employee_handbook"],
  performance_reviews_available: ["performance_review"],
  disciplinary_notices_available: ["disciplinary_notice"],
};

/**
 * Dates that appear in more than one place and therefore can disagree.
 *
 * Each subject names the matter field, the document kinds whose filename
 * conventionally carries that date, and a pattern for the intake answers that
 * are about the same thing. Nothing is compared across subjects: a termination
 * date and a complaint date are *supposed* to differ.
 */
type DateSubject = {
  key: string;
  subject: string;
  fieldKey: string;
  documentCategories: readonly string[];
  intakePattern: RegExp;
};

const DATE_SUBJECTS: readonly DateSubject[] = [
  {
    key: "last_entry",
    subject: "Date of last entry",
    fieldKey: "last_entry_date",
    documentCategories: ["i94"],
    intakePattern: /entry|entered|arriv/i,
  },
  {
    key: "termination",
    subject: "Date employment ended",
    fieldKey: "termination_date",
    documentCategories: ["termination_letter"],
    intakePattern: /terminat|dismiss|let_go|end_of_employment/i,
  },
  {
    key: "internal_complaint",
    subject: "Date the complaint was made",
    fieldKey: "complaint_date",
    documentCategories: ["internal_complaint"],
    intakePattern: /complaint|raised|reported/i,
  },
  {
    key: "employment_end",
    subject: "Last day of employment",
    fieldKey: "employment_end_date",
    documentCategories: ["termination_letter"],
    intakePattern: /last_day|final_day/i,
  },
];

/** Boolean fields that claim a document exists, and the kind they name. */
const AVAILABILITY_CLAIMS: Record<string, string> = {
  i94_available: "i94",
  employment_agreement_available: "employment_agreement",
  handbook_available: "employee_handbook",
  performance_reviews_available: "performance_review",
  disciplinary_notices_available: "disciplinary_notice",
};

// ---------------------------------------------------------------------------

/** Standing cautions. Every analysis carries all of them, every time. */
export const STANDING_WARNINGS: readonly string[] = [
  "AI-generated. A person must read this before it is used or relied on.",
  "No document was opened. Orchelio records a document's name, type and size only — nothing in this analysis comes from inside a file.",
  "Nothing here is legal advice, an eligibility assessment or a conclusion, and no date here is confirmed.",
];

export function analyseMatter(input: MatterAnalysisInput): MatterAnalysisResult {
  const enabled = new Set(input.enabledFeatures);
  const on = (feature: string) => enabled.has(feature);

  const fields = fieldsFor(input.practiceAreaKey, input.matterTypeKey);
  const known = fields.filter((field) => hasValue(input.fields[field.key]));
  const unknown = fields.filter((field) => !hasValue(input.fields[field.key]));

  const contradictions = on("inconsistency_detection") ? findContradictions(input) : [];
  const disputedFieldKeys = new Set(
    contradictions.flatMap((contradiction) =>
      DATE_SUBJECTS.filter((subject) => subject.key === contradiction.key).map(
        (subject) => subject.fieldKey,
      ),
    ),
  );

  const keyFacts = on("entity_extraction")
    ? known.map((field) => toKeyFact(field, input, disputedFieldKeys.has(field.key)))
    : [];

  const timelineFeature =
    input.practiceAreaKey === "employment_law" ? "employment_timeline" : "timeline";
  const timeline = on(timelineFeature) ? buildTimeline(input) : [];

  const missingDocuments = on("missing_documents") ? findMissingDocuments(input) : [];

  const sufficiency = judgeSufficiency(input, known.length, unknown.length);

  const attorneyQuestions = buildAttorneyQuestions(input, contradictions, sufficiency);
  const clientQuestions = on("consultation_questions") || on("interview_questions")
    ? buildClientQuestions(contradictions, missingDocuments, unknown)
    : [];

  const warnings = buildWarnings(input, sufficiency);

  const featuresApplied: string[] = [];
  const featuresQuiet: { feature: string; because: string }[] = [];
  const record = (feature: string, produced: boolean, because: string) => {
    if (!enabled.has(feature)) return;
    if (produced) featuresApplied.push(feature);
    else featuresQuiet.push({ feature, because });
  };

  record("entity_extraction", keyFacts.length > 0, "No field on this matter has a value yet.");
  record(timelineFeature, timeline.length > 0, "No date on this matter could be read.");
  record(
    "missing_documents",
    missingDocuments.length > 0,
    "Every document expected for this type of matter is on file.",
  );
  record(
    "inconsistency_detection",
    contradictions.length > 0,
    "Nothing on the record disagrees with anything else on the record.",
  );
  record("consultation_questions", clientQuestions.length > 0, "Nothing outstanding to ask.");
  record("interview_questions", clientQuestions.length > 0, "Nothing outstanding to ask.");
  record("document_summary", true, "");

  return {
    summary: buildSummary(input, known.length, fields.length, contradictions, missingDocuments, sufficiency),
    sufficiency,
    keyFacts,
    timeline,
    missingDocuments,
    contradictions,
    attorneyQuestions,
    clientQuestions,
    warnings,
    featuresApplied,
    featuresQuiet,
  };
}

// ---------------------------------------------------------------------------
// Key facts
// ---------------------------------------------------------------------------

function toKeyFact(
  field: MatterField,
  input: MatterAnalysisInput,
  disputed: boolean,
): KeyFact {
  const raw = input.fields[field.key];
  const sources: FactSource[] = [
    { kind: "matter_field", label: field.label },
  ];

  // The client saying the same thing at intake is consistency, not evidence.
  const echo = intakeEcho(raw, input.intake);
  if (echo) sources.push({ kind: "intake", label: echo });

  // A document of the kind this field is normally read from. Its *name* may
  // also carry the value — that is the only thing here that can be checked
  // against the record, because no document is ever opened.
  const evidencing = documentsEvidencing(field.key, input.documents);
  const asDate = parseIsoDate(raw);
  const agreeing = asDate
    ? evidencing.filter((document) => isoDateWithin(document.filename) === asDate)
    : [];

  for (const document of evidencing) {
    sources.push({ kind: "document", label: document.filename, verified: document.verified });
  }

  const support = judgeSupport({
    disputed,
    nameAgrees: agreeing.length > 0,
    documents: evidencing,
    statedAtIntake: echo !== null,
  });

  return {
    key: field.key,
    label: field.label,
    value: displayValue(field, raw),
    support,
    sources,
    simulatedConfidence: CONFIDENCE_BY_SUPPORT[support],
  };
}

/**
 * How well supported a fact is.
 *
 * The ordering matters, and the thing it is careful about is not calling
 * something corroborated when it is not. A file holding two documents of a
 * plausible kind is *not* two sources agreeing on a value — nothing has been
 * read from either of them. Only a filename that carries the same value as the
 * record can be checked against it, and that is as strong as this build gets.
 */
function judgeSupport(facts: {
  disputed: boolean;
  nameAgrees: boolean;
  documents: readonly AnalysisDocument[];
  statedAtIntake: boolean;
}): SupportLevel {
  if (facts.disputed) return "disputed";
  if (facts.nameAgrees) return "document_agrees";

  if (facts.documents.length > 0) {
    return facts.documents.some((document) => document.verified)
      ? "document_on_file_checked"
      : "document_on_file";
  }

  return facts.statedAtIntake ? "stated_twice" : "stated_only";
}

/** The intake answer that says the same thing as this field, if there is one. */
function intakeEcho(value: unknown, intake: Record<string, string>): string | null {
  const asDate = parseIsoDate(value);

  for (const [key, answer] of Object.entries(intake)) {
    if (asDate) {
      if (readDate(answer) === asDate) return `Client intake — ${humanise(key)}`;
      continue;
    }
    if (typeof value !== "string" || value.length < 3) continue;
    const a = answer.toLowerCase();
    const b = value.toLowerCase();
    if (a.includes(b) || b.includes(a)) return `Client intake — ${humanise(key)}`;
  }
  return null;
}

function documentsEvidencing(
  fieldKey: string,
  documents: readonly AnalysisDocument[],
): AnalysisDocument[] {
  const categories = EVIDENCED_BY[fieldKey];
  if (!categories) return [];
  return documents.filter((document) => categories.includes(document.category));
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

function buildTimeline(input: MatterAnalysisInput): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const fields = fieldsFor(input.practiceAreaKey, input.matterTypeKey);

  for (const field of fields) {
    if (field.type !== "date") continue;
    const date = parseIsoDate(input.fields[field.key]);
    if (!date) continue;
    events.push({
      date,
      label: field.label,
      source: { kind: "matter_field", label: field.label },
      stated: true,
    });
  }

  for (const document of input.documents) {
    // A date in a filename is a naming convention, not a reading of the file.
    const inName = isoDateWithin(document.filename);
    if (inName) {
      events.push({
        date: inName,
        label: `Date in the name of ${document.filename}`,
        source: { kind: "document", label: document.filename, verified: document.verified },
        stated: false,
      });
    }
    events.push({
      date: document.receivedAt.slice(0, 10),
      label: `${document.filename} added to the matter`,
      source: { kind: "document", label: document.filename, verified: document.verified },
      stated: false,
    });
  }

  for (const [key, answer] of Object.entries(input.intake)) {
    const date = readDate(answer);
    if (!date) continue;
    events.push({
      date,
      label: humanise(key),
      source: { kind: "intake", label: `Client intake — ${humanise(key)}` },
      stated: true,
    });
  }

  const seen = new Set<string>();
  return events
    .filter((event) => {
      const signature = `${event.date}|${event.label}`;
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ---------------------------------------------------------------------------
// Missing documents
// ---------------------------------------------------------------------------

function findMissingDocuments(input: MatterAnalysisInput): MissingDocument[] {
  const present = input.documents.map((document) => document.category);

  return expectedButMissing(input.practiceAreaKey, input.matterTypeKey, present).map(
    (category) => ({
      key: category.key,
      label: category.label,
      whyItMatters:
        category.whyItMatters ?? "Usually part of a complete file for this kind of matter.",
    }),
  );
}

// ---------------------------------------------------------------------------
// Contradictions
// ---------------------------------------------------------------------------

function findContradictions(input: MatterAnalysisInput): Contradiction[] {
  return [...dateContradictions(input), ...availabilityContradictions(input)];
}

function dateContradictions(input: MatterAnalysisInput): Contradiction[] {
  const found: Contradiction[] = [];

  for (const subject of DATE_SUBJECTS) {
    const statements: { value: string; source: FactSource }[] = [];
    const dates = new Set<string>();

    const fromField = parseIsoDate(input.fields[subject.fieldKey]);
    if (fromField) {
      dates.add(fromField);
      statements.push({
        value: formatWritten(fromField),
        source: { kind: "matter_field", label: labelOf(input, subject.fieldKey) },
      });
    }

    for (const [key, answer] of Object.entries(input.intake)) {
      if (!subject.intakePattern.test(key)) continue;
      const date = readDate(answer);
      if (!date) continue;
      dates.add(date);
      // The client's own wording is shown alongside the date, unless it adds
      // nothing — "11 February 2024 — "11 February 2024"" helps no one.
      const written = formatWritten(date);
      const wording = answer.trim();
      statements.push({
        value: wording === written ? written : `${written} — "${wording}"`,
        source: { kind: "intake", label: `Client intake — ${humanise(key)}` },
      });
    }

    for (const document of input.documents) {
      if (!subject.documentCategories.includes(document.category)) continue;
      const date = isoDateWithin(document.filename);
      if (!date) continue;
      dates.add(date);
      statements.push({
        value: formatWritten(date),
        source: { kind: "document", label: document.filename, verified: document.verified },
      });
    }

    // One distinct date, however many sources, is agreement — not a conflict.
    if (dates.size < 2) continue;

    found.push({
      key: subject.key,
      subject: subject.subject,
      statements,
      note:
        "Both versions are on the record and both are shown. Which one is correct is a question " +
        "for the client, not something Orchelio can settle — and the answer may change what the " +
        "rest of the file means.",
    });
  }

  return found;
}

function availabilityContradictions(input: MatterAnalysisInput): Contradiction[] {
  const found: Contradiction[] = [];

  for (const [fieldKey, category] of Object.entries(AVAILABILITY_CLAIMS)) {
    if (input.fields[fieldKey] !== false) continue;
    const onFile = input.documents.filter((document) => document.category === category);
    if (onFile.length === 0) continue;

    found.push({
      key: `availability_${fieldKey}`,
      subject: `${labelOf(input, fieldKey)} — record says no, a document of that kind is on file`,
      statements: [
        {
          value: "Recorded as not available",
          source: { kind: "matter_field", label: labelOf(input, fieldKey) },
        },
        ...onFile.map((document) => ({
          value: "A document of this kind is attached to the matter",
          source: {
            kind: "document" as const,
            label: document.filename,
            verified: document.verified,
          },
        })),
      ],
      note:
        "Either the record is out of date or the attached document is filed under the wrong kind. " +
        "A person should look at which.",
    });
  }

  return found;
}

// ---------------------------------------------------------------------------
// Sufficiency, questions, warnings, summary
// ---------------------------------------------------------------------------

function judgeSufficiency(
  input: MatterAnalysisInput,
  knownCount: number,
  unknownCount: number,
): MatterAnalysisResult["sufficiency"] {
  const total = knownCount + unknownCount;
  if (input.documents.length === 0) return "more_information_required";
  if (total > 0 && knownCount / total < 0.5) return "more_information_required";
  return "sufficient_for_review";
}

function buildAttorneyQuestions(
  input: MatterAnalysisInput,
  contradictions: readonly Contradiction[],
  sufficiency: MatterAnalysisResult["sufficiency"],
): Question[] {
  const questions: Question[] = [];

  for (const contradiction of contradictions) {
    questions.push({
      question: `${contradiction.subject}: which account should the file proceed on?`,
      why: "Two versions are on the record. Choosing between them is a judgement about the client's account, not a calculation.",
    });
  }

  if (sufficiency === "more_information_required") {
    questions.push({
      question: "Is there enough on file to be worth reviewing yet, or should the file be built out first?",
      why: "Most of this matter is still unknown, so a review now would be a review of the gaps.",
    });
  }

  const unverified = input.documents.filter((document) => !document.verified);
  if (unverified.length > 0) {
    questions.push({
      question: `Should ${unverified.length === 1 ? "the document" : `the ${unverified.length} documents`} nobody has checked yet be confirmed before this file is relied on?`,
      why: `Not yet checked by a person: ${unverified.map((document) => document.filename).join(", ")}.`,
    });
  }

  if (parseIsoDate(input.fields["status_expiration_date"])) {
    questions.push({
      question: "Should the recorded status expiration date be confirmed against the underlying notice?",
      why: "Orchelio never confirms a date. The one on file is what somebody typed.",
    });
  }

  return questions;
}

function buildClientQuestions(
  contradictions: readonly Contradiction[],
  missing: readonly MissingDocument[],
  unknownFields: readonly MatterField[],
): Question[] {
  const questions: Question[] = [];

  for (const contradiction of contradictions) {
    questions.push({
      question: `${contradiction.subject}: we have two different versions on file — can you help us settle it?`,
      why: "Asked of the client rather than resolved internally.",
    });
  }

  for (const document of missing) {
    questions.push({
      question: `Do you have a copy of the ${document.label}?`,
      why: document.whyItMatters,
    });
  }

  // The four most significant unknowns, so the list stays usable at a meeting.
  for (const field of unknownFields.slice(0, 4)) {
    questions.push({
      question: `Can you tell us: ${field.label}?`,
      why: "Recorded as unknown on this matter.",
    });
  }

  return questions;
}

function buildWarnings(
  input: MatterAnalysisInput,
  sufficiency: MatterAnalysisResult["sufficiency"],
): string[] {
  const warnings = [...STANDING_WARNINGS];

  if (sufficiency === "more_information_required") {
    warnings.push(
      "This file is mostly unknown. What follows describes the gaps more than the matter, and says nothing about the client's position.",
    );
  }

  const unverified = input.documents.filter((document) => !document.verified);
  if (unverified.length > 0) {
    warnings.push(
      `${unverified.length} document${unverified.length === 1 ? " has" : "s have"} not been checked by a person: ${unverified
        .map((document) => document.filename)
        .join(", ")}.`,
    );
  }

  return warnings;
}

function buildSummary(
  input: MatterAnalysisInput,
  knownCount: number,
  fieldCount: number,
  contradictions: readonly Contradiction[],
  missing: readonly MissingDocument[],
  sufficiency: MatterAnalysisResult["sufficiency"],
): string {
  const parts: string[] = [];

  parts.push(
    `${input.reference} has ${knownCount} of ${fieldCount} recorded fields filled in and ${input.documents.length} document${input.documents.length === 1 ? "" : "s"} on file.`,
  );

  if (contradictions.length > 0) {
    parts.push(
      `${contradictions.length === 1 ? "One point" : `${contradictions.length} points`} on the record disagree${contradictions.length === 1 ? "s" : ""} with ${contradictions.length === 1 ? "another" : "other"} part of the file; ${contradictions.length === 1 ? "it is" : "they are"} set out below without being resolved.`,
    );
  } else {
    parts.push("Nothing on the record disagrees with anything else on the record.");
  }

  if (missing.length > 0) {
    parts.push(
      `${missing.length} document${missing.length === 1 ? "" : "s"} usually held on this kind of matter ${missing.length === 1 ? "is" : "are"} not on file.`,
    );
  }

  if (sufficiency === "more_information_required") {
    parts.push("More information is required before this file can usefully be reviewed.");
  }

  return parts.join(" ");
}

// ---------------------------------------------------------------------------

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "" && value !== "unknown";
}

function labelOf(input: MatterAnalysisInput, fieldKey: string): string {
  const field = fieldsFor(input.practiceAreaKey, input.matterTypeKey).find(
    (candidate) => candidate.key === fieldKey,
  );
  return field?.label ?? humanise(fieldKey);
}

function humanise(key: string): string {
  const words = key.split("_").join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Exported for the reviewer, which re-derives contradictions independently. */
export const analystInternals = { findContradictions, categoriesFor };
