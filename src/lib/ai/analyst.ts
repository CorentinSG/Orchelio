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
    subject: "Date de dernière entrée",
    fieldKey: "last_entry_date",
    documentCategories: ["i94"],
    intakePattern: /entry|entered|arriv/i,
  },
  {
    key: "termination",
    subject: "Date de fin d’emploi",
    fieldKey: "termination_date",
    documentCategories: ["termination_letter"],
    intakePattern: /terminat|dismiss|let_go|end_of_employment/i,
  },
  {
    key: "internal_complaint",
    subject: "Date de la plainte",
    fieldKey: "complaint_date",
    documentCategories: ["internal_complaint"],
    intakePattern: /complaint|raised|reported/i,
  },
  {
    key: "employment_end",
    subject: "Dernier jour d’emploi",
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
  "Produit par une IA. Une personne doit le lire avant tout usage ou toute confiance.",
  "Aucun document n’a été ouvert. Orchelio n’enregistre que le nom, le type et la taille d’un document — rien dans cette analyse ne provient de l’intérieur d’un fichier.",
  "Rien ici n’est un conseil juridique, une appréciation d’éligibilité ou une conclusion, et aucune date ici n’est confirmée.",
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

  record("entity_extraction", keyFacts.length > 0, "Aucun champ de ce dossier n’a encore de valeur.");
  record(timelineFeature, timeline.length > 0, "Aucune date de ce dossier n’a pu être lue.");
  record(
    "missing_documents",
    missingDocuments.length > 0,
    "Chaque document attendu pour ce type de dossier est au dossier.",
  );
  record(
    "inconsistency_detection",
    contradictions.length > 0,
    "Rien au dossier ne contredit quoi que ce soit d’autre au dossier.",
  );
  record("consultation_questions", clientQuestions.length > 0, "Rien d’en attente à demander.");
  record("interview_questions", clientQuestions.length > 0, "Rien d’en attente à demander.");
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
      if (readDate(answer) === asDate) return `Questionnaire client — ${humanise(key)}`;
      continue;
    }
    if (typeof value !== "string" || value.length < 3) continue;
    const a = answer.toLowerCase();
    const b = value.toLowerCase();
    if (a.includes(b) || b.includes(a)) return `Questionnaire client — ${humanise(key)}`;
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
        label: `Date dans le nom de ${document.filename}`,
        source: { kind: "document", label: document.filename, verified: document.verified },
        stated: false,
      });
    }
    events.push({
      date: document.receivedAt.slice(0, 10),
      label: `${document.filename} ajouté au dossier`,
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
      source: { kind: "intake", label: `Questionnaire client — ${humanise(key)}` },
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
        category.whyItMatters ?? "Fait d’habitude partie d’un dossier complet de ce type.",
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
        source: { kind: "intake", label: `Questionnaire client — ${humanise(key)}` },
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
        "Les deux versions sont au dossier et les deux sont montrées. Laquelle est exacte est une " +
        "question pour le client, pas quelque chose qu’Orchelio peut trancher — et la réponse peut " +
        "changer le sens du reste du dossier.",
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
      subject: `${labelOf(input, fieldKey)} — la fiche dit non, un document de ce type est au dossier`,
      statements: [
        {
          value: "Enregistré comme non disponible",
          source: { kind: "matter_field", label: labelOf(input, fieldKey) },
        },
        ...onFile.map((document) => ({
          value: "Un document de ce type est joint au dossier",
          source: {
            kind: "document" as const,
            label: document.filename,
            verified: document.verified,
          },
        })),
      ],
      note:
        "Soit la fiche n’est plus à jour, soit le document joint est classé sous le mauvais type. " +
        "Une personne doit regarder lequel des deux.",
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
      question: `${contradiction.subject} : sur quelle version le dossier doit-il avancer ?`,
      why: "Deux versions sont au dossier. Choisir entre elles est un jugement sur le récit du client, pas un calcul.",
    });
  }

  if (sufficiency === "more_information_required") {
    questions.push({
      question: "Y a-t-il assez au dossier pour qu’une relecture vaille la peine, ou faut-il d’abord l’étoffer ?",
      why: "L’essentiel de ce dossier est encore inconnu ; une relecture maintenant serait une relecture des manques.",
    });
  }

  const unverified = input.documents.filter((document) => !document.verified);
  if (unverified.length > 0) {
    questions.push({
      question: `${unverified.length === 1 ? "Le document que personne n’a encore vérifié doit-il" : `Les ${unverified.length} documents que personne n’a encore vérifiés doivent-ils`} être confirmés avant de s’appuyer sur ce dossier ?`,
      why: `Pas encore vérifié par une personne : ${unverified.map((document) => document.filename).join(", ")}.`,
    });
  }

  if (parseIsoDate(input.fields["status_expiration_date"])) {
    questions.push({
      question: "La date d’expiration de statut enregistrée doit-elle être confirmée contre l’avis d’origine ?",
      why: "Orchelio ne confirme jamais une date. Celle au dossier est ce que quelqu’un a saisi.",
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
      question: `${contradiction.subject} : nous avons deux versions différentes au dossier — pouvez-vous nous aider à trancher ?`,
      why: "Demandé au client plutôt que tranché en interne.",
    });
  }

  for (const document of missing) {
    questions.push({
      question: `Avez-vous une copie de ce document : ${document.label} ?`,
      why: document.whyItMatters,
    });
  }

  // The four most significant unknowns, so the list stays usable at a meeting.
  for (const field of unknownFields.slice(0, 4)) {
    questions.push({
      question: `Pouvez-vous nous préciser : ${field.label} ?`,
      why: "Enregistré comme inconnu sur ce dossier.",
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
      "Ce dossier est en grande partie inconnu. Ce qui suit décrit les manques plus que l’affaire, et ne dit rien de la position du client.",
    );
  }

  const unverified = input.documents.filter((document) => !document.verified);
  if (unverified.length > 0) {
    warnings.push(
      `${unverified.length} document${unverified.length === 1 ? " n’a" : "s n’ont"} pas été vérifié${unverified.length === 1 ? "" : "s"} par une personne : ${unverified
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
    `${input.reference} compte ${knownCount} champ(s) renseigné(s) sur ${fieldCount} et ${input.documents.length} document${input.documents.length === 1 ? "" : "s"} au dossier.`,
  );

  if (contradictions.length > 0) {
    parts.push(
      `${contradictions.length === 1 ? "Un point" : `${contradictions.length} points`} du dossier ${contradictions.length === 1 ? "contredit" : "contredisent"} une autre partie du dossier ; ${contradictions.length === 1 ? "il est présenté" : "ils sont présentés"} ci-dessous sans être tranché${contradictions.length === 1 ? "" : "s"}.`,
    );
  } else {
    parts.push("Rien au dossier ne contredit quoi que ce soit d’autre au dossier.");
  }

  if (missing.length > 0) {
    parts.push(
      `${missing.length} document${missing.length === 1 ? "" : "s"} habituellement présent${missing.length === 1 ? "" : "s"} sur ce type de dossier ${missing.length === 1 ? "n’est pas" : "ne sont pas"} au dossier.`,
    );
  }

  if (sufficiency === "more_information_required") {
    parts.push("Des informations supplémentaires sont requises avant qu’une relecture de ce dossier soit utile.");
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
