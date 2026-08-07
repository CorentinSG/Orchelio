import Link from "next/link";

import { Badge, Callout, Card, DataRow } from "@/components/ui";
import { formatDate } from "@/components/matter-ui";
import { requireWorkspacePermission } from "@/lib/auth/workspace";
import { listRecentAnalyses } from "@/lib/data/analyses";
import { firmConfiguration } from "@/lib/data/firms";
import { firmTimezone } from "@/lib/format/dates";
import { formatCost, usageSummary } from "@/lib/data/usage";
import { parseStringArray } from "@/lib/json-field";
import { AI_FEATURE_OPTIONS } from "@/lib/onboarding/catalogue";
import { LOCKED_APPROVALS } from "@/lib/constants";
import { reviewStatusLabel, type ReviewStatus } from "@/lib/ai/types";
import { providerNotice } from "@/lib/ai/notice";
import { serverEnv } from "@/lib/env";

export const metadata = { title: "Assistant" };
export const dynamic = "force-dynamic";

const LOCKED_RULES_NOTE =
  `Les ${LOCKED_APPROVALS.length} règles verrouillées sont enregistrées dans la configuration de ` +
  "chaque cabinet : la garantie est vérifiable dans les données plutôt qu’affirmée dans un " +
  "commentaire. La page Validations les applique.";

/**
 * Orchelio — the AI workspace.
 *
 * Deliberately as much about what Claude does *not* do as about what it does.
 * A page listing analyses with no statement of their limits invites a reader to
 * treat them as findings, which is the failure this whole design is arranged
 * to prevent.
 */
export default async function AiWorkspacePage() {
  const { firm, scope } = await requireWorkspacePermission("/ai", "ai.result.view");

  const [analyses, configuration, usage] = await Promise.all([
    listRecentAnalyses(scope, 20),
    firmConfiguration(scope),
    usageSummary(scope),
  ]);

  const enabled = parseStringArray(configuration?.aiFeatures);
  const timezone = firmTimezone(configuration?.timezone);
  const env = serverEnv();
  const notice = providerNotice(env);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">{firm.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Assistant</h1>
        <p className="mt-1 text-ink-muted">
          Toutes les analyses lancées par ce cabinet, et les limites que chacune d’elles porte.
        </p>
      </header>

      <Callout tone="ai" title={notice.workspaceTitle}>
        <p>
          Le fournisseur est <code className="font-mono">{env.aiProvider}</code>. {notice.whereItGoes}
        </p>
        <p className="mt-2">{notice.howItIsProduced}</p>
      </Callout>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Ce que ce cabinet a demandé" description="Choisi à l’étape 5 du questionnaire d’installation.">
          {enabled.length === 0 ? (
            <Callout tone="warning" title="Rien n’est activé">
              <p>
                Ce cabinet n’a activé aucune fonction de l’assistant, donc une analyse n’a rien à
                produire.
              </p>
              <p className="mt-2">
                <Link
                  href="/onboarding/5"
                  className="font-medium text-brand underline underline-offset-4"
                >
                  Les choisir dans l’installation du cabinet
                </Link>
              </p>
            </Callout>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {enabled.map((feature) => (
                <li key={feature}>
                  <Badge tone="ai">{featureLabel(feature)}</Badge>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm text-ink-subtle">
            Une analyse ne produit que pour les fonctions de cette liste. Une fonction activée qui
            ne trouve rien le dit ; une fonction désactivée n’est pas mentionnée du tout.
          </p>
        </Card>

        <Card title={notice.usageCardTitle} description="Ce cabinet uniquement.">
          <dl>
            <DataRow label="Analyses lancées" value={usage.analyses} />
            <DataRow label="Relectures effectuées" value={usage.reviews} />
            <DataRow label="Jetons en entrée" value={usage.inputTokens.toLocaleString("fr-FR")} />
            <DataRow label="Jetons en sortie" value={usage.outputTokens.toLocaleString("fr-FR")} />
            <DataRow label={notice.costLabel} value={formatCost(usage.costCents)} />
            <DataRow
              label="Frais réels inclus"
              value={usage.includesRealCharges ? "Oui" : notice.noCharges}
            />
          </dl>
        </Card>
      </div>

      <Card
        title={`Analyses (${analyses.length})`}
        description="Les plus récentes d’abord. Chacune doit être lue par une personne."
      >
        {analyses.length === 0 ? (
          <Callout tone="neutral" title="Rien n’a encore été lancé">
            Ouvrez un dossier et utilisez son onglet Analyse.
          </Callout>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted">
                  <th className="py-2 pr-4 font-medium">Dossier</th>
                  <th className="py-2 pr-4 font-medium">Lancée</th>
                  <th className="py-2 pr-4 font-medium">État</th>
                  <th className="py-2 pr-4 font-medium">Relecture</th>
                  <th className="py-2 font-medium">Lecture par une personne</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {analyses.map((analysis) => (
                  <tr key={analysis.id} className="align-top">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/matters/${analysis.matterId}?tab=analysis`}
                        className="group block"
                      >
                        <span className="font-mono text-xs text-ink-subtle">
                          {analysis.matter.reference}
                        </span>
                        <span className="block font-medium text-ink group-hover:text-brand">
                          {analysis.matter.title}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">{formatDate(analysis.startedAt, timezone)}</td>
                    <td className="py-3 pr-4">
                      <Badge
                        tone={
                          analysis.status === "completed"
                            ? "success"
                            : analysis.status === "failed"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {analysisStateLabel(analysis.status)}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      {analysis.reviews[0] ? (
                        <Badge
                          tone={
                            analysis.reviews[0].status === "approved_for_human_review"
                              ? "success"
                              : "warning"
                          }
                        >
                          {reviewStatusLabel(analysis.reviews[0].status as ReviewStatus)}
                        </Badge>
                      ) : (
                        <span className="text-ink-subtle">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      {/* Read from the row, never asserted by this page. */}
                      <Badge tone="warning">
                        {analysis.reviews[0]?.humanReviewRequired === false ? "Non requise" : "Obligatoire"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Ce que l’assistant ne peut jamais faire ici"
        description="Neuf règles impossibles à désactiver, dans ce cabinet comme dans tout autre."
      >
        <ul className="ml-4 list-disc space-y-1 text-sm text-ink-muted">
          <li>Conclure sur une éligibilité, ou donner un conseil juridique, sans qu’une personne décide.</li>
          <li>Confirmer une échéance. Chaque date affichée a été enregistrée par quelqu’un, pas vérifiée par Orchelio.</li>
          <li>Déposer quoi que ce soit, envoyer quoi que ce soit, ou communiquer avec un client ou une partie adverse.</li>
          <li>Supprimer définitivement quoi que ce soit, ou lever un conflit d’intérêts.</li>
        </ul>
        {/* One template string, not interpolation between JSX children: JSX
            collapses the whitespace around an expression and renders
            "9locked rules". Paid for twice already — see docs/ROADMAP.md. */}
        <p className="mt-4 text-sm text-ink-subtle">{LOCKED_RULES_NOTE}</p>
      </Card>
    </div>
  );
}

/** The stored run states, in the reader's language. An unknown value shows as stored. */
function analysisStateLabel(status: string): string {
  switch (status) {
    case "completed":
      return "terminée";
    case "failed":
      return "échouée";
    case "running":
      return "en cours";
    default:
      return status;
  }
}

function featureLabel(key: string): string {
  const direct = AI_FEATURE_OPTIONS.find(
    (option) => option.key.default === key || option.id === key,
  );
  if (direct) return direct.label;
  const variant = AI_FEATURE_OPTIONS.find((option) =>
    Object.values(option.key.byPracticeArea ?? {}).includes(key),
  );
  return variant?.label ?? key.split("_").join(" ");
}
