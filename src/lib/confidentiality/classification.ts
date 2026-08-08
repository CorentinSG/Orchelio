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
    label: "Catalogue de la plateforme",
    what: "Des données de référence partagées — domaines de droit, types de dossier, modèles de déroulé. Identiques pour chaque cabinet, et sur personne.",
    operatorMayRead: true,
    mayLeaveTheMachine: false,
    keyHolder: "none",
  },
  {
    key: "identity",
    label: "Identité",
    what: "Les personnes qui se connectent, et leurs sessions. Des données personnelles sur le personnel du cabinet — jamais sur un client.",
    operatorMayRead: true,
    mayLeaveTheMachine: false,
    keyHolder: "platform",
  },
  {
    key: "firm_internal",
    label: "Interne au cabinet",
    what: "Comment le cabinet a configuré Orchelio, qui y travaille, et ce qu’il a consommé. Sur le cabinet, pas sur ses clients.",
    operatorMayRead: true,
    mayLeaveTheMachine: false,
    keyHolder: "platform",
  },
  {
    key: "client_confidential",
    label: "Confidentiel client",
    what: "Qu’un client existe, qu’un dossier existe, et ce qu’il concerne. Confidentiel même quand son contenu n’est pas lu.",
    operatorMayRead: false,
    mayLeaveTheMachine: false,
    keyHolder: "firm",
  },
  {
    key: "privileged",
    label: "Couvert par le secret professionnel",
    what: "La substance du travail juridique — les documents, ce que le client a dit, ce qu’un avocat a écrit. La matière même que le secret professionnel existe pour protéger.",
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
    rule: "Un cabinet ne peut pas lire les enregistrements d’un autre cabinet.",
    enforcedBy:
      "Trois couches : des arguments obligatoires dans src/lib/data, un client de base de données qui refuse toute requête non délimitée (src/lib/data/firm-scope.ts), et des gardes d’appartenance sur chaque page. Prouvé par tests/integration/isolation.test.ts.",
    limitation:
      "Les trois s’exécutent à l’intérieur de l’application. Elles protègent d’une erreur de programmation, pas d’un processus compromis ni d’un administrateur de la base de données.",
  },
  {
    rule: "Rien ne quitte cette machine hormis ce qui est listé, vers les destinataires listés.",
    enforcedBy:
      "Les sorties sont gouvernées, non interdites (ADR-0025, depuis la V1). scripts/confidentiality-check.mjs fait échouer la compilation tant que chaque module capable d’émettre une requête sortante n’est pas listé avec ses hôtes et l’ADR qui l’a décidé ; un module listé ne peut nommer que ses hôtes listés, et aucun autre module ne peut les nommer. Deux destinations existent : un modèle sur cette machine à 127.0.0.1 (AI_PROVIDER=local), et l’API hébergée de Mistral à api.mistral.ai (AI_PROVIDER=mistral, ADR-0027). Sous la simulation livrée avec cette instance, ni l’une ni l’autre n’est utilisée et rien n’est envoyé nulle part.",
    limitation:
      "Elle vérifie le code source, pas le processus qui tourne. Une dépendance pourrait appeler vers l’extérieur ; cela demande une politique réseau au niveau de l’hôte.",
  },
  {
    rule: "Si un modèle est utilisé, c’est celui que ce cabinet a choisi, joint à une adresse vérifiée.",
    enforcedBy:
      "AI_PROVIDER=local : src/lib/ai/local-provider.ts doit prendre son adresse d’assertLoopback (src/lib/ai/loopback.ts), qui ne renvoie rien en dehors de 127.0.0.0/8 et ::1 et refuse les noms d’hôte — localhost compris, parce qu’un nom est résolu par la machine et pourrait être pointé ailleurs. AI_PROVIDER=mistral : src/lib/ai/mistral-provider.ts peut nommer api.mistral.ai et rien d’autre, et aucun autre module ne peut le nommer ; le traitement a lieu dans l’Union européenne dans le cadre du contrat Mistral du cabinet, dont l’offre payante est contractuellement exclue de l’entraînement des modèles. Choisir un fournisseur sans sa clé ou son adresse échoue au démarrage, plutôt que de retomber en silence sur autre chose.",
    limitation:
      "C’est l’adresse qui est vérifiée, pas la machine derrière elle. Un serveur qui relaierait les requêtes plus loin la mettrait en défaut — pour le cas local, cette machine est celle du cabinet ; pour le cas hébergé, la promesse repose sur le contrat de Mistral, qu’Orchelio peut citer mais pas vérifier.",
  },
  {
    rule: "On ne dit jamais à un modèle de quel dossier il s’agit.",
    enforcedBy:
      "L’unique message que reçoit un modèle est construit par factsMessage dans src/lib/ai/summary-rewrite.ts — partagé par le fournisseur local et le fournisseur hébergé, pour qu’ils ne puissent pas diverger. Il porte des comptes, le sujet de chaque désaccord, les types de documents manquants et la référence du dossier — aucun nom de client, aucun intitulé de dossier, aucune valeur de champ, aucune date et aucun nom de fichier. Un test unitaire échoue si l’un d’eux apparaît dans ce qui est envoyé.",
    limitation:
      "La référence elle-même est envoyée, parce que le résumé s’y rattache. Elle nomme un dossier dans le système de ce cabinet et rien à l’extérieur, mais ce n’est pas rien — et pour le fournisseur hébergé, c’est la seule chaîne identifiante qui quitte la machine.",
  },
  {
    rule: "Un administrateur de la plateforme ne peut pas lire les dossiers ni les documents d’un cabinet.",
    enforcedBy:
      "Les lectures inter-cabinets vivent uniquement dans src/lib/data/platform.ts, dont on vérifie qu’il ne nomme aucun modèle confidentiel client ni couvert par le secret professionnel. Réaffirmé contre les pages rendues dans tests/e2e/admin.spec.ts.",
    limitation:
      "C’est une règle sur les requêtes de l’application. Quiconque détient le fichier de base de données détient tout.",
  },
  {
    rule: "Aucun document n’est jamais ouvert, et aucun fichier n’est stocké.",
    enforcedBy:
      "Document contient un nom, un type, une taille et une clé calculée qui désigne où un fichier vivrait. scripts/confidentiality-check.mjs fait échouer la compilation si un module de src/ écrit un fichier.",
    limitation: "Un déploiement réel stocke des fichiers, et c’est là que se trouve l’essentiel du travail de cette conception.",
  },
  {
    rule: "La matière client est chiffrée avec une clé que le cabinet détient.",
    enforcedBy: null,
    limitation:
      "Non implémenté. La démonstration stocke tout dans un unique fichier SQLite non chiffré. C’est le plus grand écart entre la conception et la réalisation.",
  },
  {
    rule: "Les données d’un cabinet restent dans la juridiction qu’il a choisie.",
    enforcedBy: null,
    limitation:
      "Non implémenté, et non implémentable ici : il n’y a pas d’hébergement. La conception consigne ce que cela exigerait.",
  },
  {
    rule: "Un accès du support aux données d’un cabinet requiert la validation de ce cabinet.",
    enforcedBy: null,
    limitation:
      "Non implémenté. Le mécanisme qu’il réutiliserait — la file de validation — existe déjà ; la dixième règle verrouillée, non.",
  },
];
