/**
 * Orchelio — what each kind of record actually is, in confidentiality terms.
 *
 * A firm asking "where does my sensitive data go?" is really asking three
 * questions at once, and they have different answers for different records:
 * who may read it, where it may be stored, and what may leave the machine.
 * "Client data" is not one thing — the fact that a matter exists, the client's
 * own words in an intake, and a draft letter written by an attorney are three
 * different sensitivities with three different rules.
 *
 * So the classification lives here, in code, next to a completeness check —
 * rather than in a policy document that nobody re-reads when a model is added.
 * A new model that appears in no class fails `npm run confidentiality:check`,
 * which forces the question to be answered by whoever adds it.
 *
 * This module is pure data and pure functions. It says what the rules *are*.
 * What enforces them is listed against each rule, honestly, including the ones
 * nothing enforces yet.
 */

// ---------------------------------------------------------------------------
// The classes
// ---------------------------------------------------------------------------

export const CONFIDENTIALITY_CLASSES = [
  "platform",
  "identity",
  "firm_internal",
  "client_confidential",
  "privileged",
] as const;

export type ConfidentialityClass = (typeof CONFIDENTIALITY_CLASSES)[number];

export type ClassDefinition = {
  key: ConfidentialityClass;
  label: string;
  /** What kind of thing this is, in one sentence a firm administrator can read. */
  what: string;
  /** May somebody operating the platform read it, in the target design? */
  operatorMayRead: boolean;
  /** May it ever be sent outside the machine that runs Orchelio? */
  mayLeaveTheMachine: boolean;
  /** Who holds the key that decrypts it, in the target design. */
  keyHolder: "none" | "platform" | "firm";
};

/**
 * Ordered from least to most sensitive. The order is meaningful: a check can
 * ask "is this class at or above `client_confidential`?" and get a stable
 * answer, so a new class inserted in the middle changes the rules deliberately
 * rather than by accident.
 */
export const CLASS_DEFINITIONS: readonly ClassDefinition[] = [
  {
    key: "platform",
    label: "Platform catalogue",
    what: "Shared reference data — practice areas, matter types, workflow templates. Identical for every firm and about nobody.",
    operatorMayRead: true,
    mayLeaveTheMachine: false,
    keyHolder: "none",
  },
  {
    key: "identity",
    label: "Identity",
    what: "The people who sign in, and their sessions. Personal data about the firm's own staff — never about a client.",
    operatorMayRead: true,
    mayLeaveTheMachine: false,
    keyHolder: "platform",
  },
  {
    key: "firm_internal",
    label: "Firm-internal",
    what: "How the firm has configured Orchelio, who works there, and what it has used. About the firm, not about its clients.",
    operatorMayRead: true,
    mayLeaveTheMachine: false,
    keyHolder: "platform",
  },
  {
    key: "client_confidential",
    label: "Client-confidential",
    what: "That a client exists, that a matter exists, and what it concerns. Confidential even when its contents are not read.",
    operatorMayRead: false,
    mayLeaveTheMachine: false,
    keyHolder: "firm",
  },
  {
    key: "privileged",
    label: "Privileged",
    what: "The substance of the legal work — documents, what the client said, what an attorney wrote. The material professional secrecy exists to protect.",
    operatorMayRead: false,
    mayLeaveTheMachine: false,
    keyHolder: "firm",
  },
] as const;

export function classDefinition(key: ConfidentialityClass): ClassDefinition {
  return CLASS_DEFINITIONS.find((definition) => definition.key === key)!;
}

/** Rank within CLASS_DEFINITIONS. Higher is more sensitive. */
export function sensitivity(key: ConfidentialityClass): number {
  return CLASS_DEFINITIONS.findIndex((definition) => definition.key === key);
}

/** True for the two classes a platform operator may never read. */
export function isClientMaterial(key: ConfidentialityClass): boolean {
  return sensitivity(key) >= sensitivity("client_confidential");
}

// ---------------------------------------------------------------------------
// Every model, classified
// ---------------------------------------------------------------------------

/**
 * The classification, model by model.
 *
 * Two judgements worth writing down, because a reasonable person would put
 * them elsewhere:
 *
 * `AuditEvent` is client-confidential rather than firm-internal. A log of who
 * opened which matter, and when, describes the firm's clients even though it
 * holds none of their words — knowing that a named attorney read a named
 * matter three times in a week is itself information about a client.
 *
 * `Task` and `ApprovalRequest` are client-confidential rather than privileged.
 * They carry a summary and a reference, not the substance. `DraftCommunication`
 * is privileged, because it carries the exact words somebody intends to send.
 */
export const MODEL_CLASSIFICATION: Record<string, ConfidentialityClass> = {
  // Shared by every firm, about nobody.
  PracticeArea: "platform",
  MatterType: "platform",
  WorkflowTemplate: "platform",

  // The firm's own people.
  User: "identity",
  Session: "identity",

  // The firm itself.
  Firm: "firm_internal",
  FirmMembership: "firm_internal",
  FirmConfiguration: "firm_internal",
  FirmWorkflow: "firm_internal",
  UsageRecord: "firm_internal",

  // That a client and a matter exist, and their shape.
  ClientProfile: "client_confidential",
  Matter: "client_confidential",
  WorkflowRun: "client_confidential",
  WorkflowStep: "client_confidential",
  Task: "client_confidential",
  ApprovalRequest: "client_confidential",
  AuditEvent: "client_confidential",

  // The substance of the work.
  Document: "privileged",
  IntakeResponse: "privileged",
  AIAnalysis: "privileged",
  AIReview: "privileged",
  DraftCommunication: "privileged",
};

export function classify(model: string): ConfidentialityClass | null {
  return MODEL_CLASSIFICATION[model] ?? null;
}

/** Every model a platform operator may never read. */
export function clientMaterialModels(): string[] {
  return Object.entries(MODEL_CLASSIFICATION)
    .filter(([, key]) => isClientMaterial(key))
    .map(([model]) => model)
    .sort();
}

export function modelsInClass(key: ConfidentialityClass): string[] {
  return Object.entries(MODEL_CLASSIFICATION)
    .filter(([, value]) => value === key)
    .map(([model]) => model)
    .sort();
}

// ---------------------------------------------------------------------------
// What actually enforces each rule, today
// ---------------------------------------------------------------------------

export type Enforcement = {
  rule: string;
  /** What makes it true right now. Null when nothing does. */
  enforcedBy: string | null;
  /** Said plainly, including when the answer is uncomfortable. */
  limitation: string;
};

/**
 * The honest register.
 *
 * A firm that has to take confidentiality on trust is a firm that worries about
 * it. The point of this list is that each row names the thing a sceptic can go
 * and read, or says that there is nothing to read yet.
 */
export const ENFORCEMENT: readonly Enforcement[] = [
  {
    rule: "One firm cannot read another firm's records.",
    enforcedBy:
      "Three layers: required arguments in src/lib/data, a database client that refuses an unscoped query (src/lib/data/firm-scope.ts), and membership guards on every page. Proved by tests/integration/isolation.test.ts.",
    limitation:
      "All three run inside the application. They protect against a programming mistake, not against a compromised process or a database administrator.",
  },
  {
    rule: "Nothing leaves the machine that runs Orchelio.",
    enforcedBy:
      "No module in src/ can make an outbound request; scripts/confidentiality-check.mjs fails the build if one appears.",
    limitation:
      "It checks the source, not the running process. A dependency could call out; that needs a network policy at the host.",
  },
  {
    rule: "If a model is ever used, it may only be one running on this machine.",
    enforcedBy:
      "A module permitted to open a socket at all may instead be marked loopback-only, and that mark is checked rather than trusted: it must take its address from assertLoopback (src/lib/ai/loopback.ts), which returns nothing outside 127.0.0.0/8 and ::1, and it may write no address of its own. A hostname is refused too — including localhost, because a name is resolved by the machine and could be pointed elsewhere.",
    limitation:
      "Nothing here uses it yet: this build's analysis is a simulation and the permitted list is empty. It is the shape a local model would have to take, checked in advance rather than argued about afterwards.",
  },
  {
    rule: "A platform administrator cannot read a firm's matters or documents.",
    enforcedBy:
      "Cross-tenant reads live only in src/lib/data/platform.ts, which is checked to name no client-confidential or privileged model. Asserted again against the rendered pages in tests/e2e/admin.spec.ts.",
    limitation:
      "It is a rule about the application's queries. Somebody with the database file has everything.",
  },
  {
    rule: "No document is ever opened, and no file is stored.",
    enforcedBy:
      "Document holds a name, a type, a size and a computed key naming where a file would live. scripts/confidentiality-check.mjs fails the build if any module in src/ writes a file.",
    limitation: "A real deployment stores files, and that is where most of this design's work is.",
  },
  {
    rule: "Client material is encrypted with a key the firm holds.",
    enforcedBy: null,
    limitation:
      "Not implemented. The demonstration stores everything in one unencrypted SQLite file. This is the largest gap between the design and the build.",
  },
  {
    rule: "A firm's data stays in the jurisdiction the firm chose.",
    enforcedBy: null,
    limitation:
      "Not implemented, and not implementable here: there is no hosting. The design records what it would require.",
  },
  {
    rule: "Support access to a firm's data needs that firm's own approval.",
    enforcedBy: null,
    limitation:
      "Not implemented. The mechanism it would reuse — the approval queue — already exists; the tenth locked rule does not.",
  },
];
