import Link from "next/link";

import { Callout, Card } from "@/components/ui";
import { StartPanel } from "@/components/start-panel";
import { requireMatterAccess } from "@/lib/auth/workspace";
import { can } from "@/lib/auth/permissions";
import { actorFor } from "@/lib/auth/session";
import { firmConfiguration } from "@/lib/data/firms";
import { matterTypesForPracticeAreas } from "@/lib/data/catalogues";
import { guidedReadiness } from "@/lib/start/guided";
import { parseStringArray } from "@/lib/json-field";

export const metadata = { title: "Ouvrir un dossier" };
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Orchelio — the short way in.
 *
 * `/matters/new` still exists and still asks for everything: it is the screen
 * for somebody who knows what they want to record. This one is for the first
 * week, and for the firm where nobody thinks of themselves as a computer
 * person. Four answers, and the three things that used to be three screens
 * happen on one button.
 *
 * The steps are listed *above* the form rather than reported after it. A screen
 * that quietly does three things is a screen nobody can predict, and a lawyer
 * who cannot predict a tool will not put a client's file in it.
 */
export default async function StartPage({ searchParams }: PageProps) {
  const { session, firm, scope } = await requireMatterAccess();
  const query = await searchParams;
  const problem = typeof query["problem"] === "string" ? query["problem"] : null;

  const actor = actorFor(session.user, firm.id);
  const configuration = await firmConfiguration(scope);
  const enabled = parseStringArray(configuration?.matterTypes);
  const allTypes = await matterTypesForPracticeAreas(
    parseStringArray(configuration?.practiceAreas),
  );
  const types = allTypes.filter((type) => enabled.includes(type.key));

  const readiness = guidedReadiness({
    canCreateMatter: can(actor, "matter.create"),
    canAddDocuments: can(actor, "document.upload"),
    canRunAnalysis: can(actor, "ai.analysis.run"),
    matterTypes: types.map((type) => type.key),
    aiFeatures: parseStringArray(configuration?.aiFeatures),
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">{firm.name}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Ouvrir un dossier</h1>
        <p className="mt-1 text-ink-muted">
          {
            "Quatre réponses et les fichiers que vous avez. Orchelio fait le reste et vous montre ce qu’il faut vérifier."
          }
        </p>
      </header>

      {problem ? (
        <Callout tone="danger" title="Cela n’a pas abouti" assertive>
          {problem}
        </Callout>
      ) : null}

      <Card
        title="Ce qui se passe quand vous appuyez sur le bouton"
        description="Annoncé avant, pas rapporté après."
      >
        <ol className="space-y-4">
          {readiness.steps.map((step, index) => (
            <li key={step.key} className="flex gap-3">
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  step.will
                    ? "bg-brand text-brand-ink"
                    : "border border-line bg-surface-muted text-ink-subtle"
                }`}
              >
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-ink">
                  {step.will ? step.title : `${step.title} — pas cette fois`}
                </p>
                <p className="mt-0.5 text-sm text-ink-muted">{step.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {readiness.canOpen ? (
        <Card title="Le dossier">
          <StartPanel
            matterTypes={types.map((type) => ({ key: type.key, label: type.label }))}
            canAddDocuments={can(actor, "document.upload")}
          />
        </Card>
      ) : (
        <Callout tone="warning" title="Votre compte ne peut pas faire cela ici">
          <p>{readiness.blocked}</p>
          <p className="mt-2">
            <Link href="/matters" className="font-medium text-brand underline underline-offset-4">
              Voir les dossiers que ce cabinet possède déjà
            </Link>
          </p>
        </Callout>
      )}

      <Card title="La voie longue" description="Toujours là, et parfois la bonne.">
        <p className="text-sm text-ink-muted">
          {
            "Cet écran demande le minimum. Quand vous connaissez déjà les dates, le statut et le reste du détail, "
          }
          <Link href="/matters/new" className="font-medium text-brand underline underline-offset-4">
            le formulaire complet
          </Link>
          {" enregistre tout d’un coup."}
        </p>
      </Card>
    </div>
  );
}
