import { Badge, Callout, Card, CommandLine, DataRow } from "@/components/ui";
import {
  CLASS_DEFINITIONS,
  ENFORCEMENT,
  modelsInClass,
  type ConfidentialityClass,
} from "@/lib/confidentiality/classification";
import { providerNotice } from "@/lib/ai/notice";
import { serverEnv } from "@/lib/env";
import { APP_NAME } from "@/lib/app-config";

/**
 * Orchelio — the confidentiality report.
 *
 * A firm that has to take "your data does not go anywhere" on trust is a firm
 * that worries about it. This screen exists so it does not have to: every claim
 * on it names the thing a sceptic can go and read, and every claim that nothing
 * yet enforces says so, in the same list, in the same words.
 *
 * It is the one settings section with no form. Confidentiality is not a
 * preference a firm sets — it is a property of the system, and what this page
 * owes the firm is an accurate description of it rather than a switch.
 */

const CLASSES_INTRODUCTION =
  "Elles ne portent pas la même sensibilité, elles ne reçoivent donc pas les mêmes règles. " +
  `Chaque enregistrement qu’${APP_NAME} conserve appartient à exactement l’une d’elles, et un ` +
  "nouveau type d’enregistrement qui n’appartiendrait à aucune fait échouer la compilation.";

const CLASS_TONE: Record<ConfidentialityClass, "neutral" | "brand" | "warning" | "danger"> = {
  platform: "neutral",
  identity: "neutral",
  firm_internal: "brand",
  client_confidential: "warning",
  privileged: "danger",
};

/** Plain-language names for the models, so the page reads to a lawyer. */
const MODEL_LABELS: Record<string, string> = {
  PracticeArea: "domaines de droit",
  MatterType: "types de dossier",
  WorkflowTemplate: "modèles de déroulé",
  User: "personnes qui se connectent",
  Session: "sessions de connexion",
  Firm: "la fiche du cabinet",
  FirmMembership: "qui travaille ici",
  FirmConfiguration: "la configuration de ce cabinet",
  FirmWorkflow: "déroulés activés",
  UsageRecord: "consommation de l’assistant",
  ClientProfile: "fiches clients",
  Matter: "dossiers",
  WorkflowRun: "exécutions de déroulé",
  WorkflowStep: "étapes de déroulé",
  Task: "tâches",
  ApprovalRequest: "demandes de validation",
  AuditEvent: "le journal d’activité",
  Document: "documents",
  IntakeResponse: "réponses au questionnaire client",
  AIAnalysis: "analyses",
  AIReview: "relectures",
  DraftCommunication: "projets de courrier",
};

function describe(models: readonly string[]): string {
  return models.map((model) => MODEL_LABELS[model] ?? model).join(", ");
}

export function ConfidentialityReport({ firmName }: { firmName: string }) {
  const enforced = ENFORCEMENT.filter((entry) => entry.enforcedBy !== null);
  const notYet = ENFORCEMENT.filter((entry) => entry.enforcedBy === null);
  // Read from the configuration rather than asserted here: "nothing is sent"
  // was true of the only provider that existed, and would have gone on being
  // displayed, unchanged and wrong, under a hosted one.
  const notice = providerNotice(serverEnv());

  return (
    <div className="space-y-6">
      <Callout tone="warning" title="Cette instance ne contient aucune donnée client réelle">
        Tout ce qui se trouve dans {firmName} est fictif, et cette page décrit la démonstration
        telle qu’elle est réellement — non telle que serait un déploiement. Là où les deux
        diffèrent, elle le dit.
      </Callout>

      {/* --- Where it lives ------------------------------------------------ */}

      <div>
        <h3 className="text-sm font-semibold text-ink">Où sont vos données, en ce moment</h3>
        <p className="mt-0.5 text-sm text-ink-muted">
          Un fichier, sur la machine qui exécute {APP_NAME}. Aucun service en nuage, aucune base de
          données externe, aucun réseau de diffusion de contenu, et aucune sauvegarde — parce qu’il
          n’y a nulle part où elle irait.
        </p>
        <div className="mt-3">
          <CommandLine>prisma/orchelio-demo.db</CommandLine>
        </div>
        <dl className="mt-3">
          <DataRow label="Documents que vous ajoutez" value="Jamais stockés" hint="seulement un nom, un type et une taille" />
          <DataRow label="Chiffré au repos" value="Non" hint="quiconque détient le fichier détient tout" />
          <DataRow label="Envoyé à un fournisseur d’IA" value={notice.sentToProvider} hint={notice.sentToProviderHint} />
          <DataRow label="Copies ailleurs" value="Aucune" hint="pas de sauvegarde, pas d’index de recherche" />
        </dl>
      </div>

      {/* --- What kind of data ---------------------------------------------- */}

      <div>
        <h3 className="text-sm font-semibold text-ink">
          « Les données client », c’est cinq choses différentes
        </h3>
        <p className="mt-0.5 text-sm text-ink-muted">{CLASSES_INTRODUCTION}</p>
        <ul className="mt-3 space-y-2">
          {CLASS_DEFINITIONS.map((definition) => {
            const models = modelsInClass(definition.key);
            return (
              <li
                key={definition.key}
                className="rounded-card border border-line bg-surface px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink">{definition.label}</span>
                  <Badge tone={CLASS_TONE[definition.key]}>
                    {definition.operatorMayRead
                      ? "l’exploitant peut lire"
                      : "l’exploitant ne peut pas lire"}
                  </Badge>
                  {definition.keyHolder === "firm" ? (
                    <Badge tone="neutral">clé détenue par le cabinet — prévu</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-ink-muted">{definition.what}</p>
                <p className="mt-1 text-sm text-ink-subtle">
                  {models.length} type(s) : {describe(models)}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      {/* --- What holds it up ------------------------------------------------ */}

      <Card
        title={`${enforced.length} promesse(s) que quelque chose fait réellement respecter`}
        description="Chacune nomme ce qu’un sceptique peut aller lire."
      >
        <ul className="space-y-3">
          {enforced.map((entry) => (
            <li key={entry.rule}>
              <p className="text-sm font-medium text-ink">{entry.rule}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{entry.enforcedBy}</p>
              <p className="mt-0.5 text-sm text-ink-subtle">
                <span className="font-medium">Ce qu’elle ne couvre pas :</span> {entry.limitation}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {/* --- And what does not ------------------------------------------------ */}

      <Card
        title={`${notYet.length} promesse(s) que rien ne fait encore respecter`}
        description="Listées ici plutôt qu’omises, parce qu’une liste qui ne contient que les bonnes nouvelles n’est pas une liste."
      >
        <ul className="space-y-3">
          {notYet.map((entry) => (
            <li key={entry.rule}>
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                {entry.rule}
                <Badge tone="danger">non implémenté</Badge>
              </p>
              <p className="mt-0.5 text-sm text-ink-muted">{entry.limitation}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Callout tone="neutral" title="Vérifiez-le vous-même">
        <p>
          Rien de ce qui précède n’a à être cru sur parole. Les trois premières s’exécutent comme une
          vérification qui fait échouer la compilation, et l’isolement entre cabinets est prouvé par
          des tests contre une vraie base de données contenant deux cabinets aux enregistrements
          délibérément semblables.
        </p>
        <div className="mt-2 space-y-2">
          <CommandLine>npm run confidentiality:check</CommandLine>
          <CommandLine>npm run test:integration</CommandLine>
        </div>
      </Callout>
    </div>
  );
}
